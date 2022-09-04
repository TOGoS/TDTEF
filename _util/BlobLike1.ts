// Copied from tdtypes@0.1/BlobLike1.ts ; may want to publish that library
// and import rather than copying into here.

import { FilePath } from './synx.ts';

export const ALLOW_BUFFER_REUSE = new Uint8Array(0);
Object.freeze(ALLOW_BUFFER_REUSE);

export interface BlobLike1 {
	/** If this blob is backed by a file, filePath is the path to it */
	filePath? : FilePath;
	/**
	 * If this blob is backed by a file,
	 * fileSystemId may contain some unique identifier of the filesystem.
	 */
	fileSystemId?: string;
	/**
	 * Return an [async] iteratable that wil provide the blob's chunks.
	 * 
	 * 3 modes of operation regarding re-use of buffers:
	 * - default (buffer = undefined) :: each chunk is a unique, immutable Uint8Array
	 * - zero-length buffer provided :: iterator may re-use a buffer, but not the one provided
	 * - non-zero-length buffer provided :: iterator may re-use a buffer, and it may be the one provided
	 * 
	 * @param {Uint8Array} [buffer] a buffer into which chunk data MAY be stored.
	 *   If undefined, each Uint8Array from the resulting iterator should be unique and immutable.
	 *   If a buffer is provided, chunks may re-use the same buffer, which MAY
	 *   be the one provided.  If the provided buffer is of length zero,
	 *   (e.g. if ALLOW_BUFFER_REUSE is passed in) then that buffer cannot be used for non-empty
	 *   chunks, and the iterator must provide its own (either unique per chunk).
	 */
	getChunkIterable(buffer?:Uint8Array) : Iterable<Uint8Array>|AsyncIterable<Uint8Array>;
	
	/**
	 * If this blob is backed by an array of Uint8Arrays, here they are
	 */
	chunkArray? : Uint8Array[];
}

/**
 * Same as BlobLike1, but getChunkIterator always returns an AsyncIterable.
 */
export interface AsyncBlobLike1 extends BlobLike1 {
	getChunkIterable(buffer?:Uint8Array) : AsyncIterable<Uint8Array>;
}

export default BlobLike1;
