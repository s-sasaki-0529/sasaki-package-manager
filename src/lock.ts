import { readFile, writeFile } from 'fs/promises'
import { fetchPackageManifest } from './manifest.js'

const LOCK_FILE_PATH = `${process.cwd()}/tiny-pm.lock.json`

// 現在の lock ファイルの内容で読み取り用
const currentLockFile: LockFile = {}

// 更新用の lock ファイルの内容で書き込み用
const newLockFile: LockFile = {}

/**
 * tiny-pm.lock.json を読み込み、メモリに展開する
 */
export async function readLockFile() {
  const buffer = await readFile(LOCK_FILE_PATH, 'utf8').catch(e => {
    if (e.code === 'ENOENT') return '{}'
    throw e
  })
  const lockFile = JSON.parse(buffer) as LockFile
  Object.assign(currentLockFile, lockFile)
  return currentLockFile
}

/**
 * メモリ上の LockFile を tiny-pm.lock.json に書き込む
 */
export async function writeLockFile() {
  const lockFileJson = JSON.stringify(sortLockfile(newLockFile), null, 2)
  return writeFile(LOCK_FILE_PATH, lockFileJson, 'utf8')
}

/**
 * メモリ上の LockFile にパッケージを追加する
 */
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

/**
 * メモリ上の LockFile からパッケージ情報を取得する
 */
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

/**
 * メモリ上の LockFile をキー昇順でソートしたものを返す
 */
function sortLockfile(lockFile: LockFile): LockFile {
  const sortedLockFile: LockFile = {}
  for (const key of Object.keys(lockFile).sort()) {
    sortedLockFile[key] = lockFile[key]
  }
  return sortedLockFile
}
