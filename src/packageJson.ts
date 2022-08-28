import { readFile } from 'fs/promises'
import { findUp } from 'find-up'

export async function findPackageJsonPath() {
  return findUp('package.json')
}

export async function parsePackageJson(path: string): Promise<PackageDependencyMap> {
  return readFile(path).then(data => {
    const json = JSON.parse(data.toString())
    return Promise.resolve({
      dependencies: json.dependencies,
      devDependencies: json.devDependencies
    })
  })
}
