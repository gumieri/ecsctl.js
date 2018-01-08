const AWS = require('aws-sdk')
const flags = require('commander')

const editor = require('./lib/editor')

flags
  .version('0.0.1')
  .option('--task-definition [name]', 'Task Definition name')
  .option('--service [name]', 'Service name')
  .option('--editor [name]', 'Editor name or command to execute')
  .option('--deploy', 'To update and deploy the changes')
  .parse(process.argv)

const fatal = err => {
  console.log(err)
  return process.exit(1)
}

const ecs = new AWS.ECS({ apiVersion: '2014-11-13' })
ecs.describeTaskDefinition({ taskDefinition: flags.taskDefinition }, (err, data) => {
  if (err) return fatal(err)

  let currentRevison = data.taskDefinition.revision
  let dataToBeEdited = Object.assign({}, data.taskDefinition)

  delete dataToBeEdited.requiresAttributes
  delete dataToBeEdited.taskDefinitionArn
  delete dataToBeEdited.compatibilities
  delete dataToBeEdited.revision
  delete dataToBeEdited.status

  let editorParams = {
    editor: flags.editor || process.env.EDITOR,
    filename: `${flags.taskDefinition}-task-definition-`,
    content: JSON.stringify(dataToBeEdited, null, 2),
    extension: 'json'
  }

  editor.edit(editorParams, (err, editedBuffer) => {
    if (err) return fatal(err)

    if (editedBuffer == false) {
      console.log('Empty entry')
      return process.exit(1)
    }

    let edited = JSON.parse(editedBuffer)

    if (!flags.deploy) return process.exit()

    ecs.registerTaskDefinition(edited, err => {
      if (err) return fatal(err)

      ecs.deregisterTaskDefinition({ taskDefinition: `${escedit.taskDefinition}:${currentRevison}` }, err => {
        if (err) return fatal(err)
        return process.exit()
      })
    })
  })
})
