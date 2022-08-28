import { readFile } from 'fs/promises'
import { findUp } from 'find-up'

export async function findPackageJsonPath() {
  return findUp('package.json')
}

export async function parsePackageJson(path: string): Promise<PackageJson> {
  return new Promise(resolve => {
    readFile(path)
      .then(data => {
        const json = JSON.parse(data.toString())
        resolve({
          dependencies: json.dependencies,
          devDependencies: json.devDependencies
        })
      })
      .catch(() => {
        resolve({
          dependencies: {},
          devDependencies: {}
        })
      })
  })
}
