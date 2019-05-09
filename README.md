dat-deep-link
=============

An experiment to define an URI scheme that uses
[hypercore-strong-link](https://github.com/mafintosh/hypercore-strong-link) for
creating links that pin files to a version.

## Installation

```sh
$ npm install dat-deep-link
```

## URI Format

The URI format extends a traditional _DAT link_ by including the root
hash of the merkle tree of the metadata hypercore feed at the current
version of the archive. The version is included along with the pathspec
that points to the file in the archive.

```
dat://dat-key[@tree-hash][:dat-version][/pathspec]
```

where

* `dat-key` is the public key for the DAT archive. *Required*
* `tree-hash` is the root hash of the merkle tree for the metadata feed.
  at `dat-version` *Optional*
* `dat-version` is the version of the DAT archive that should be checked
  out and verified against
* `pathspec` is the file or directory that should be verified

## Usage

```js
link.generate(drive, '/path/to/file', (err, uri) => {
  link.resolve(drive, uri, (err, checkout, filename) => {
    // do something with drive checkout and filename in uri
  })
})
```

## API

### `link.generate(drive, filename, callback)`

Generate a URI for `filename` in `drive` at `drive.version`
(normalized for hyperdrive@10) calling `callback(err, uri)` where `uri`
is the generated DAT deep link.

```js
link.generate(drive, 'hello.txt', (err, uri) => {
  console.log(uri) // 'dat://...'
})
```

### `link.resolve(drive, uri, callback)`

Resolve and verify `uri` against `drive` calling `callback(err,
checkout, filename, verified)` where `checkout` is a hyperdrive instance
checked out at the version specified in `uri`, `filename` is the
pathspec specified in the `uri`, and `verified` is a boolean indicating
if the `uri` was verified.

```js
const uri = 'dat://e8c2360201afe4acdcee01841179992864564b40bcb23aeb78dd7ba258780d14@0f3a764c72f5a08ea42006b881d923fd5baba9b516bda22e79ca43735c7f6c3f:1/hello.txt'
link.resolve(drive, uri, (err, checkout, filename, verified) => {
  if (verified) {
    checkout.readFile(filename, console.log)
  }
})
```

## License

MIT
