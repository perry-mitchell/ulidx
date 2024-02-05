// Code from https://github.com/devbanana/crockford-base32/blob/develop/src/index.ts
import { B32_CHARACTERS } from "./constants.js";

export function crockfordEncode(input: Uint8Array): string {
    const output: number[] = [];
    let bitsRead = 0;
    let buffer = 0;

    const reversedInput = new Uint8Array(input.slice().reverse());

    for (const byte of reversedInput) {
        buffer |= byte << bitsRead;
        bitsRead += 8;

        while (bitsRead >= 5) {
            output.unshift(buffer & 0x1f);
            buffer >>>= 5;
            bitsRead -= 5;
        }
    }

    if (bitsRead > 0) {
        output.unshift(buffer & 0x1f);
    }

    return output.map(byte => B32_CHARACTERS.charAt(byte)).join("");
}

export function crockfordDecode(input: string): Uint8Array {
    const sanitizedInput = input.toUpperCase().split("").reverse().join("");

    const output: number[] = [];
    let bitsRead = 0;
    let buffer = 0;

    for (const character of sanitizedInput) {
        const byte = B32_CHARACTERS.indexOf(character);

        if (byte === -1) {
            throw new Error(`Invalid base 32 character found in string: ${character}`);
        }

        buffer |= byte << bitsRead;
        bitsRead += 5;

        while (bitsRead >= 8) {
            output.unshift(buffer & 0xff);
            buffer >>>= 8;
            bitsRead -= 8;
        }
    }

    if (bitsRead >= 5 || buffer > 0) {
        output.unshift(buffer & 0xff);
    }

    return new Uint8Array(output);
}
