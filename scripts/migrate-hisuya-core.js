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
      if (data.system.xp === undefined) data.system.xp = 0;
      if (!Array.isArray(data.system.xpHistory)) data.system.xpHistory = [];
      if (data.system.resource === undefined && data.system.strain) {
        const strainVal = data.system.strain.value ?? 0;
        data.system.resource = strainVal;
      }
    }
    return JSON.stringify(data);
  });
  fs.writeFileSync(fullPath, updated.join('\n') + '\n', 'utf8');
  console.log(`Migrated ${file}`);
}
