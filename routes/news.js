const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { News } = require('../config/initDB');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET all news (public - only published if not authenticated)
router.get('/', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    let isAuthenticated = false;
    
    // Check if user is authenticated
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        jwt.verify(token, process.env.JWT_SECRET);
        isAuthenticated = true;
      } catch (err) {
        // Token invalid, continue as unauthenticated
      }
    }
    
    let query = {};
    
    // If not authenticated, only show published news
    if (!isAuthenticated) {
      query.published = true;
    }
    
    const items = await News.find(query).sort({ createdAt: -1 });
    
    // Return with image URL
    const itemsWithUrls = items.map(item => ({
      id: item._id,
      title: item.title,
      content: item.content,
      excerpt: item.excerpt,
      image_url: item.imageId ? `/api/news/image/${item.imageId}` : null,
      imageId: item.imageId,
      author: item.author,
      published: item.published,
      created_at: item.createdAt,
      updated_at: item.updatedAt
    }));
    
    res.json(itemsWithUrls);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// GET single news item (public if published)
router.get('/:id', async (req, res) => {
  try {
    const item = await News.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ error: 'News item not found' });
    }
    
    // Check if published or user is authenticated
    const token = req.headers.authorization?.split(' ')[1];
    let isAuthenticated = false;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        jwt.verify(token, process.env.JWT_SECRET);
        isAuthenticated = true;
      } catch (err) {
        // Token invalid
      }
    }
    
    if (!item.published && !isAuthenticated) {
      return res.status(403).json({ error: 'This news item is not published' });
    }
    
    res.json({
      id: item._id,
      title: item.title,
      content: item.content,
      excerpt: item.excerpt,
      image_url: item.imageId ? `/api/news/image/${item.imageId}` : null,
      imageId: item.imageId,
      author: item.author,
      published: item.published,
      created_at: item.createdAt,
      updated_at: item.updatedAt
    });
  } catch (error) {
    console.error('Error fetching news item:', error);
    res.status(500).json({ error: 'Failed to fetch news item' });
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

// POST create news (protected)
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, content, excerpt, author, published } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    let imageId = null;
    let imageFilename = null;
    
    // Upload image to GridFS if provided
    if (req.file) {
      const conn = mongoose.connection;
      const bucket = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: 'uploads'
      });
      
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
      
      imageId = uploadStream.id;
      imageFilename = req.file.originalname;
    }
    
    const newItem = new News({
      title,
      content,
      excerpt: excerpt || '',
      imageId,
      imageFilename,
      author: author || 'King Arthur Capital',
      published: published === 'true' || published === true
    });
    
    await newItem.save();
    
    res.status(201).json({
      success: true,
      id: newItem._id,
      message: 'News created successfully',
      image_url: imageId ? `/api/news/image/${imageId}` : null
    });
  } catch (error) {
    console.error('Error creating news:', error);
    res.status(500).json({ error: 'Failed to create news' });
  }
});

// PUT update news (protected)
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, content, excerpt, author, published } = req.body;
    const { id } = req.params;
    
    const item = await News.findById(id);
    
    if (!item) {
      return res.status(404).json({ error: 'News item not found' });
    }
    
    // If new image is uploaded, delete old one and update
    if (req.file) {
      const conn = mongoose.connection;
      const bucket = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: 'uploads'
      });
      
      // Delete old image from GridFS if exists
      if (item.imageId) {
        try {
          await bucket.delete(item.imageId);
        } catch (err) {
          console.error('Error deleting old image:', err);
        }
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
    if (content) item.content = content;
    if (excerpt !== undefined) item.excerpt = excerpt;
    if (author) item.author = author;
    if (published !== undefined) item.published = published === 'true' || published === true;
    
    await item.save();
    
    res.json({
      success: true,
      message: 'News updated successfully',
      image_url: item.imageId ? `/api/news/image/${item.imageId}` : null
    });
  } catch (error) {
    console.error('Error updating news:', error);
    res.status(500).json({ error: 'Failed to update news' });
  }
});

// DELETE news (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await News.findById(id);
    
    if (!item) {
      return res.status(404).json({ error: 'News item not found' });
    }
    
    // Delete image from GridFS if exists
    if (item.imageId) {
      const conn = mongoose.connection;
      const bucket = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: 'uploads'
      });
      
      try {
        await bucket.delete(item.imageId);
      } catch (err) {
        console.error('Error deleting image:', err);
      }
    }
    
    // Delete from database
    await News.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'News deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting news:', error);
    res.status(500).json({ error: 'Failed to delete news' });
  }
});

module.exports = router;
