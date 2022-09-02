import * as semver from 'semver'
import { addLockFile, readLockedPackageInfo } from './lockJson.js'
import { conflictLog, resolveByLockfile, resolveByManifestLog } from './logger.js'
import { fetchPackageManifest } from './npm.js'

/**
 * 指定したパッケージの最新バージョンを返す
 */
export async function resolvePackageLatestVersion(packageName: string): Promise<Version> {
  const latestPackageInfo = await resolvePackage(packageName, '*')
  if (!latestPackageInfo) throw new Error(`Package not found: ${packageName}`)
  return latestPackageInfo.version
}

/**
 * 指定したパッケージ及びバージョン制約から、最適なバージョンのパッケージ情報を返す
 * 先に sasaki-pm.lock.json から解決できるかを確認し、なければ npm manifest を取得して解決する
 */
export async function resolvePackage(packageName: PackageName, vc: VersionConstraint): Promise<ResolvedPackageInfo> {
  const lockedPackageInfo = readLockedPackageInfo(packageName, vc)
  if (lockedPackageInfo) {
    resolveByLockfile(packageName, vc, lockedPackageInfo.version)
    return lockedPackageInfo
  }

  const manifest = await fetchPackageManifest(packageName)
  const version = semver.maxSatisfying(Object.keys(manifest.versions), vc)
  if (!manifest.versions[version]) {
    throw new Error(`Satisfied version not found: ${packageName}@${vc}`)
  }

  resolveByManifestLog(packageName, vc, version)
  return {
    version,
    url: manifest.versions[version].dist.tarball,
    shasum: manifest.versions[version].dist.shasum,
    dependencies: manifest.versions[version].dependencies || {}
  }
}

/**
 * パッケージのバージョン解決を再帰的に行い、依存パッケージの依存パッケージまで深さ優先で解決していく
 */
export async function collectDepsPackageList(
  name: PackageName,
  vc: VersionConstraint,
  rootDependenciesMap: Readonly<DependenciesMap>, // ルートパッケージから直接依存するパッケージリスト
  topLevelList: DependenciesMap, // node_modules 直下にインストールするパッケージリスト
  conflictedList: ConflictedPackageInfo[], // node_modules 直下とバージョン衝突が起こったパッケージリスト
  dependencyStack: PackageName[] // 現在解決中のパッケージに依存するパッケージ名のスタック
) {
  // 自身のパッケージ名を依存スタックに積み上げる
  dependencyStack.push(name)

  // 自身のパッケージバージョンを解決する
  const packageInfo = await resolvePackage(name, vc)

  // 解決結果を Lock ファイルに書き出す
  addLockFile(name, vc, packageInfo)

  // 解決したパッケージをどこに保存するかを後述のアルゴリズムに従って決定する
  const topLevelExists = !!topLevelList[name]
  const isCompatibleToTopLevel = topLevelExists && semver.satisfies(topLevelList[name], vc)
  const isRootDependency = dependencyStack.length === 1

  // 1. 初出パッケージで、自身がルートからの依存であればトップレベルに追加
  if (!topLevelExists && isRootDependency) {
    topLevelList[name] = packageInfo.version
  }
  // 2. 初出パッケージで、ルートからの依存が存在しなければ自身をトップレベルに追加
  else if (!topLevelExists && !rootDependenciesMap[name]) {
    topLevelList[name] = packageInfo.version
  }
  // 3. 初出パッケージで、ルートからの依存が存在するが
  else if (!topLevelExists && rootDependenciesMap[name]) {
    const rootDependencyVersion = (await resolvePackage(name, rootDependenciesMap[name])).version
    // 3-1. 自身と互換性のあるバージョンであればスルー
    if (semver.satisfies(rootDependencyVersion, vc)) {
      // 何もしない
    }
    // 3-2. 自身と互換性がないバージョンであれば、衝突リストに追加
    else {
      conflictLog(name, vc, rootDependenciesMap[name])
      conflictedList.push({ name, version: packageInfo.version, parent: dependencyStack[dependencyStack.length - 2] })
    }
  }
  // 4. 既出パッケージで、自身と互換性のあるバージョンであればスルー
  else if (topLevelExists && isCompatibleToTopLevel) {
    // 何もしない
  }
  // 5. 既出パッケージで、自身と互換性がないバージョンであれば、衝突リストに追加
  else {
    conflictLog(name, vc, rootDependenciesMap[name])
    conflictedList.push({ name, version: packageInfo.version, parent: dependencyStack[dependencyStack.length - 2] })
  }

  // 自身が依存する各パッケージに対して再帰的に同様の操作を行う
  for (const [depName, depVersion] of Object.entries(packageInfo.dependencies)) {
    await collectDepsPackageList(
      depName,
      depVersion,
      rootDependenciesMap,
      topLevelList,
      conflictedList,
      dependencyStack
    )
  }

  // 自身及び自身が依存する全てのパッケージの解決が完了したのでスタックから取り除く
  dependencyStack.pop()
}
