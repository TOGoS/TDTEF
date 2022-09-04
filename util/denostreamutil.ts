/*
 * Utilities for converting Deno Readers and files into
 * AsyncIterable<Uint8Array>s so that the TEF library may consume them.
 */

import { FilePath } from '../_util/synx.ts';
import { AsyncBlobLike1 } from '../_util/BlobLike1.ts';
export type { AsyncBlobLike1 } from '../_util/BlobLike1.ts';

// TODO: Unit test somehow
// - Make sure that we can iterate over a file repeatedly
export function fileToIterable(filePath : FilePath, buffer?:Uint8Array) : AsyncIterable<Uint8Array> {
	return {
		[Symbol.asyncIterator]: async function*() {
			const bufferReuseAllowed = buffer != undefined;
			if( buffer == undefined || buffer.length == 0 ) {
				buffer = new Uint8Array(65536);
			}
			const bufferSlice = (bufferReuseAllowed ? buffer.subarray : buffer.slice).bind(buffer);
			
			const reader = await Deno.open(filePath, {read:true});
			try {
				let readCount : number|null;
				while( (readCount = await reader.read(buffer)) != null ) {
					yield( bufferSlice(0, readCount) );
				}
			} finally {
				reader.close();
			}
		}
	}
}

// TODO: Unit test somehow
// - Make sure that second call to [Symbol.asyncIterator] throws an error
export function readerToIterable(reader : Deno.Reader, buffer? : Uint8Array) : AsyncIterable<Uint8Array> {
	const bufferReuseAllowed = buffer != undefined;
	if( buffer == undefined || buffer.length == 0 ) {
		buffer = new Uint8Array(65536);
	}

	const bufferSlice = (bufferReuseAllowed ? buffer.subarray : buffer.slice).bind(buffer);
	const _buffer = buffer;
	let started = false;
	return {
		[Symbol.asyncIterator]: async function*() {
			if( started ) {
				throw new Error("Can't create new iterator for stream; [Symbol.asyncIterator] already called previously")
			}
			started = true;
			let readCount : number|null;
			while( (readCount = await reader.read(_buffer)) != null ) {
				yield( bufferSlice(0, readCount) );
			}
		}
	}
}

export class FileBlobLike implements AsyncBlobLike1 {
	constructor(protected _filePath:FilePath) {}
	
	public get filePath() { return this._filePath; }
	
	public getChunkIterable(buffer?:Uint8Array) : AsyncIterable<Uint8Array> {
		return fileToIterable(this._filePath, buffer);
	}
}
