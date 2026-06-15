const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' });

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/women_hubclub');

const User = require('../models/User');

const ADDRESS_POOL = [
  { label: 'Home',   street: '12, Rose Garden Lane',        city: 'Mumbai',    state: 'Maharashtra', zip: '400001', country: 'India', isDefault: true  },
  { label: 'Work',   street: 'A-204, Tech Park, Hiranandani',city: 'Pune',     state: 'Maharashtra', zip: '411014', country: 'India', isDefault: false },
  { label: 'Mom\'s', street: '7/B, Green View Society',     city: 'Ahmedabad', state: 'Gujarat',     zip: '380015', country: 'India', isDefault: false },
  { label: 'Other',  street: '33, MG Road, Indiranagar',    city: 'Bengaluru', state: 'Karnataka',   zip: '560038', country: 'India', isDefault: false },

  { label: 'Home',   street: '45, Shyam Nagar, Sector 12',  city: 'Jaipur',    state: 'Rajasthan',   zip: '302001', country: 'India', isDefault: true  },
  { label: 'Work',   street: 'Plot 5, Cyber City',           city: 'Gurugram',  state: 'Haryana',     zip: '122002', country: 'India', isDefault: false },
  { label: 'Hostel', street: 'Block C, Ladies Hostel, VIT',  city: 'Vellore',   state: 'Tamil Nadu',  zip: '632014', country: 'India', isDefault: false },
  { label: 'Other',  street: '201, Jubilee Hills, Road No. 36', city: 'Hyderabad', state: 'Telangana', zip: '500033', country: 'India', isDefault: false },

  { label: 'Home',   street: '8, Lake View Road, Salt Lake', city: 'Kolkata',   state: 'West Bengal', zip: '700064', country: 'India', isDefault: true  },
  { label: 'Work',   street: '14/3, Anna Nagar East',        city: 'Chennai',   state: 'Tamil Nadu',  zip: '600102', country: 'India', isDefault: false },
  { label: 'Sister', street: 'Flat 302, Sun Manor, Kothrud', city: 'Pune',      state: 'Maharashtra', zip: '411029', country: 'India', isDefault: false },
  { label: 'Other',  street: '22, Civil Lines',              city: 'Nagpur',    state: 'Maharashtra', zip: '440001', country: 'India', isDefault: false },
];

function pickAddresses(idx) {
  // Each user gets a different slice of 4 addresses from the pool (rotates)
  const base = (idx * 4) % ADDRESS_POOL.length;
  const addrs = [];
  for (let i = 0; i < 4; i++) {
    addrs.push({ ...ADDRESS_POOL[(base + i) % ADDRESS_POOL.length] });
  }
  // Ensure exactly one default
  addrs.forEach((a, i) => { a.isDefault = i === 0; });
  return addrs;
}

async function run() {
  try {
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    let updated = 0;
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      // Skip if already has addresses
      if (user.addresses && user.addresses.length > 0) {
        console.log(`  Skipping ${user.email} (already has ${user.addresses.length} addresses)`);
        continue;
      }
      user.addresses = pickAddresses(i);
      await user.save();
      console.log(`  ✅ Added ${user.addresses.length} addresses to ${user.email}`);
      updated++;
    }

    console.log(`\nDone — updated ${updated} users`);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    mongoose.disconnect();
  }
}

run();
