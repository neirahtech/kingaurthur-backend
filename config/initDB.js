const mongoose = require('mongoose');

// Gallery Schema
const gallerySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    required: true,
    index: true,
  },
  imageId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  imageFilename: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

// News Schema
const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  excerpt: {
    type: String,
    default: '',
  },
  imageId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  imageFilename: {
    type: String,
    default: null,
  },
  author: {
    type: String,
    default: 'King Arthur Capital',
  },
  published: {
    type: Boolean,
    default: false,
    index: true,
  },
}, {
  timestamps: true,
});

// Career Schema
const careerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
  },
  department: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  requirements: {
    type: [String],
    default: [],
  },
  responsibilities: {
    type: [String],
    default: [],
  },
  salaryRange: {
    type: String,
    default: '',
  },
  published: {
    type: Boolean,
    default: false,
    index: true,
  },
}, {
  timestamps: true,
});

// Create models
const Gallery = mongoose.model('Gallery', gallerySchema);
const News = mongoose.model('News', newsSchema);
const Career = mongoose.model('Career', careerSchema);

async function initializeDatabase() {
  try {
    // Ensure indexes are created
    await Gallery.createIndexes();
    await News.createIndexes();
    await Career.createIndexes();
    console.log('✅ MongoDB collections initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
}

module.exports = { initializeDatabase, Gallery, News, Career };
