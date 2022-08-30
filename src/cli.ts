import { Command } from 'commander'
import { install } from './tinyPm.js'

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
  .option('--production', 'devDependencies のインストールを省略する')
  .option('--save-dev', 'パッケージを devDependencies に追加する')
  .parse()
