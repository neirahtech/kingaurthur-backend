const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Career } = require('../config/initDB');
const authMiddleware = require('../middleware/auth');

// GET all careers (public - only published if not authenticated)
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
    
    // If not authenticated, only show published careers
    if (!isAuthenticated) {
      query.published = true;
    }
    
    const items = await Career.find(query).sort({ createdAt: -1 });
    
    // Return with formatted data
    const itemsWithUrls = items.map(item => ({
      id: item._id,
      title: item.title,
      location: item.location,
      type: item.type,
      department: item.department,
      description: item.description,
      requirements: item.requirements,
      responsibilities: item.responsibilities,
      salary_range: item.salaryRange,
      published: item.published,
      created_at: item.createdAt,
      updated_at: item.updatedAt
    }));
    
    res.json(itemsWithUrls);
  } catch (error) {
    console.error('Error fetching careers:', error);
    res.status(500).json({ error: 'Failed to fetch careers' });
  }
});

// GET single career (public if published)
router.get('/:id', async (req, res) => {
  try {
    const item = await Career.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ error: 'Career not found' });
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
      return res.status(403).json({ error: 'This career is not published' });
    }
    
    res.json({
      id: item._id,
      title: item.title,
      location: item.location,
      type: item.type,
      department: item.department,
      description: item.description,
      requirements: item.requirements,
      responsibilities: item.responsibilities,
      salary_range: item.salaryRange,
      published: item.published,
      created_at: item.createdAt,
      updated_at: item.updatedAt
    });
  } catch (error) {
    console.error('Error fetching career:', error);
    res.status(500).json({ error: 'Failed to fetch career' });
  }
});

// POST create career (protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, location, type, department, description, requirements, responsibilities, salary_range, published } = req.body;

    if (!title || !location || !type || !department) {
      return res.status(400).json({ error: 'Title, location, type, and department are required' });
    }

    const newItem = new Career({
      title,
      location,
      type,
      department,
      description: description || '',
      requirements: requirements || [],
      responsibilities: responsibilities || [],
      salaryRange: salary_range || '',
      published: published === 'true' || published === true
    });

    await newItem.save();

    res.status(201).json({
      message: 'Career created successfully',
      id: newItem._id
    });
  } catch (error) {
    console.error('Error creating career:', error);
    res.status(500).json({ error: 'Failed to create career' });
  }
});

// PUT update career (protected)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, location, type, department, description, requirements, responsibilities, salary_range, published } = req.body;

    const updateData = {
      title,
      location,
      type,
      department,
      description: description || '',
      requirements: requirements || [],
      responsibilities: responsibilities || [],
      salaryRange: salary_range || '',
      published: published === 'true' || published === true
    };

    const item = await Career.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ error: 'Career not found' });
    }

    res.json({
      message: 'Career updated successfully',
      id: item._id
    });
  } catch (error) {
    console.error('Error updating career:', error);
    res.status(500).json({ error: 'Failed to update career' });
  }
});

// DELETE career (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const item = await Career.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Career not found' });
    }

    res.json({ message: 'Career deleted successfully' });
  } catch (error) {
    console.error('Error deleting career:', error);
    res.status(500).json({ error: 'Failed to delete career' });
  }
});

module.exports = router;
