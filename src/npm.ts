import { mkdir } from 'fs/promises'
import fetch from 'node-fetch'
import * as semver from 'semver'
import * as tar from 'tar'
import { resolveLog } from './logger.js'

const REPOSITORY_URL = 'https://registry.npmjs.org'
const DEFAULT_DOWNLOAD_DIR = `${process.cwd()}/node_modules`

export async function fetchPackageManifest(name: PackageName): Promise<NpmManifest> {
  const manifestUrl = `${REPOSITORY_URL}/${name}`
  const manifest = (await fetch(manifestUrl).then(res => res.json())) as NpmManifest
  return manifest
}

export async function savePackageTarball(name: PackageName, vc: VersionConstraint = '*') {
  const manifest = await fetchPackageManifest(name)
  const versions = Object.keys(manifest.versions)
  const version = semver.maxSatisfying(versions, vc)

  const path = `${DEFAULT_DOWNLOAD_DIR}/${manifest.name}`
  mkdir(path, { recursive: true })

  const tarballUrl = manifest.versions[version].dist.tarball
  const tarResponse = await fetch(tarballUrl)
  tarResponse.body?.pipe(tar.extract({ cwd: path, strip: 1 }))

  resolveLog(name, vc, version)
}
