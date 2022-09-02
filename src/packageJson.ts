import { writeFile, readFile } from 'fs/promises'

const PACKAGE_JSON_PATH = `${process.cwd()}/package.json`

/**
 * package.json を parse し、依存関係オブジェクトを返す
 */
export async function parsePackageJson(): Promise<PackageDependencyMap> {
  const data = await readFile(PACKAGE_JSON_PATH, 'utf-8')
  const json = JSON.parse(data.toString())
  return {
    dependencies: json.dependencies || {},
    devDependencies: json.devDependencies || {}
  }
}

/**
 * package.json を依存関係オブジェクトを用いて書き換える
 */
export async function writePackageJson(dependencyMap: PackageDependencyMap) {
  const data = await readFile(PACKAGE_JSON_PATH)
  const currentJson = JSON.parse(data.toString())
  const newJson = {
    ...currentJson,
    dependencies: dependencyMap.dependencies,
    devDependencies: dependencyMap.devDependencies
  }
  if (Object.keys(newJson.dependencies).length === 0) delete newJson.dependencies
  if (Object.keys(newJson.devDependencies).length === 0) delete newJson.devDependencies
  return writeFile(PACKAGE_JSON_PATH, JSON.stringify(newJson, null, 2))
}
