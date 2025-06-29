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
      if (!Array.isArray(data.system.xpHistory)) {
        data.system.xpHistory = [];
      } else {
        data.system.xpHistory = data.system.xpHistory.map((e) => ({
          amount: e.amount ?? 0,
          type: e.amount > 0 ? 'Gain' : 'Spend',
          target: e.target || '',
          description: e.note || '',
          timestamp: e.timestamp || Date.now(),
        }));
      }
      if (data.system.resource === undefined && data.system.strain) {
        const strainVal = data.system.strain.value ?? 0;
        data.system.resource = strainVal;
      }
      delete data.system.strain;
    }
    return JSON.stringify(data);
  });
  fs.writeFileSync(fullPath, updated.join('\n') + '\n', 'utf8');
  console.log(`Migrated ${file}`);
}
