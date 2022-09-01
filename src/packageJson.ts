import { writeFile, readFile } from 'fs/promises'
import { findUp } from 'find-up'

/**
 * package.json を探索し、そのパスを返す
 */
export async function findPackageJsonPath() {
  const path = await findUp('package.json')
  if (!path) throw new Error('package.json not found')
  return path
}

/**
 * package.json を parse し、依存関係オブジェクトを返す
 */
export async function parsePackageJson(path: string): Promise<PackageDependencyMap> {
  const data = await readFile(path, 'utf-8')
  const json = JSON.parse(data.toString())
  return {
    dependencies: json.dependencies || {},
    devDependencies: json.devDependencies || {}
  }
}

/**
 * package.json を依存関係オブジェクトを用いて書き換える
 */
export async function writePackageJson(path: string, dependencyMap: PackageDependencyMap) {
  const data = await readFile(path)
  const currentJson = JSON.parse(data.toString())
  const newJson = {
    ...currentJson,
    dependencies: dependencyMap.dependencies,
    devDependencies: dependencyMap.devDependencies
  }
  if (Object.keys(newJson.dependencies).length === 0) delete newJson.dependencies
  if (Object.keys(newJson.devDependencies).length === 0) delete newJson.devDependencies
  return writeFile(path, JSON.stringify(newJson, null, 2))
}
