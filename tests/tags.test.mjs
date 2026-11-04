// Tag tidying for portfolio photos (functions/_lib/tags.js). Run: npm run test:tags
import assert from 'node:assert/strict';
import { normalizeTags, tagsToColumn, columnToTags, MAX_TAGS } from '../functions/_lib/tags.js';

assert.deepEqual(normalizeTags(' Truck Wrap, FORD,  palm   trees ,, '), ['truck wrap', 'ford', 'palm trees']);
assert.deepEqual(normalizeTags(['#Ford', 'ford', 'FORD']), ['ford']); // duplicates and # removed
assert.deepEqual(normalizeTags('boat, #Sarasota, # keys'), ['boat', 'sarasota', 'keys']); // # after a space too
assert.deepEqual(normalizeTags(['a,b']), ['a b']); // a comma can't sneak into one tag
assert.deepEqual(normalizeTags('x'.repeat(50)), ['x'.repeat(30)]);
assert.equal(normalizeTags(Array.from({ length: 40 }, (_, i) => `t${i}`)).length, MAX_TAGS);
assert.deepEqual(normalizeTags(null), []);
assert.deepEqual(normalizeTags({ evil: true }), []);
assert.equal(tagsToColumn('Boat, Sarasota'), 'boat,sarasota');
assert.deepEqual(columnToTags('boat,sarasota'), ['boat', 'sarasota']);
assert.deepEqual(columnToTags(''), []);
assert.deepEqual(columnToTags(null), []);
console.log('tags: 12 checks passed');
