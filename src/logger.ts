export function installLog(name: PackageName, version: Version) {
  console.log(`[Installed] ${name}@${version}`)
}

export function resolveByManifestLog(name: PackageName, vc: VersionConstraint, version: Version) {
  console.log(`[Resolve by manifest] ${name}@${vc} to ${version}`)
}

export function resolveByLockfile(name: PackageName, vc: VersionConstraint, version: Version) {
  console.log(`[Resolve by lockfile] ${name}@${vc} to ${version}`)
}
