const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, '../.github/workflows', name), 'utf8');

test('development automation uses the shared OpenAI contract and queues issue runs', () => {
  const workflow = read('develop.yml');
  assert.match(workflow, /uses: vinnitog\/brd-ci\/\.github\/workflows\/develop\.yml@main/);
  assert.match(workflow, /provider: openai/);
  assert.match(workflow, /types: \[labeled\]/);
  assert.match(workflow, /github\.event\.label\.name == 'trello-auto'/);
  assert.match(workflow, /cancel-in-progress: false/);
});

test('automation scopes Trello credentials to development, not review', () => {
  for (const file of ['develop.yml', 'review.yml']) {
    const workflow = read(file);
    const references = [...workflow.matchAll(/secrets\.([A-Z_]+)/g)].map(match => match[1]);
    const expected = file === 'develop.yml' ? ['OPENAI_API_KEY', 'TRELLO_API_KEY', 'TRELLO_TOKEN'] : ['OPENAI_API_KEY'];
    assert.deepEqual(references, expected, file);
    assert.doesNotMatch(workflow, /secrets: inherit|id-token:/, file);
  }
  assert.match(read('review.yml'), /uses: vinnitog\/brd-ci\/\.github\/workflows\/review\.yml@main/);
  assert.match(read('review.yml'), /branches: \[develop\]/);
});
