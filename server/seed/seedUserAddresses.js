/**
 * Populates the UserAddress collection.
 * - Migrates any existing embedded User.addresses into the new table.
 * - For users still without entries, generates 3-4 dummy Indian addresses.
 *
 * Run: node server/seed/seedUserAddresses.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' });

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/women_hubclub');

const User        = require('../models/User');
const UserAddress = require('../models/UserAddress');

const ADDRESS_POOL = [
  { label: 'Home',   street: '12, Rose Garden Lane',             city: 'Mumbai',    state: 'Maharashtra', zip: '400001' },
  { label: 'Work',   street: 'A-204, Tech Park, Hiranandani',    city: 'Pune',      state: 'Maharashtra', zip: '411014' },
  { label: "Mom's",  street: '7/B, Green View Society',          city: 'Ahmedabad', state: 'Gujarat',     zip: '380015' },
  { label: 'Other',  street: '33, MG Road, Indiranagar',         city: 'Bengaluru', state: 'Karnataka',   zip: '560038' },
  { label: 'Home',   street: '45, Shyam Nagar, Sector 12',       city: 'Jaipur',    state: 'Rajasthan',   zip: '302001' },
  { label: 'Work',   street: 'Plot 5, Cyber City',               city: 'Gurugram',  state: 'Haryana',     zip: '122002' },
  { label: 'Hostel', street: 'Block C, Ladies Hostel, VIT',      city: 'Vellore',   state: 'Tamil Nadu',  zip: '632014' },
  { label: 'Other',  street: '201, Jubilee Hills, Road No. 36',  city: 'Hyderabad', state: 'Telangana',   zip: '500033' },
  { label: 'Home',   street: '8, Lake View Road, Salt Lake',     city: 'Kolkata',   state: 'West Bengal', zip: '700064' },
  { label: 'Work',   street: '14/3, Anna Nagar East',            city: 'Chennai',   state: 'Tamil Nadu',  zip: '600102' },
  { label: 'Sister', street: 'Flat 302, Sun Manor, Kothrud',     city: 'Pune',      state: 'Maharashtra', zip: '411029' },
  { label: 'Other',  street: '22, Civil Lines',                  city: 'Nagpur',    state: 'Maharashtra', zip: '440001' },
];

function dummyAddresses(userIdx) {
  const base = (userIdx * 4) % ADDRESS_POOL.length;
  return [0, 1, 2, 3].map((offset, i) => ({
    ...ADDRESS_POOL[(base + offset) % ADDRESS_POOL.length],
    country: 'India',
    isDefault: i === 0,
  }));
}

async function run() {
  try {
    const users = await User.find({}).lean();
    console.log(`Found ${users.length} users`);

    let migrated = 0, generated = 0, skipped = 0;

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const existingCount = await UserAddress.countDocuments({ userId: user._id });

      if (existingCount > 0) {
        console.log(`  ⏭  Skipping ${user.email} (already has ${existingCount} address rows)`);
        skipped++;
        continue;
      }

      // Try to migrate embedded addresses first
      if (Array.isArray(user.addresses) && user.addresses.length > 0) {
        const docs = user.addresses.map((a, idx) => ({
          userId: user._id,
          label:     a.label     || 'Home',
          street:    a.street    || '',
          city:      a.city      || '',
          state:     a.state     || '',
          zip:       a.zip       || '',
          country:   a.country   || 'India',
          isDefault: idx === 0,
        }));
        await UserAddress.insertMany(docs);
        console.log(`  ✅ Migrated ${docs.length} embedded addresses for ${user.email}`);
        migrated++;
      } else {
        // Generate fresh dummy addresses
        const docs = dummyAddresses(i).map(a => ({ ...a, userId: user._id }));
        await UserAddress.insertMany(docs);
        console.log(`  🆕 Generated ${docs.length} dummy addresses for ${user.email}`);
        generated++;
      }
    }

    console.log(`\nDone — migrated: ${migrated}, generated: ${generated}, skipped: ${skipped}`);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    mongoose.disconnect();
  }
}

run();
