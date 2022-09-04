// Copied from tdtypes@0.1/synx.ts ; may want to publish that library
// and import rather than copying into here.

export const SCHEMA_SYMBOL = Symbol.for("http://ns.nuke24.net/Synx/schema");

export type FilePath      = string & {[SCHEMA_SYMBOL]?: "http://ns.nuke24.net/Synx/Schema/FilePath"};
