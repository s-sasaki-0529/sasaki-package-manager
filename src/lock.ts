import { writeFile } from 'fs/promises'
import { fetchPackageManifest } from './manifest.js'

const LOCK_FILE_PATH = `${process.cwd()}/tiny-pm.lock`

/**
 * 現在の lock ファイルの内容で読み取り用
 */
const currentLockFile: LockFile = {}

/**
 * 更新用の lock ファイルの内容で書き込み用
 */
const newLockFile: LockFile = {}

export async function addLockFile(packageName: PackageName, vc: VersionConstraint, version: Version) {
  const manifest = await fetchPackageManifest(packageName)
  const info = manifest.versions[version]
  newLockFile[`${packageName}@${vc}`] = {
    version,
    url: info.dist.tarball,
    shasum: info.dist.shasum,
    dependencies: info.dependencies || {}
  }
}

export async function writeLockFile() {
  const lockFileJson = JSON.stringify(newLockFile, null, 2)
  console.log(lockFileJson)
  return writeFile(LOCK_FILE_PATH, lockFileJson, 'utf8')
}
