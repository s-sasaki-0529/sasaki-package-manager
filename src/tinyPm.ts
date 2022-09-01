import { readLockFile, writeLockFile } from './lock.js'
import { savePackageTarball } from './npm.js'
import { findPackageJsonPath, parsePackageJson, writePackageJson } from './packageJson.js'
import { collectDepsPackageList, resolvePackage } from './resolver.js'

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

  // package.json のパスを確定する
  const packageJsonPath = await findPackageJsonPath()

  // package.json の内容から依存関係を取得する
  const packageJson = await parsePackageJson(packageJsonPath)
  dependencyMap.dependencies = packageJson.dependencies
  dependencyMap.devDependencies = packageJson.devDependencies

  // lock ファイルも読み込んでおく
  await readLockFile()

  // 追加インストールするパッケージを dependencies または devDependencies に追加する
  // バージョン指定がない場合は、最新バージョンを確認してそれを使用する
  // TODO: バージョン指定がある場合の対応
  for (const packageName of packageNames) {
    const latestPackageInfo = await resolvePackage(packageName, '*')
    const latestVersion = latestPackageInfo?.version
    if (!latestVersion) throw new Error(`Package not found: ${packageName}`)

    if (option.saveDev) {
      dependencyMap.devDependencies[packageName] = `^${latestVersion}`
    } else {
      dependencyMap.dependencies[packageName] = `^${latestVersion}`
    }
  }

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

  // package.json を書き出す
  await writePackageJson(packageJsonPath, dependencyMap)

  // lock ファイルを書き出す
  await writeLockFile()
}
