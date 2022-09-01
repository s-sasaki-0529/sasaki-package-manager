// パッケージ名
type PackageName = string

// バージョン制約(e.g. '^1.0.0')
type VersionConstraint = string

// バージョン(e.g. '1.0.0')
type Version = string // e.g. '1.0.0'

// 依存パッケージ名とバージョン制約のマップ
type DependenciesMap = {
  [name: PackageName]: VersionConstraint | Version
}

// dependencies / devDependencies それぞれのマップ
type PackageDependencyMap = {
  dependencies: DependenciesMap
  devDependencies: DependenciesMap
}

type ConflictedPackageInfo = {
  name: PackageName
  version: Version
  parent: PackageName
}

// 解決済みのパッケージ情報
type LockedPackageInfo = {
  version: Version
  url: string
  shasum: string
  dependencies: DependenciesMap
}

// 解決済みパッケージ情報一覧(≒ tiny-pm.lock)
type LockFile = {
  [dependency: `${PackageName}@${VersionConstraint}`]: LockedPackageInfo
}

// npm リポジトリから取得できるマニフェストの型(必要分のみ定義)
// e.g. https://registry.npmjs.org/axios
type NpmManifest = {
  name: PackageName
  'dist-tags': {
    latest: Version
  }
  versions: {
    [version: Version]: {
      dist: {
        tarball: string
        shasum: string
      }
      dependencies: DependenciesMap
    }
  }
}
