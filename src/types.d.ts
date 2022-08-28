type PackageName = string
type Version = string

type DependenciesMap = {
  [name: PackageName]: Version
}

type PackageJson = {
  dependencies: DependenciesMap
  devDependencies: DependenciesMap
}

type LockFile = {
  [dependency: `${PackageName}@${Version}`]: {
    version: Version
    url: string
    shasum: string
    dependencies: {
      [name: PackageName]: Version
    }
  }
}
