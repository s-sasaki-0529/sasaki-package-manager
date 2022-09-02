import { mkdir } from 'fs/promises'
import fetch from 'node-fetch'
import * as tar from 'tar'
import { installLog } from './logger.js'

// npm レジストリURL
const REGISTRY_URL = 'https://registry.npmjs.org'

// 取得済みの npm マニフェストをメモリにキャッシュするためのマップ
const MANIFEST_CACHE: Record<PackageName, NpmManifest> = {}

/**
 * npm リポジトリからパッケージのマニフェストを取得する
 * 一度取得したマニフェストはキャッシュされ再利用される
 */
export async function fetchPackageManifest(name: PackageName): Promise<NpmManifest> {
  if (!MANIFEST_CACHE[name]) {
    const manifestUrl = `${REGISTRY_URL}/${name}`
    const manifest = (await fetch(manifestUrl).then(res => res.json())) as NpmManifest
    MANIFEST_CACHE[name] = manifest
  }
  return MANIFEST_CACHE[name]
}

/**
 * パッケージの指定バージョンをダウンロードし、tar を解答して指定パスに展開する
 */
export async function savePackageTarball(name: PackageName, version: Version = '*', path: string) {
  const fullPath = `${process.cwd()}/${path}`
  const manifest = await fetchPackageManifest(name)

  mkdir(fullPath, { recursive: true })

  const tarballUrl = manifest.versions[version].dist.tarball
  const tarResponse = await fetch(tarballUrl)
  tarResponse.body?.pipe(tar.extract({ cwd: fullPath, strip: 1 }))

  installLog(name, version, path)
}
