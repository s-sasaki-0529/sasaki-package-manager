import * as semver from 'semver'
import { resolveLog } from './logger.js'
import { fetchPackageManifest } from './manifest.js'

export async function collectDepsPackageList(
  packageName: PackageName,
  vc: VersionConstraint,
  packageList: DependenciesMap
) {
  // パッケージのマニフェストを取得する
  const manifest = await fetchPackageManifest(packageName)

  // バージョン制約から最新のバージョンを抜き出す
  const version = semver.maxSatisfying(Object.keys(manifest.versions), vc)
  if (!manifest.versions[version]) return packageList

  // インストールリストに自身を追加する
  packageList[packageName] = version
  resolveLog(packageName, vc, version)

  // 依存するパッケージに対して再帰的に同様の操作を行う
  if (manifest.versions[version].dependencies) {
    for (const [depName, depVersion] of Object.entries(manifest.versions[version].dependencies)) {
      packageList = await collectDepsPackageList(depName, depVersion, packageList)
    }
  }

  return packageList
}
