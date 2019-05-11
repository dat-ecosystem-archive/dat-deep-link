const stronglink = require('hypercore-strong-link')
const encoding = require('dat-encoding')
const assert = require('assert')
const url = require('url')

function resolve(drive, uri, opts, cb) {
  if ('function' === typeof opts) {
    cb = opts
    opts = {}
  }

  assert(drive && 'object' === typeof drive, 'Expecting drive to be an object')
  assert(opts && 'object' === typeof opts, 'Expecting opts to be an object')
  assert(uri && 'string' === typeof uri, 'Expecting uri to be a string')
  assert(cb && 'function' === typeof cb, 'Expecting callback to be a function')

  const { protocol, auth, hostname, host, port, pathname } = url.parse(uri)

  let verified = false
  let version = null
  let key = null

  assert('dat:' === protocol, 'Expecting uri protocol to be dat://')

  if (auth && hostname) {
    assert(64 === auth.length, 'Expecting tree hash to be 64 characters')
    assert(64 === hostname.length, 'Expecting key  to be 64 characters')
  } else {
    assert(64 === hostname.length, 'Expecting dat key to be 64 characters')
  }

  key = encoding.decode(hostname)
  drive.ready(onready)

  function ondone(err) {
    if (err) {
      cb(err)
    } else {
      cb(null, drive, pathname, verified)
    }
  }

  function onready(err) {
    if (err) {
      return ondone(err)
    }

    if (0 !== Buffer.compare(drive.key, key)) {
      return ondone(new Error('Keys do not match in link'))
    }

    version = drive._db ? drive.version - 1 : drive.version

    if (port) {
      version = parseInt(port)

      if (Number.isNaN(version)) {
        return ondone(new TypeError('Invalid version in link'))
      }

      if (version < 0) {
        return ondone(new RangeError('Invalid version in link. Should be >= 0'))
      }

      // ^v10
      if (drive._db) {
        if (version + 1 > drive.version) {
          return ondone(new RangeError('Invalid version in link'))
        }
      } else {
        if (version > drive.version) {
          return ondone(new RangeError('Invalid version in link'))
        }
      }

      drive = drive.checkout(drive._db ? 1 + version : version)
    }

    if (auth && hostname) {
      drive.ready(oncheckout)
    } else {
      ondone(null)
    }
  }

  function oncheckout(err) {
    if (err) {
      return ondone(err)
    }

    if ('number' === typeof version) {
      const feed = key
      const seq = (drive._db ? 2 : 0) + version - 1
      const treeHash = Buffer.from(auth, 'hex')
      stronglink.verify(drive.metadata, { feed, seq, treeHash }, onverify)
    }
  }

  function onverify(err, data) {
    if (err) {
      return ondone(err)
    }

    verified = true
    ondone(null, drive, pathname, verified)
  }
}

function generate(drive, pathspec, cb) {
  assert(drive && 'object' === typeof drive, 'Expecting drive to be an object')
  assert(pathspec && 'string' === typeof pathspec, 'Expecting pathspec to be a string')
  assert(cb && 'function' === typeof cb, 'Expecting callback to be a function')

  drive.ready(onready)

  function onready() {
    drive.stat(pathspec, onstat)
  }

  function onstat(err, stats) {
    if (err) {
      return cb(err)
    }

    if (drive._db) {
      stats.offset += 2
    }

    stronglink.generate(drive.metadata, stats.offset, ongenerate)
  }

  function ongenerate(err, link) {
    if (err) {
      return cb(err)
    }

    if ('/' === pathspec[0]) {
      pathspec = pathspec.slice(1)
    }

    const treeHash = link.treeHash.toString('hex')
    const feed = link.feed.toString('hex')
    const ver = drive._db ? link.seq - 1 : link.seq + 1
    const uri = `dat://${treeHash}@${feed}:${ver}/${pathspec}`

    cb(null, uri)
  }
}

module.exports = {
  generate,
  resolve,
}
