const AWS = require('aws-sdk')

const editor = require('../lib/editor')

const ecs = new AWS.ECS({ apiVersion: '2014-11-13' })

const fatal = err => {
  console.log(err.message)
  return process.exit(1)
}

module.exports = (taskDefinition, flags) =>
  ecs.describeTaskDefinition(
    { taskDefinition: taskDefinition },
    (err, data) => {
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
        filename: `${taskDefinition}-task-definition-`,
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

          ecs.deregisterTaskDefinition(
            { taskDefinition: `${taskDefinition}:${currentRevison}` },
            err => {
              if (err) return fatal(err)
              return process.exit()
            }
          )
        })
      })
    }
  )
