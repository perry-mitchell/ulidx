// Adapted from https://github.com/perry-mitchell/ulidx for use with Cloudflare
// Workers and Durable Objects
export type PRNG = () => number;
export type ULID = string;
export type ULIDFactory = () => ULID;

// These values should NEVER change. The values are precisely for
// generating ULIDs.
const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford's Base32
const ENCODING_LEN = ENCODING.length;
const TIME_MAX = Math.pow(2, 48) - 1;
const TIME_LEN = 10;
const RANDOM_LEN = 16;

// The Cloudflare Workers Runtime implements the Web Crypto API (with some
// caveats). It does not provide Node's crypto module.
// Performing cryptographic operations using the Web Crypto API is
// significantly faster than performing them purely in JavaScript.

// Our Pseudo Random Number Generator (PRNG) uses `crypto.getRandomValues`.
export function webCryptoPRNG() {
    const buffer = new Uint8Array(1);
    crypto.getRandomValues(buffer);
    return buffer[0] / 0xff;
}

export function decodeTime(id: string): number {
    if (id.length !== TIME_LEN + RANDOM_LEN) {
        throw new Error("Malformed ULID");
    }
    const time = id
        .substr(0, TIME_LEN)
        .split("")
        .reverse()
        .reduce((carry, char, index) => {
            const encodingIndex = ENCODING.indexOf(char);
            if (encodingIndex === -1) {
                throw new Error(`Time decode error: Invalid character: ${char}`);
            }
            return (carry += encodingIndex * Math.pow(ENCODING_LEN, index));
        }, 0);
    if (time > TIME_MAX) {
        throw new Error(`Malformed ULID: timestamp too large: ${time}`);
    }
    return time;
}

export function encodeRandom(len: number, prng: PRNG): string {
    let str = "";
    for (; len > 0; len--) {
        str = randomChar(prng) + str;
    }
    return str;
}

export function encodeTime(now: number, len: number): string {
    if (isNaN(now)) {
        throw new Error(`Time must be a number: ${now}`);
    } else if (now > TIME_MAX) {
        throw new Error(`Cannot encode a time larger than ${TIME_MAX}: ${now}`);
    } else if (now < 0) {
        throw new Error(`Time must be positive: ${now}`);
    } else if (Number.isInteger(now) === false) {
        throw new Error(`Time must be an integer: ${now}`);
    }
    let mod: number,
        str: string = "";
    for (let currentLen = len; currentLen > 0; currentLen--) {
        mod = now % ENCODING_LEN;
        str = ENCODING.charAt(mod) + str;
        now = (now - mod) / ENCODING_LEN;
    }
    return str;
}

function incrementBase32(str: string): string {
    let done: string | undefined = undefined,
        index = str.length,
        char: string,
        charIndex: number,
        output = str;
    const maxCharIndex = ENCODING_LEN - 1;
    while (!done && index-- >= 0) {
        char = output[index];
        charIndex = ENCODING.indexOf(char);
        if (charIndex === -1) {
            throw new Error("Incorrectly encoded string");
        }
        if (charIndex === maxCharIndex) {
            output = replaceCharAt(output, index, ENCODING[0]);
            continue;
        }
        done = replaceCharAt(output, index, ENCODING[charIndex + 1]);
    }
    if (typeof done === "string") {
        return done;
    }
    throw new Error("Failed incrementing string");
}

export function monotonicFactory(prng?: PRNG): ULIDFactory {
    let currentPRNG = prng || webCryptoPRNG;
    let lastTime: number = 0,
        lastRandom: string;
    return function _ulid(): ULID {
        const seed = Date.now();
        if (seed <= lastTime) {
            const incrementedRandom = (lastRandom = incrementBase32(lastRandom));
            return encodeTime(lastTime, TIME_LEN) + incrementedRandom;
        }
        lastTime = seed;
        const newRandom = (lastRandom = encodeRandom(RANDOM_LEN, currentPRNG));
        return encodeTime(seed, TIME_LEN) + newRandom;
    };
}

export function randomChar(prng: PRNG): string {
    let rand = Math.floor(prng() * ENCODING_LEN);
    if (rand === ENCODING_LEN) {
        rand = ENCODING_LEN - 1;
    }
    return ENCODING.charAt(rand);
}

function replaceCharAt(str: string, index: number, char: string): string {
    if (index > str.length - 1) {
        return str;
    }
    return str.substr(0, index) + char + str.substr(index + 1);
}

export function ulid(seedTime?: number, prng?: PRNG): ULID {
    const currentPRNG = prng || webCryptoPRNG;
    const seed = isNaN(seedTime) ? Date.now() : seedTime;
    return encodeTime(seed, TIME_LEN) + encodeRandom(RANDOM_LEN, currentPRNG);
}
