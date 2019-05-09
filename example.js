const { generate, resolve } = require('./')
const hyperdrive = require('hyperdrive')
const ram = require('random-access-memory')

const drive = hyperdrive(ram)
const buffer = Buffer.from('hello world')
const filename = 'hello.txt'

drive.writeFile(filename, buffer, onwrite)

function onwrite(err) {
  if (err) {
    return console.error(err)
  }

  generate(drive, filename, ongenerate)
  drive.writeFile(filename, 'bar')
}

function ongenerate(err, uri) {
  if (err) {
    return console.error(err)
  }

  console.log(uri);
  resolve(drive, uri, onresolve)
}

function onresolve(err, checkout, filename) {
  readFile(checkout, filename)
}

function readFile(checkout, filename) {
  checkout.readFile(filename, (err, buf) => console.log('%s %s', err, buf))
}
