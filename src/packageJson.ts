import { findUp } from 'find-up'

export async function getPackageJsonPath() {
  return findUp('package.json')
}
