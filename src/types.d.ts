// パッケージ名
type PackageName = string

// バージョン制約(e.g. '^1.0.0')
type VersionConstraint = string

// バージョン(e.g. '1.0.0')
type Version = string // e.g. '1.0.0'

// パッケージ名とバージョン制約のマップ
type DependenciesMap = {
  [name: PackageName]: VersionConstraint
}

// dependencies / devDependencies それぞれのマップ
type PackageDependencyMap = {
  dependencies: DependenciesMap
  devDependencies: DependenciesMap
}

// インストール済みパッケージ一覧のロックファイルの構成
type LockFile = {
  [dependency: `${PackageName}@${VersionConstraint}`]: {
    version: Version
    url: string
    shasum: string
    dependencies: DependenciesMap
  }
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
