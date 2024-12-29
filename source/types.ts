export type PRNG = (len: number) => Uint8Array | Buffer;

export type ULID = string;

export type ULIDFactory = (seedTime?: number) => ULID;

export type UUID = string;
