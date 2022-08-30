import { readFile, writeFile } from 'fs/promises'
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
  const packageInfo: LockedPackageInfo = {
    version,
    url: info.dist.tarball,
    shasum: info.dist.shasum,
    dependencies: info.dependencies || {}
  }
  newLockFile[`${packageName}@${vc}`] = packageInfo
  return packageInfo
}

export function readLockedPackageInfo(name: PackageName, vc: VersionConstraint): LockedPackageInfo | null {
  const packageInfo = currentLockFile[`${name}@${vc}`]
  if (packageInfo) {
    return {
      version: packageInfo.version,
      url: packageInfo.url,
      shasum: packageInfo.shasum,
      dependencies: packageInfo.dependencies
    }
  } else {
    return null
  }
}

export async function readLockFile() {
  const buffer = await readFile(LOCK_FILE_PATH, 'utf8').catch(e => {
    if (e.code === 'ENOENT') return '{}'
    throw e
  })
  const lockFile = JSON.parse(buffer) as LockFile
  Object.assign(currentLockFile, lockFile)
  return currentLockFile
}

export async function writeLockFile() {
  const lockFileJson = JSON.stringify(newLockFile, null, 2)
  return writeFile(LOCK_FILE_PATH, lockFileJson, 'utf8')
}
