import { savePackageTarball } from './npm.js'
import { findPackageJsonPath, parsePackageJson } from './packageJson.js'

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

  // 追加インストールするパッケージを dependencies または devDependencies に追加する
  packageNames.forEach(packageName => {
    if (option.saveDev) {
      dependencyMap.devDependencies[packageName] = ''
    } else {
      dependencyMap.dependencies[packageName] = ''
    }
  })

  // production の指定がある場合は devDependencies のインストールを省略する
  if (option.production) {
    dependencyMap.devDependencies = {}
  }

  // npm リポジトリから各パッケージのインストールを行う
  // devDependencies については production オプションがある場合は省略
  const installPromises = []
  installPromises.push(
    Object.keys(dependencyMap.dependencies).map(packageName => {
      return savePackageTarball(packageName, dependencyMap.dependencies[packageName])
    })
  )
  if (!option.production) {
    installPromises.push(
      Object.keys(dependencyMap.devDependencies).map(packageName => {
        return savePackageTarball(packageName, dependencyMap.devDependencies[packageName])
      })
    )
  }
  return Promise.all(installPromises)
}
