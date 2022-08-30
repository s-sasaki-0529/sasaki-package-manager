import { mkdir } from 'fs/promises'
import fetch from 'node-fetch'
import * as semver from 'semver'
import * as tar from 'tar'
import { installLog } from './logger.js'
import { fetchPackageManifest } from './manifest.js'

const DEFAULT_DOWNLOAD_DIR = `${process.cwd()}/node_modules`

export async function savePackageTarball(name: PackageName, vc: VersionConstraint = '*') {
  const manifest = await fetchPackageManifest(name)
  const versions = Object.keys(manifest.versions)
  const version = semver.maxSatisfying(versions, vc)

  const path = `${DEFAULT_DOWNLOAD_DIR}/${manifest.name}`
  mkdir(path, { recursive: true })

  const tarballUrl = manifest.versions[version].dist.tarball
  const tarResponse = await fetch(tarballUrl)
  tarResponse.body?.pipe(tar.extract({ cwd: path, strip: 1 }))

  installLog(name, version)
}
