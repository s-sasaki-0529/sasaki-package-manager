import { Command } from 'commander'

const program = new Command()

program
  .command('install')
  .argument('[packageNames...]')
  .action(packageNames => {
    const options = program.opts()
    console.log({ command: 'install', packageNames, options })
  })

program
  .option('--production', 'devDependencies のインストールを省略する')
  .option('--save-dev', 'パッケージを devDependencies に追加する')
  .parse()
