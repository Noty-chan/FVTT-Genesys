import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SRC = path.join(__dirname, '..', 'packs', 'hisuya-skills', 'skills.json');
const DEST_DIR = path.join(__dirname, '..', 'public', 'packs');
const DEST = path.join(DEST_DIR, 'hisuya-skills.db');

if (!fs.existsSync(SRC)) {
  console.error('Skills JSON not found:', SRC);
  process.exit(1);
}

const skills = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const now = Date.now();

const lines = skills.map((skill) => {
  const data = {
    name: skill.name,
    type: 'skill',
    img: 'icons/svg/item-bag.svg',
    system: {
      description: skill.description,
      source: '',
      characteristic: 'cunning',
      category: skill.category,
      career: false,
      rank: skill.ranks
    },
    effects: [],
    ownership: { default: 0 },
    flags: {},
    _stats: {
      systemId: 'hisuya-genesys',
      systemVersion: '0.2.14',
      coreVersion: '12',
      createdTime: now,
      modifiedTime: now,
      lastModifiedBy: ''
    },
    folder: null,
    sort: 0,
    _id: randomUUID().slice(0, 8)
  };
  return JSON.stringify(data);
});

fs.mkdirSync(DEST_DIR, { recursive: true });
fs.writeFileSync(DEST, lines.join('\n') + '\n', 'utf8');
console.log(`Imported ${skills.length} skills to ${DEST}`);
