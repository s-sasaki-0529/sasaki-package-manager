export function installLog(name: PackageName, version: Version, path: string) {
  console.log(`[Installed] ${name}@${version} > ${path}`)
}

export function resolveByManifestLog(name: PackageName, vc: VersionConstraint, version: Version) {
  console.log(`[Resolve by manifest] ${name}@${vc} to ${version}`)
}

export function resolveByLockfile(name: PackageName, vc: VersionConstraint, version: Version) {
  console.log(`[Resolve by lockfile] ${name}@${vc} to ${version}`)
}

export function conflictLog(name: PackageName, vc: VersionConstraint, rootVc: VersionConstraint) {
  console.log(`[Conflict with root] ${name}@${vc} is conflicted with ${rootVc}`)
}
