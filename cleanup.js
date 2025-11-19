/**
 * Cleanup Script - Removes all orphaned gallery and news items
 * Run this to clear all test data before starting fresh
 * 
 * Usage: node cleanup.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function cleanup() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    // Delete all gallery items
    console.log('🗑️  Deleting gallery items...');
    const galleryResult = await db.collection('galleries').deleteMany({});
    console.log(`   ✓ Deleted ${galleryResult.deletedCount} gallery items`);
    
    // Delete all news items
    console.log('🗑️  Deleting news items...');
    const newsResult = await db.collection('news').deleteMany({});
    console.log(`   ✓ Deleted ${newsResult.deletedCount} news items`);
    
    // Delete all GridFS files
    console.log('🗑️  Deleting GridFS files...');
    const filesResult = await db.collection('uploads.files').deleteMany({});
    console.log(`   ✓ Deleted ${filesResult.deletedCount} files`);
    
    // Delete all GridFS chunks
    console.log('🗑️  Deleting GridFS chunks...');
    const chunksResult = await db.collection('uploads.chunks').deleteMany({});
    console.log(`   ✓ Deleted ${chunksResult.deletedCount} chunks`);
    
    console.log('\n✨ Cleanup complete! You can now upload new images.');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanup();
