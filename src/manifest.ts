import fetch from 'node-fetch'
const REPOSITORY_URL = 'https://registry.npmjs.org'
const MANIFEST_CACHE: Record<PackageName, NpmManifest> = {}

/**
 * npm リポジトリからパッケージのマニフェストを取得する
 * 一度取得したマニフェストはキャッシュされ再利用される
 */
export async function fetchPackageManifest(name: PackageName): Promise<NpmManifest> {
  if (!MANIFEST_CACHE[name]) {
    const manifestUrl = `${REPOSITORY_URL}/${name}`
    const manifest = (await fetch(manifestUrl).then(res => res.json())) as NpmManifest
    MANIFEST_CACHE[name] = manifest
  }
  return MANIFEST_CACHE[name]
}
