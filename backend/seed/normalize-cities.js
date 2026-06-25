/**
 * One-off migration: canonicalize facility city names in the EXISTING database
 * (e.g. "Belgrade" -> "Beograd") so a city never appears twice in lists.
 * Non-destructive — only updates the `city` field. Run with `npm run normalize-cities`.
 */
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sportsphere_hub';

const ALIASES = {
  belgrade: 'Beograd',
  beograd: 'Beograd',
  nis: 'Niš',
  niš: 'Niš',
  'novi sad': 'Novi Sad',
  novisad: 'Novi Sad',
  kragujevac: 'Kragujevac',
};

function normalizeCity(raw) {
  if (!raw) return raw;
  const collapsed = String(raw).trim().replace(/\s+/g, ' ');
  const key = collapsed.toLowerCase();
  if (ALIASES[key]) return ALIASES[key];
  return collapsed.replace(/\S+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

async function run() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();
  const facilities = await db.collection('facilities').find({}).toArray();
  let changed = 0;
  for (const f of facilities) {
    const canonical = normalizeCity(f.city);
    if (canonical !== f.city) {
      await db.collection('facilities').updateOne({ _id: f._id }, { $set: { city: canonical } });
      console.log(`  ${f.name}: "${f.city}" -> "${canonical}"`);
      changed++;
    }
  }
  console.log(`Normalized ${changed} facility city value(s).`);
  await client.close();
}

run().catch((err) => {
  console.error('normalize-cities failed:', err);
  process.exit(1);
});
