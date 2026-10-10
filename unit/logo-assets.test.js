const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { createHash } = require('node:crypto');
const path = require('node:path');

test('responsive PNGs and preserved institutional matrices match the reviewed bytes and dimensions', () => {
  for (const [name, width, height, hash] of [
    ['brd-logo-on-dark.png', 10869, 2946, 'cb2fe59c2be992fb9a8613632b7e16ce503798eb3e79829d9fdc763549ae12f7'],
    ['brd-logo-on-dark.3da21e7384ec.png', 10869, 2946, '3da21e7384ec40bfe9ab1b5f44cc0d13337f2e89ecbd010f9f32c828449edb13'],
    ['brd-logo-440.e4a543951f97.png', 440, 119, 'e4a543951f97d5cb18b9b35fa1ff69383422aae638a56a8b9059119100f56efc'],
    ['brd-logo-880.07d53b693c9e.png', 880, 239, '07d53b693c9ee91f62104c3d365cd0516889b6e5b784f9b7eb2eb6345906f556'],
  ]) {
    const bytes = readFileSync(path.join(__dirname, '../public/assets', name));
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(bytes.subarray(12, 16).toString(), 'IHDR');
    assert.equal(bytes.readUInt32BE(16), width); assert.equal(bytes.readUInt32BE(20), height);
    assert.equal(bytes[25], 6, 'RGBA alpha is retained, without a matte background.');
    assert.equal(createHash('sha256').update(bytes).digest('hex'), hash);
  }
});
