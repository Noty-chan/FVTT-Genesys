const fs = require('fs');
const path = require('path');

const PACK_DIR = path.join(__dirname, '..', 'public', 'packs');

for (const file of fs.readdirSync(PACK_DIR)) {
  if (!file.endsWith('.db')) continue;
  const fullPath = path.join(PACK_DIR, file);
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n').filter(Boolean);
  const updated = lines.map((line) => {
    const data = JSON.parse(line);
    if (data.type === 'character' && data.system) {
      if (data.system.contacts === undefined) data.system.contacts = 0;
      if (data.system.intel === undefined) data.system.intel = 0;
      if (data.system.will === undefined) data.system.will = 0;
      if (!Array.isArray(data.system.resourceHistory)) data.system.resourceHistory = [];
    }
    return JSON.stringify(data);
  });
  fs.writeFileSync(fullPath, updated.join('\n') + '\n', 'utf8');
  console.log(`Migrated ${file}`);
}
