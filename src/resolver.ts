import * as semver from 'semver'
import { addLockFile, readLockedPackageInfo } from './lock.js'
import { resolveByLockfile, resolveByManifestLog } from './logger.js'
import { fetchPackageManifest } from './manifest.js'

export async function resolvePackage(
  packageName: PackageName,
  vc: VersionConstraint
): Promise<LockedPackageInfo | null> {
  // Lock ファイルに既に情報があればそれを利用する
  const lockedPackageInfo = readLockedPackageInfo(packageName, vc)
  if (lockedPackageInfo) {
    resolveByLockfile(packageName, vc, lockedPackageInfo.version)
    return lockedPackageInfo
  }

  // Lock ファイルに情報がなければ、パッケージマニフェストから取得する
  const manifest = await fetchPackageManifest(packageName)
  const version = semver.maxSatisfying(Object.keys(manifest.versions), vc)
  if (!manifest.versions[version]) return null

  resolveByManifestLog(packageName, vc, version)
  return {
    version,
    url: manifest.versions[version].dist.tarball,
    shasum: manifest.versions[version].dist.shasum,
    dependencies: manifest.versions[version].dependencies || {}
  }
}

export async function collectDepsPackageList(
  packageName: PackageName,
  vc: VersionConstraint,
  packageList: DependenciesMap
) {
  // 解決後のパッケージ情報を取得する
  const packageInfo = await resolvePackage(packageName, vc)
  if (!packageInfo) return packageList

  // 解決結果を Lock ファイルに書き出す
  addLockFile(packageName, vc, packageInfo.version)

  // インストールリストに自身を追加する
  packageList[packageName] = packageInfo.version

  // 依存するパッケージに対して再帰的に同様の操作を行う
  for (const [depName, depVersion] of Object.entries(packageInfo.dependencies)) {
    packageList = await collectDepsPackageList(depName, depVersion, packageList)
  }

  return packageList
}
