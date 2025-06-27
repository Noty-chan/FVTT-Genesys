import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'fs';

test('hisuya skills pack file exists', () => {
  assert.ok(fs.existsSync('public/packs/hisuya-skills.db'));
});

test('default compendium constant updated', () => {
  const cfg = fs.readFileSync('src/config.ts', 'utf8');
  assert.ok(cfg.includes("genesys.hisuya-skills"));
});

test('system.yml references hisuya pack', () => {
  const yml = fs.readFileSync('yaml/system.yml', 'utf8');
  assert.ok(yml.includes('name: hisuya-skills'));
});
