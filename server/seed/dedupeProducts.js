const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' });

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/women_hubclub');

const Product = require('../models/Product');

function normalize(name) {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Within a duplicate group, prefer to keep: non-trash over trash, then more reviews, then the oldest record.
function pickKeeper(group) {
  return [...group].sort((a, b) => {
    const aTrash = a.status === 'trash' ? 1 : 0;
    const bTrash = b.status === 'trash' ? 1 : 0;
    if (aTrash !== bTrash) return aTrash - bTrash;
    if (b.reviews.length !== a.reviews.length) return b.reviews.length - a.reviews.length;
    return a.createdAt - b.createdAt;
  })[0];
}

async function run() {
  const isDelete = process.argv.includes('--delete');
  try {
    const products = await Product.find({});
    const groups = new Map();
    for (const p of products) {
      const key = `${normalize(p.name)}|${p.category}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(p);
    }

    const duplicateGroups = [...groups.values()].filter(g => g.length > 1);
    if (duplicateGroups.length === 0) {
      console.log('No duplicate products found.');
      return;
    }

    let toDelete = [];
    for (const group of duplicateGroups) {
      const keeper = pickKeeper(group);
      const losers = group.filter(p => p._id.toString() !== keeper._id.toString());
      console.log(`\n"${group[0].name}" (${group[0].category}) — ${group.length} copies`);
      console.log(`  keep:   ${keeper._id} (status=${keeper.status}, reviews=${keeper.reviews.length}, createdAt=${keeper.createdAt.toISOString()})`);
      losers.forEach(p => console.log(`  remove: ${p._id} (status=${p.status}, reviews=${p.reviews.length}, createdAt=${p.createdAt.toISOString()})`));
      toDelete.push(...losers.map(p => p._id));
    }

    console.log(`\n${duplicateGroups.length} duplicate group(s), ${toDelete.length} product(s) to remove.`);

    if (!isDelete) {
      console.log('\nDry run only — rerun with --delete to actually remove them.');
      return;
    }

    const { deletedCount } = await Product.deleteMany({ _id: { $in: toDelete } });
    console.log(`\n✅ Deleted ${deletedCount} duplicate product(s).`);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    mongoose.disconnect();
  }
}

run();
