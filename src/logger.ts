export function installLog(name: PackageName, version: Version) {
  console.log(`${name}@${version} installed`)
}

export function resolveLog(name: PackageName, vc: VersionConstraint, version: Version) {
  console.log(`${name}@${vc} resolve to ${version}`)
}
