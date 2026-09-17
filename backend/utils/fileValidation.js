// Magic byte signatures for standard file types
const MAGIC_NUMBERS = {
  jpg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
  gif: [0x47, 0x49, 0x46],
  pdf: [0x25, 0x50, 0x44, 0x46],
  webp: [0x52, 0x49, 0x46, 0x46], // WebP starts with 'RIFF'
};

/**
 * Validates actual binary magic bytes of a file buffer against allowed types.
 * @param {Buffer|Uint8Array} buffer 
 * @param {Array<string>} allowedTypes - e.g. ['jpg', 'png', 'pdf']
 * @returns {boolean}
 */
export function validateMagicBytes(buffer, allowedTypes = ['jpg', 'png', 'webp', 'pdf']) {
  if (!buffer || buffer.length === 0) return false;

  return allowedTypes.some((type) => {
    const signature = MAGIC_NUMBERS[type];
    if (!signature) return false;
    return signature.every((byte, index) => buffer[index] === byte);
  });
}