const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, '../.github/workflows', name), 'utf8');

test('development automation uses the shared OpenAI contract and queues issue runs', () => {
  const workflow = read('develop.yml');
  assert.match(workflow, /uses: vinnitog\/brd-ci\/\.github\/workflows\/develop\.yml@42feac9abdaac2e7eeae199237b5425a1204d8b6/);
  assert.match(workflow, /provider: openai/);
  assert.match(workflow, /types: \[labeled\]/);
  assert.match(workflow, /github\.event\.label\.name == 'trello-auto'/);
  assert.match(workflow, /cancel-in-progress: false/);
});

test('automation explicitly scopes utilities and Trello credentials to their callers', () => {
  for (const file of ['develop.yml', 'review.yml']) {
    const workflow = read(file);
    const references = [...workflow.matchAll(/secrets\.([A-Z_]+)/g)].map(match => match[1]);
    const expected = ['OPENAI_API_KEY', 'TECHTOGS_UTILITIES_SSH_KEY'];
    if (file === 'develop.yml') expected.push('TRELLO_API_KEY', 'TRELLO_TOKEN');
    assert.deepEqual(references, expected, file);
    for (const secret of references) {
      assert.ok(workflow.includes(`${secret}: \${{ secrets.${secret} }}`), file);
    }
    assert.doesNotMatch(workflow, /secrets: inherit|id-token:/, file);
  }
  assert.match(read('review.yml'), /uses: vinnitog\/brd-ci\/\.github\/workflows\/review\.yml@42feac9abdaac2e7eeae199237b5425a1204d8b6/);
  assert.match(read('review.yml'), /branches: \[develop\]/);
  assert.match(read('review.yml'), /if: github\.event\.pull_request\.head\.repo\.full_name == github\.repository/);
});

test('fork pull requests run app tests without private utilities or privileged triggers', () => {
  const workflow = read('test.yml');
  assert.match(workflow, /github\.event\.pull_request\.head\.repo\.full_name == github\.repository/);
  assert.doesNotMatch(workflow, /^  (pull_request_target|workflow_run):/m);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /node "\$library\/scripts\/utilities\.mjs" verify --project/);
  assert.match(workflow, /      - run: npm test/);
});
