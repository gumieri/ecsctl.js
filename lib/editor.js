const fs = require('fs')
const tmp = require('tmp')
const childProcess = require('child_process')
const openInEditor = require('open-in-editor')

const edit = ({ editor, filename, content, extension }, callback) =>
  tmp.file({ prefix: filename, postfix: `.${extension}` }, (err, path) => {
    if (err) return callback(err)

    fs.writeFile(path, content, err => {
      if (err) return callback(err)

      if (editor.includes('vim')) return vim({ command: editor, path }, callback)

      openInEditor
        .configure({ editor })
        .open(path)
        .then(() => fs.readFile(path, callback))
        .catch(callback)
    })
  })

const vim = ({ command, path }, callback) => {
  let process = childProcess.spawn(command, [path], { stdio: 'inherit' })

  process.on('exit', (err, code) => {
    if (err) return callback(err)

    return fs.readFile(path, callback)
  })
}

module.exports = { edit }
