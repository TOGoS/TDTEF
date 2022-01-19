# TOGoS's TypeScript TEF Library

For parsing (and probably eventually emitting, converting to other formats, etc)
[TOGoS's Entry Format](http://github.com/TOGoS/TEF/) streams.

The main module file (tef.ts) has no imports
and does not use any Deno-specific features, so should be useable
from both Deno and the tsc compiler.

To parse a TEF stream, make it into an `AsyncIterable<Uint8Array)>` and pass it to
`parseTefPieces` which will return an `AsyncIterable<TEFPiece>`.
See [tef.test.ts](./tef.test.ts) for some examples.

To run tests:

```
deno test --allow-read=_testdata .
```
