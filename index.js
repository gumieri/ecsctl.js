const commander = require('commander')

const package = require('./package')

// commands
const edit = require('./commands/edit')
const copyServices = require('./commands/copy_services')

commander.version(package.version)

commander
  .command('task-definition <name>')
  .alias('td')
  .option('--editor [name]', 'Editor name or command to execute')
  .option('--deploy', 'To update and deploy the changes')
  .action(edit)

commander
  .command('copy-services <service...>')
  .alias('cps')
  .option('--deploy', 'To update and deploy the changes')
  .option('--cluster <name>', 'Cluster name')
  .option('--to-cluster <name>', 'Cluster name to be copied the service')
  .action(copyServices)

commander.parse(process.argv)
