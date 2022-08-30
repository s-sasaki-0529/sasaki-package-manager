import { readLockFile, writeLockFile } from './lock.js'
import { savePackageTarball } from './npm.js'
import { findPackageJsonPath, parsePackageJson } from './packageJson.js'
import { collectDepsPackageList } from './resolver.js'

type InstallOption = {
  saveDev?: boolean
  production?: boolean
}

export async function install(packageNames: PackageName[], option: InstallOption = {}) {
  // インストール対象パッケージ一覧を初期化
  const dependencyMap: PackageDependencyMap = {
    dependencies: {},
    devDependencies: {}
  }

  // package.json を探索し、存在する場合はパッケージ依存関係を読み込む
  const packageJsonPath = await findPackageJsonPath()
  if (packageJsonPath) {
    const packageJson = await parsePackageJson(packageJsonPath)
    dependencyMap.dependencies = packageJson.dependencies
    dependencyMap.devDependencies = packageJson.devDependencies
  }

  // lock ファイルも読み込んでおく
  await readLockFile()

  // 追加インストールするパッケージを dependencies または devDependencies に追加する
  packageNames.forEach(packageName => {
    if (option.saveDev) {
      dependencyMap.devDependencies[packageName] = '*'
    } else {
      dependencyMap.dependencies[packageName] = '*'
    }
  })

  // production only の場合はここで devDependencies を空にすることでインストールをスキップする
  if (option.production) {
    dependencyMap.devDependencies = {}
  }

  // パッケージ一覧それぞれが依存する下位パッケージのバージョンも洗い出して、
  // 最終的なパッケージ一覧を生成する
  const topLevelDependenciesMap: DependenciesMap = { ...dependencyMap.dependencies, ...dependencyMap.devDependencies }
  const fullDependenciesMap: DependenciesMap = { ...topLevelDependenciesMap }
  for (const [name, VersionConstraint] of Object.entries(topLevelDependenciesMap)) {
    await collectDepsPackageList(name, VersionConstraint, fullDependenciesMap)
  }

  // npm リポジトリから各パッケージのインストールを行う
  for (const [name, version] of Object.entries(fullDependenciesMap)) {
    await savePackageTarball(name, version)
  }

  // lock ファイルを書き出す
  await writeLockFile()
}
