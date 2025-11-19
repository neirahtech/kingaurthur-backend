const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Gallery } = require('../config/initDB');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET all gallery items (public)
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};
    
    if (category) {
      query.category = category;
    }
    
    const items = await Gallery.find(query).sort({ createdAt: -1 });
    
    // Return with image URL
    const itemsWithUrls = items.map(item => ({
      id: item._id,
      title: item.title,
      description: item.description,
      category: item.category,
      image_url: `/api/gallery/image/${item.imageId}`,
      imageId: item.imageId,
      created_at: item.createdAt,
      updated_at: item.updatedAt
    }));
    
    res.json(itemsWithUrls);
  } catch (error) {
    console.error('Error fetching gallery:', error);
    res.status(500).json({ error: 'Failed to fetch gallery items' });
  }
});

// GET single gallery item (public)
router.get('/:id', async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ error: 'Gallery item not found' });
    }
    
    res.json({
      id: item._id,
      title: item.title,
      description: item.description,
      category: item.category,
      image_url: `/api/gallery/image/${item.imageId}`,
      imageId: item.imageId,
      created_at: item.createdAt,
      updated_at: item.updatedAt
    });
  } catch (error) {
    console.error('Error fetching gallery item:', error);
    res.status(500).json({ error: 'Failed to fetch gallery item' });
  }
});

// GET image file from GridFS
router.get('/image/:id', async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid image ID format' });
    }
    
    const conn = mongoose.connection;
    const bucket = new mongoose.mongo.GridFSBucket(conn.db, {
      bucketName: 'uploads'
    });
    
    const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(req.params.id));
    
    let streamStarted = false;
    
    downloadStream.on('error', (error) => {
      console.error('Image download error:', error);
      if (!streamStarted) {
        res.status(404).json({ error: 'Image not found in storage' });
      }
    });
    
    downloadStream.on('file', (file) => {
      streamStarted = true;
      // Set appropriate content type
      res.set('Content-Type', file.contentType || 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    });
    
    downloadStream.pipe(res);
  } catch (error) {
    console.error('Error streaming image:', error);
    res.status(500).json({ error: 'Failed to load image' });
  }
});

// POST create gallery item (protected)
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, description, category } = req.body;
    
    if (!title || !category || !req.file) {
      return res.status(400).json({ error: 'Title, category, and image are required' });
    }
    
    // Upload to GridFS manually
    const conn = mongoose.connection;
    const bucket = new mongoose.mongo.GridFSBucket(conn.db, {
      bucketName: 'uploads'
    });
    
    // Create upload stream
    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype,
      metadata: {
        originalName: req.file.originalname,
        uploadedAt: new Date()
      }
    });
    
    // Write file buffer to GridFS
    uploadStream.end(req.file.buffer);
    
    // Wait for upload to finish
    await new Promise((resolve, reject) => {
      uploadStream.on('finish', resolve);
      uploadStream.on('error', reject);
    });
    
    const newItem = new Gallery({
      title,
      description: description || '',
      category,
      imageId: uploadStream.id,
      imageFilename: req.file.originalname
    });
    
    await newItem.save();
    
    res.status(201).json({
      success: true,
      id: newItem._id,
      message: 'Gallery item created successfully',
      image_url: `/api/gallery/image/${uploadStream.id}`
    });
  } catch (error) {
    console.error('Error creating gallery item:', error);
    res.status(500).json({ error: 'Failed to create gallery item' });
  }
});

// PUT update gallery item (protected)
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const { id } = req.params;
    
    const item = await Gallery.findById(id);
    
    if (!item) {
      return res.status(404).json({ error: 'Gallery item not found' });
    }
    
    // If new image is uploaded, delete old one and update
    if (req.file) {
      const conn = mongoose.connection;
      const bucket = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: 'uploads'
      });
      
      // Delete old image from GridFS
      try {
        await bucket.delete(item.imageId);
      } catch (err) {
        console.error('Error deleting old image:', err);
      }
      
      // Upload new image
      const uploadStream = bucket.openUploadStream(req.file.originalname, {
        contentType: req.file.mimetype,
        metadata: {
          originalName: req.file.originalname,
          uploadedAt: new Date()
        }
      });
      
      uploadStream.end(req.file.buffer);
      
      await new Promise((resolve, reject) => {
        uploadStream.on('finish', resolve);
        uploadStream.on('error', reject);
      });
      
      item.imageId = uploadStream.id;
      item.imageFilename = req.file.originalname;
    }
    
    if (title) item.title = title;
    if (description !== undefined) item.description = description;
    if (category) item.category = category;
    
    await item.save();
    
    res.json({
      success: true,
      message: 'Gallery item updated successfully',
      image_url: `/api/gallery/image/${item.imageId}`
    });
  } catch (error) {
    console.error('Error updating gallery item:', error);
    res.status(500).json({ error: 'Failed to update gallery item' });
  }
});

// DELETE gallery item (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await Gallery.findById(id);
    
    if (!item) {
      return res.status(404).json({ error: 'Gallery item not found' });
    }
    
    // Delete image from GridFS
    const conn = mongoose.connection;
    const bucket = new mongoose.mongo.GridFSBucket(conn.db, {
      bucketName: 'uploads'
    });
    
    try {
      await bucket.delete(item.imageId);
    } catch (err) {
      console.error('Error deleting image:', err);
    }
    
    // Delete from database
    await Gallery.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Gallery item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting gallery item:', error);
    res.status(500).json({ error: 'Failed to delete gallery item' });
  }
});

// DELETE all gallery items - cleanup endpoint (protected)
router.delete('/cleanup/all', authMiddleware, async (req, res) => {
  try {
    const conn = mongoose.connection;
    const bucket = new mongoose.mongo.GridFSBucket(conn.db, {
      bucketName: 'uploads'
    });
    
    // Get all gallery items
    const items = await Gallery.find();
    
    // Delete all images from GridFS
    for (const item of items) {
      if (item.imageId) {
        try {
          await bucket.delete(item.imageId);
        } catch (err) {
          console.error(`Error deleting image ${item.imageId}:`, err.message);
        }
      }
    }
    
    // Delete all gallery records
    const result = await Gallery.deleteMany({});
    
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} gallery items`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up gallery:', error);
    res.status(500).json({ error: 'Failed to cleanup gallery' });
  }
});

// GET all categories (public)
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await Gallery.distinct('category');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;
