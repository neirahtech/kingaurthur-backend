/**
 * Gallery Seed Script - Import all gallery images into MongoDB
 * This script reads images from public folders and uploads them to GridFS
 * 
 * Usage: node seedGallery.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Gallery data matching VideoSection.tsx structure
const galleryData = [
  {
    category: 'Pharmaceutical',
    items: [
      { src: '/provided-images/Pharmaceutical.JPG', title: 'Pharmaceutical Import & Export', description: 'Global pharmaceutical import and export services' },
      { src: '/provided-images/Pharmaceutical1.JPG', title: 'Pharmaceutical Contract Manufacturing', description: 'Contract manufacturing solutions for pharmaceutical products' },
      { src: '/provided-images/Pharmaceutical2.JPG', title: 'Pharmaceutical Supply Chain', description: 'Supply chain facilitation for pharmaceutical industry' }
    ]
  },
  {
    category: 'Capital Advisory',
    items: [
      { src: '/provided-images/capitaladvisory1.JPG', title: 'Strategic Advisory Meetings', description: 'Expert strategic advisory for capital markets' },
      { src: '/provided-images/capitaladvisory2.JPG', title: 'Investment Planning Sessions', description: 'Comprehensive investment planning and strategy' },
      { src: '/provided-images/capitaladvisory3.JPG', title: 'Financial Analysis & Due Diligence', description: 'In-depth financial analysis and due diligence services' },
      { src: '/provided-images/capitaladvisory4.JPG', title: 'Corporate Finance Solutions', description: 'Tailored corporate finance advisory services' },
      { src: '/provided-images/capitaladvisory5.JPG', title: 'Mergers & Acquisitions Advisory', description: 'M&A advisory and transaction support' },
      { src: '/provided-images/capitaladvisory6.JPG', title: 'Capital Markets Transactions', description: 'Capital markets advisory and execution' },
      { src: '/provided-images/capitaladvisory7.JPG', title: 'Private Equity Investments', description: 'Private equity investment advisory' },
      { src: '/provided-images/capitaladvisory8.JPG', title: 'Portfolio Management', description: 'Strategic portfolio management services' },
      { src: '/provided-images/capitaladvisory9.JPG', title: 'Institutional Investor Relations', description: 'Building relationships with institutional investors' },
      { src: '/provided-images/capitaladvisory10.JPG', title: 'Strategic Partnership Development', description: 'Developing strategic business partnerships' },
      { src: '/provided-images/capitaladvisory11.JPG', title: 'Global Investment Opportunities', description: 'Identifying global investment opportunities' },
      { src: '/royalty-free-images/hand-shake.jpg', title: 'Building Strategic Partnerships', description: 'Partnership development and collaboration' },
      { src: '/royalty-free-images/mika-baumeister-O8WGTXz06WE-unsplash.jpg', title: 'Global Financial Markets', description: 'Navigating global financial markets' },
      { src: '/royalty-free-images/guilhem-dupit-vxGSHK9ABv4-unsplash.jpg', title: 'International Business Collaboration', description: 'International business and trade facilitation' }
    ]
  },
  {
    category: 'Healthcare Facilities',
    items: [
      { src: '/provided-images/healthcare1.JPG', title: 'Healthcare Investments', description: 'Hospitals & Diagnostic Labs investment opportunities' },
      { src: '/provided-images/healthcare2.JPG', title: 'Multi-Specialty Hospital Development', description: 'Development of multi-specialty healthcare facilities' },
      { src: '/provided-images/healthcare3.JPG', title: 'Advanced Medical Diagnostic Labs', description: 'State-of-the-art medical diagnostic laboratories' }
    ]
  },
  {
    category: 'Commodities',
    items: [
      { src: '/royalty-free-images/crude-oil.jpg', title: 'Crude Oil', description: 'Premium crude oil trading and supply' },
      { src: '/provided-images/cude-oil-2.jpg', title: 'Crude Oil - Premium Grade', description: 'High-grade crude oil products' },
      { src: '/provided-images/liquid-aerosal-gas.jpg', title: 'LAG (Liquefied Aerosol Gas)', description: 'Liquefied aerosol gas supply' },
      { src: '/provided-images/liquid-petrolium.jpg', title: 'LPG (Liquefied Petroleum Gas)', description: 'Liquefied petroleum gas distribution' },
      { src: '/provided-images/aviation-fuel.jpg', title: 'Jet A1 Aviation Fuel', description: 'Aviation fuel supply for global markets' },
      { src: '/provided-images/renewable-energy-solar.jpg', title: 'Renewable Energy Solutions', description: 'Solar and renewable energy projects' },
      { src: '/provided-images/copper-cathodes.jpg', title: 'Copper Cathodes', description: 'High-purity copper cathode supply' },
      { src: '/provided-images/aluminium-products.jpg', title: 'Aluminum Products', description: 'Aluminum trading and distribution' },
      { src: '/royalty-free-images/scottsdale-mint-V0kLgC4a3gw-unsplash.jpg', title: 'Precious Metals', description: 'Gold, silver, and precious metals trading' },
      { src: '/provided-images/iron-steel-products.jpg', title: 'Iron Ore & Steel Products', description: 'Iron ore and steel product supply' },
      { src: '/royalty-free-images/agriculture.jpg', title: 'Agricultural Fertilizers', description: 'Agricultural fertilizer supply and distribution' },
      { src: '/royalty-free-images/alex-simpson-9GwMIek9jnY-unsplash.jpg', title: 'Industrial Chemicals', description: 'Industrial chemical supply chain' },
      { src: '/provided-images/plastic-raw.jpg', title: 'Plastic Raw Materials', description: 'Plastic raw material trading' },
      { src: '/royalty-free-images/barrett-ward-5WQJ_ejZ7y8-unsplash.jpg', title: 'Shipping & Freight Services', description: 'Global shipping and logistics services' },
      { src: '/provided-images/water-treatment.jpg', title: 'Water Treatment Solutions', description: 'Water treatment systems and solutions' },
      { src: '/provided-images/activated-carbon.jpg', title: 'Activated Carbon', description: 'Activated carbon for industrial applications' }
    ]
  }
];

async function seedGallery() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: 'uploads'
    });

    // Get Gallery model
    const Gallery = mongoose.model('Gallery', new mongoose.Schema({
      title: String,
      description: String,
      category: String,
      imageId: mongoose.Schema.Types.ObjectId,
      imageFilename: String
    }, { timestamps: true }));

    let totalUploaded = 0;
    let totalSkipped = 0;

    // Process each category
    for (const categoryData of galleryData) {
      console.log(`\n📁 Processing category: ${categoryData.category}`);
      
      for (const item of categoryData.items) {
        const publicPath = path.join(__dirname, '..', 'public', item.src);
        
        // Check if file exists
        if (!fs.existsSync(publicPath)) {
          console.log(`   ⚠️  Skipped: ${item.title} (file not found: ${item.src})`);
          totalSkipped++;
          continue;
        }

        try {
          // Read file
          const fileBuffer = fs.readFileSync(publicPath);
          const filename = path.basename(item.src);
          const ext = path.extname(filename).toLowerCase();
          
          // Determine content type
          const contentTypeMap = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
          };
          const contentType = contentTypeMap[ext] || 'image/jpeg';

          // Upload to GridFS
          const uploadStream = bucket.openUploadStream(filename, {
            contentType: contentType,
            metadata: {
              originalName: filename,
              uploadedAt: new Date(),
              category: categoryData.category,
              seeded: true
            }
          });

          uploadStream.end(fileBuffer);

          await new Promise((resolve, reject) => {
            uploadStream.on('finish', resolve);
            uploadStream.on('error', reject);
          });

          // Save to Gallery collection
          const galleryItem = new Gallery({
            title: item.title,
            description: item.description,
            category: categoryData.category,
            imageId: uploadStream.id,
            imageFilename: filename
          });

          await galleryItem.save();

          console.log(`   ✓ Uploaded: ${item.title}`);
          totalUploaded++;

        } catch (error) {
          console.error(`   ❌ Error uploading ${item.title}:`, error.message);
          totalSkipped++;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✨ Gallery seeding complete!`);
    console.log(`   📊 Total uploaded: ${totalUploaded} images`);
    console.log(`   ⚠️  Total skipped: ${totalSkipped} images`);
    console.log('='.repeat(60) + '\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedGallery();
