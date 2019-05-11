const { generate, resolve } = require('./')
const hyperdrive = require('hyperdrive')
const test = require('tape')
const ram = require('random-access-memory')
const url = require('url')

test('generate(drive, filename, cb)', (t) => {
  const drive = hyperdrive(ram)
  const buffer = Buffer.from('hello world')
  const filename = '/hello.txt'

  drive.writeFile(filename, buffer, onwrite)

  function onwrite(err) {
    t.error(err, 'onwrite(err) is ok')
    generate(drive, filename, ongenerate)
    drive.writeFile(filename, 'new world 1')
    drive.writeFile(filename, 'new world 2')
  }

  function ongenerate(err, uri) {
    t.error(err, 'ongenerate(err, uri) is ok')
    t.ok('string' === typeof uri)
    const { protocol, auth, hostname, port } = url.parse(uri)
    t.equal('dat:', protocol, 'dat:// protocol present in uri')
    t.equal(64, auth.length, 'drive key is present in uri')
    t.ok(hostname === drive.key.toString('hex'), 'drive key matches uri key')
    t.equal(1, parseInt(port), 'correct version given')
    drive.close()
    t.end()
  }
})

test('resolve(drive, uri, cb)', (t) => {
  const drive = hyperdrive(ram)
  const buffer = Buffer.from('hello world')
  const filename = '/hello.txt'

  drive.writeFile(filename, buffer, onwrite)

  function onwrite(err) {
    t.error(err, 'onwrite(err) is ok')
    generate(drive, filename, ongenerate)
    drive.writeFile(filename, 'new world 1')
    drive.writeFile(filename, 'new world 2')
  }

  function ongenerate(err, uri) {
    t.error(err, 'ongenerate(err, uri) is ok')
    resolve(drive, uri, onresolve)
  }

  function onresolve(err, checkout, file) {
    t.error(err, 'onresolve(err, checkout, filename) is ok')
    t.equal(file, filename, 'parsed file matches filename')
    checkout.readFile(file, (err, buf) => {
      t.error(err)
      t.ok(0 === Buffer.compare(buf, buffer), 'reads correct version')
      t.end()
    })
  }
})
