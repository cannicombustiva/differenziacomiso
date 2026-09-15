import { describe, it, expect } from 'vitest';
import { urlBase64ToUint8Array } from '@/lib/utils';

/** A P-256 VAPID public key shape: 0x04 (uncompressed point) + 32-byte X + 32-byte Y. */
const P256_PUBLIC_KEY_BYTES = [0x04, ...Array.from({ length: 64 }, (_, i) => (i * 37 + 11) % 256)];

describe('urlBase64ToUint8Array', () => {
  it('decodes a known URL-safe base64 string to the expected bytes', () => {
    // 'SGVsbG8' is "Hello" in base64 with its padding stripped.
    expect(Array.from(urlBase64ToUint8Array('SGVsbG8'))).toEqual([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
  });

  it('reads - and _ as the URL-safe forms of + and /', () => {
    // Standard base64 '+/8=' is bytes fb ff; the URL-safe spelling is '-_8'.
    expect(Array.from(urlBase64ToUint8Array('-_8'))).toEqual([0xfb, 0xff]);
    expect(Array.from(urlBase64ToUint8Array('-_8'))).toEqual(Array.from(urlBase64ToUint8Array('+/8')));
  });

  it.each([
    ['YQ', [0x61]], // two '=' missing
    ['YWI', [0x61, 0x62]], // one '=' missing
    ['YWJj', [0x61, 0x62, 0x63]], // no padding needed
  ])('restores missing padding for %s', (input, expected) => {
    expect(Array.from(urlBase64ToUint8Array(input))).toEqual(expected);
  });

  it('decodes a real-shaped VAPID public key to exactly 65 bytes', () => {
    // The key as web-push prints it: unpadded base64url of the 65-byte point.
    const key = Buffer.from(P256_PUBLIC_KEY_BYTES).toString('base64url');
    expect(key).not.toMatch(/[=+/]/);

    const decoded = urlBase64ToUint8Array(key);

    expect(decoded).toHaveLength(65);
    expect(decoded[0]).toBe(0x04);
    expect(Array.from(decoded)).toEqual(P256_PUBLIC_KEY_BYTES);
  });

  it('returns a Uint8Array backed by its own ArrayBuffer, as PushManager.subscribe expects', () => {
    const decoded = urlBase64ToUint8Array('SGVsbG8');

    expect(decoded).toBeInstanceOf(Uint8Array);
    expect(decoded.buffer).toBeInstanceOf(ArrayBuffer);
    expect(decoded.byteOffset).toBe(0);
    expect(decoded.buffer.byteLength).toBe(decoded.length);
  });
});
