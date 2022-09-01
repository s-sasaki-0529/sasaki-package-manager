/**
 * パッケージマネージャのCLI
 * 現状は install コマンドのみを提供する
 */

import { Command } from 'commander'
import install from './install.js'

const program = new Command()

program
  .command('install')
  .argument('[packageNames...]')
  .action(async packageNames => {
    const options = program.opts()
    await install(packageNames, {
      saveDev: !!options.saveDev,
      production: !!options.production
    })
    process.exit(0)
  })

program
  .option('--production', 'install only dependencies (not devDependencies)')
  .option('--save-dev', 'Package will appear in your devDependencies')
  .parse()
