//// Iterator Stuff

type AsyncIter<V> = AsyncIterator<V>|AsyncIterable<V>;

//// File Path Stuff

type FilePath = string;

function toFilePath(uri:FilePath|URL) : FilePath {
	uri = uri.toString().replaceAll('\\','/');
	if(
		/^[A-Za-z]:(?:\/|$)/.exec(uri) || //  windows path
		/^[^:]+(?:\/|$)/.exec(uri) // no scheme
	) {
		// Not a URI.
		return uri;
	}
	
	if( !uri.startsWith("file:") ) {
		throw new Error(`'${uri}' appears to be a non-'file:' URI; can't transform it to a file path`);
	}
	
	const filePath = decodeURIComponent(uri.substring(5));
	let m;
	if( (m = /^\/\/\/([A-Za-z]:.*)/.exec(filePath)) != null ) {
		// e.g. "file:///C:/blah blah blah" => "C:/blah blah blah";
		return m[1];
	} else if( (m = /^\/\/(\/.*)/.exec(filePath)) != null ) {
		// e.g. "file:///foo" -> "/foo";
		return m[1];
	} else {
		return filePath;
	}
}

function dirName(uri:FilePath|URL) {
	const filePath = toFilePath(uri);
	const lastSlash = filePath.lastIndexOf('/')
	return lastSlash == -1 ? filePath : filePath.substring(0, lastSlash);
}

//// Other Utilities

function enc(text:string) {
	return new TextEncoder().encode(text);
}

//// The Tests

import { TEFPiece, parseTefPieces, parseLine, parseContentChunkAtBol } from './tef.ts';
import { AsyncBlobLike1, FileBlobLike } from './util/denostreamutil.ts';
import { assertEquals, assertRejects } from "https://deno.land/std@0.119.0/testing/asserts.ts";

type TEFParser = (chunks:AsyncIter<Uint8Array>) => AsyncIterable<TEFPiece>;

const exampleTefFile = "example.tef";

Deno.test("parse example file", async () => {
	const exampleTefBlob = getExampleBlob(exampleTefFile);
		for await(const chunk of parseTefPieces(exampleTefBlob.getChunkIterable())) {
			//console.log(chunk);
		}
});

async function toTefPieceArray(iter:AsyncIterable<TEFPiece>) : Promise<TEFPiece[]> {
	const arr : TEFPiece[] = [];
	const contentBuffer = new Uint8Array(65536);
	let contentPos = 0;

	function flushContentPieces() {
		if( contentPos > 0 ) {
			const data = new Uint8Array(contentBuffer.buffer, 0, contentPos);
			arr.push({
				type: "content-chunk",
				data: data,
			});
			contentPos = 0;
		}
	}

	for await( const piece of iter ) {
		if( piece.type == "content-chunk" ) {
			contentBuffer.set(piece.data, contentPos);
		} else {
			flushContentPieces();
			arr.push(piece);
		}
	}
	flushContentPieces();

	return arr;
}


Deno.test("parseLine(ambiguous)", () => {
	assertEquals(
		parseLine(new TextEncoder().encode("foo"), false),
		{ hint: 3 }
	)
});
Deno.test("parseLine(foo + LF + bar)", () => {
	assertEquals(
		parseLine(new TextEncoder().encode("foo\nbar"), false),
		{ output: "foo", processed: 4 }
	)
});
Deno.test("parseLine(foo + EOF)", () => {
	assertEquals(
		parseLine(enc("foo"), true),
		{ output: "foo", processed: 3 }
	)
});

Deno.test("Parse content chunk at beginning of line", () => {
	assertEquals(
		parseContentChunkAtBol(enc("=foo"), false),
		false,
	)
});
Deno.test("Parse ambiguous chunk at beginning of line", () => {
	assertEquals(
		parseContentChunkAtBol(enc("="), false),
		undefined,
	)
});
Deno.test("Parse escaped equal content chunk at beginning of line", () => {
	assertEquals(
		parseContentChunkAtBol(enc("==foo"), false),
		// { output: enc("=foo"), processed: 5 } // woulc be acceptable
		{ output: enc("="), processed: 2 }
	)
});

function getExampleBlob(name:string) {
	const exampleTefFile = dirName(toFilePath(import.meta.url))+"/_testdata/"+name;
	return new FileBlobLike(exampleTefFile);
}

function parseTefToBuffer(blob:AsyncBlobLike1, bufSize:null|number) : Promise<TEFPiece[]> {
	const buffer =
		bufSize === null ? undefined :
		new Uint8Array(bufSize);
	return toTefPieceArray(parseTefPieces(blob.getChunkIterable(buffer)));
}

Deno.test("parsing with different buffer sizes gives the same result", async () => {
	const bufSizes = [null,0,1,2,3,4,5,10,50,100,1000];

	const exampleBlob = getExampleBlob("example.tef");

	const results = bufSizes.map(bufSize => parseTefToBuffer(exampleBlob, bufSize));

	const result0 = await results[0];

	for( const resProm of results ) {
		const res = await resProm;
		assertEquals( res, result0 );
	}
});

async function ignoreItems(iterable:AsyncIterable<unknown>) {
	for await( const _item of iterable ) { /* do nothing */ }
}

function testParseError(parser:TEFParser, exampleFileName:string, expectInErrorMessage:string) {
	return assertRejects(
		() => ignoreItems(parser(getExampleBlob(exampleFileName).getChunkIterable())),
		undefined,
		expectInErrorMessage
	);
}

Deno.test("parser throws at misplaced header continuation 1", () => {
	return testParseError(parseTefPieces, "bad-header-continuation-1.tef", "header continuation");
});
Deno.test("parser throws at misplaced header continuation 2", () => {
	return testParseError(parseTefPieces, "bad-header-continuation-2.tef", "header continuation");
});
