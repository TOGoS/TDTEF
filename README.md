# TOGoS's TypeScript TEF Library

For parsing (and probably eventually emitting, converting to other formats, etc)
[TOGoS's Entry Format](github.com/TOGoS/TEF/) streams.

The main module file (tef.ts) has no imports
and does not use any Deno-specific features, so should be useable
from both Deno and the tsc compiler.

To run tests:

```
deno test --allow-read=_testdata .
```
