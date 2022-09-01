import { mkdir } from 'fs/promises'
import fetch from 'node-fetch'
import * as tar from 'tar'
import { installLog } from './logger.js'
import { fetchPackageManifest } from './manifest.js'

export async function savePackageTarball(name: PackageName, version: Version = '*', path: string) {
  const fullPath = `${process.cwd()}/${path}`
  const manifest = await fetchPackageManifest(name)

  mkdir(fullPath, { recursive: true })

  const tarballUrl = manifest.versions[version].dist.tarball
  const tarResponse = await fetch(tarballUrl)
  tarResponse.body?.pipe(tar.extract({ cwd: fullPath, strip: 1 }))

  installLog(name, version, path)
}
