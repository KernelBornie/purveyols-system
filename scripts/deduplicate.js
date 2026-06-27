// scripts/deduplicate.js
const mongoose = require('mongoose');
const AdvertisedProject = require('../backend/models/AdvertisedProject');

// ⚠️ HARDCODE your connection string here (temporary)
const MONGO_URI = 'mongodb://localhost:27017/purveyols';  // <-- CHANGE if needed

const deduplicate = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const all = await AdvertisedProject.find();
    const seen = new Set();
    let deletedCount = 0;

    for (const doc of all) {
      const key = `${doc.title}-${doc.sourceUrl}`.toLowerCase();
      if (seen.has(key)) {
        await AdvertisedProject.deleteOne({ _id: doc._id });
        console.log(`🗑️ Deleted duplicate: ${doc.title}`);
        deletedCount++;
      } else {
        seen.add(key);
      }
    }

    console.log(`✅ Deduplication complete. ${deletedCount} duplicates removed.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

deduplicate();