import { mkdir, writeFile } from 'fs/promises'
import fetch from 'node-fetch'
import * as tar from 'tar'

const REPOSITORY_URL = 'https://registry.npmjs.org'
const DEFAULT_DOWNLOAD_DIR = `${process.cwd()}/node_modules`

export async function fetchPackageManifest(name: PackageName): Promise<NpmManifest> {
  const manifestUrl = `${REPOSITORY_URL}/${name}`
  const manifest = (await fetch(manifestUrl).then(res => res.json())) as NpmManifest
  return manifest
}

export async function savePackageTarball(manifest: NpmManifest, version?: Version, dir = DEFAULT_DOWNLOAD_DIR) {
  version ||= manifest['dist-tags'].latest
  const tarballUrl = manifest.versions[version].dist.tarball
  const path = `${dir}/${manifest.name}`
  mkdir(path, { recursive: true })

  const tarResponse = await fetch(tarballUrl)
  return tarResponse.body?.pipe(tar.extract({ cwd: path, strip: 1 }))
}
