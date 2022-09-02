import { readLockFile, writeLockFile } from './lockJson.js'
import { installPackage } from './npm.js'
import { findPackageJsonPath, parsePackageJson, writePackageJson } from './packageJson.js'
import { collectDepsPackageList, resolvePackageLatestVersion } from './resolver.js'

type InstallOption = {
  saveDev?: boolean
  production?: boolean
}

/**
 * Usage: sasaki-pm install [packageNames...] [options]
 */
export default async function install(packageNames: PackageName[], option: InstallOption = {}) {
  // インストール対象パッケージ一覧を初期化
  const dependencyMap: PackageDependencyMap = {
    dependencies: {},
    devDependencies: {}
  }

  // カレントディレクトリから上位に向かって最寄りの package.json を探索する
  const packageJsonPath = await findPackageJsonPath()

  // 発見した package.json の内容から依存関係を取得する
  const packageJson = await parsePackageJson(packageJsonPath)
  dependencyMap.dependencies = packageJson.dependencies
  dependencyMap.devDependencies = packageJson.devDependencies

  // 依存解決前に sasaki-pm.lock.json を読み込んでおく
  await readLockFile()

  // コマンドラインオプションで指定された、追加インストールするパッケージを追加する
  // バージョン指定がない場合は、最新バージョンを確認してそれを使用する
  // saveDev オプションが付与されているばあいは devDependencies のほうに追加する
  for (const packageName of packageNames) {
    const hasConstraint = packageName.includes('@')
    const name = hasConstraint ? packageName.split('@')[0] : packageName
    const constraint = hasConstraint ? packageName.split('@')[1] : `^${await resolvePackageLatestVersion(name)}`

    if (option.saveDev) {
      dependencyMap.devDependencies[name] = constraint
    } else {
      dependencyMap.dependencies[name] = constraint
    }
  }

  // production オプションが付与されているばあいは、devDependencies はインストール対象外なので削除しておく
  if (option.production) {
    dependencyMap.devDependencies = {}
  }

  // 各パッケージの依存関係を解決し、最終的にインストールするパッケージ一覧及び保存ディレクトリを決定する
  const rootDependenciesMap: DependenciesMap = { ...dependencyMap.dependencies, ...dependencyMap.devDependencies }
  const topLevelPackageList: DependenciesMap = {}
  const conflictedPackageList: ConflictedPackageInfo[] = []
  for (const [name, constraint] of Object.entries(rootDependenciesMap)) {
    await collectDepsPackageList(name, constraint, rootDependenciesMap, topLevelPackageList, conflictedPackageList, [])
  }

  // node_modules 直下にインストールするパッケージから先にインストール
  for (const name of Object.keys(topLevelPackageList)) {
    await installPackage(name, topLevelPackageList[name], `node_modules/${name}`)
  }

  // node_modules 直下とはバージョンコンフリクトが起こった下位パッケージは、各パッケージディレクトリ以下にインストール
  for (const { name, version, parent } of conflictedPackageList) {
    await installPackage(name, version, `node_modules/${parent}/node_modules/${name}`)
  }

  // 最終的な依存関係を package.json 及び sasaki-pm.lock.json に書き出して完了
  await writePackageJson(packageJsonPath, dependencyMap)
  await writeLockFile()
}
