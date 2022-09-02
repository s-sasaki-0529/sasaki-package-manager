import { readLockFile, writeLockFile } from './lockJson.js'
import { installPackage } from './npm.js'
import { parsePackageJson, writePackageJson } from './packageJson.js'
import { collectDepsPackageList, resolvePackageLatestVersion } from './resolver.js'

type InstallOption = {
  saveDev?: boolean
  production?: boolean
}

/**
 * Usage: sasaki-pm install [packageNames...] [options]
 */
export default async function install(packageNames: PackageName[], option: InstallOption = {}) {
  // カレントディレクトリにある package.json の内容から依存関係を取得する
  const packageJson = await parsePackageJson()

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
      packageJson.devDependencies[name] = constraint
    } else {
      packageJson.dependencies[name] = constraint
    }
  }

  // dependencies と devDependenciesをマージして、最終的なパッケージリストを生成する
  // ただし、devDependencies は --production オプションが指定されていない場合に限る
  const dependenciesMap: DependenciesMap = { ...packageJson.dependencies }
  if (!option.production) {
    Object.assign(dependenciesMap, packageJson.devDependencies)
  }

  // 各パッケージの依存関係を解決し、最終的にインストールするパッケージ一覧及び保存ディレクトリを決定する
  const topLevelPackageList: DependenciesMap = {}
  const conflictedPackageList: ConflictedPackageInfo[] = []
  for (const [name, constraint] of Object.entries(dependenciesMap)) {
    await collectDepsPackageList(name, constraint, dependenciesMap, topLevelPackageList, conflictedPackageList, [])
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
  await writePackageJson(packageJson)
  await writeLockFile()
}
