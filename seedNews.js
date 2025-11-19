/**
 * News Seed Script - Import sample news articles into MongoDB
 * 
 * Usage: node seedNews.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Sample news data
const newsData = [
  {
    title: 'King Arthur Capital Announces Strategic Partnership in Renewable Energy Sector',
    excerpt: 'Leading advisory firm expands portfolio with major renewable energy infrastructure deal',
    content: `King Arthur Capital is pleased to announce a strategic partnership in the renewable energy sector, marking a significant milestone in our commitment to sustainable investment opportunities.

This partnership involves connecting institutional investors with cutting-edge renewable energy infrastructure projects across emerging markets. The deal represents a $300M+ investment that will help accelerate the global transition to clean energy.

Our team provided comprehensive advisory services including deal structuring, due diligence, and stakeholder coordination across three continents. This transaction exemplifies our expertise in navigating complex cross-border investments while maintaining focus on sustainable value creation.

"This partnership demonstrates our ability to identify and execute on transformational opportunities in the commodities and energy sectors," said our senior advisory team. "We're proud to facilitate investments that drive both financial returns and positive environmental impact."`,
    author: 'King Arthur Capital',
    published: true,
    imagePath: '/provided-images/renewable-energy-solar.jpg'
  },
  {
    title: 'Metals Market Analysis: Copper and Precious Metals Outlook for 2025',
    excerpt: 'Expert insights on copper cathodes and precious metals trading opportunities',
    content: `As global demand for industrial metals continues to surge, King Arthur Capital provides strategic analysis on copper and precious metals market trends heading into 2025.

Copper demand is expected to grow significantly driven by renewable energy infrastructure, electric vehicle production, and industrial expansion in emerging markets. Our analysis indicates strong fundamentals supporting long-term copper price appreciation.

Gold and silver markets are experiencing renewed investor interest as safe-haven assets, while also benefiting from industrial applications in technology and renewable energy sectors.

Our commodities advisory team works closely with mining operations, trading firms, and institutional investors to capitalize on these market opportunities. We provide comprehensive market intelligence, transaction advisory, and strategic capital introduction services.

For clients interested in metals trading and investment opportunities, our team offers customized solutions ranging from direct commodity trading to investment in mining operations and infrastructure projects.`,
    author: 'Commodities Research Team',
    published: true,
    imagePath: '/provided-images/copper-cathodes.jpg'
  },
  {
    title: 'Healthcare Investment Focus: Multi-Specialty Hospital Development',
    excerpt: 'Expanding healthcare infrastructure in emerging markets',
    content: `King Arthur Capital is actively engaged in healthcare facility development projects, with a particular focus on multi-specialty hospitals and diagnostic laboratories in high-growth markets.

Our healthcare investment practice identifies opportunities in regions with growing demand for quality medical services and limited existing infrastructure. We work with healthcare operators, medical equipment providers, and institutional investors to develop world-class facilities.

Current projects include development of multi-specialty hospitals equipped with advanced diagnostic capabilities, ambulatory surgery centers, and specialized treatment facilities. These investments address critical healthcare access gaps while generating attractive returns for our investment partners.

Our team provides comprehensive advisory services including site selection, regulatory compliance, capital raising, and operational planning. We leverage our global network to connect healthcare operators with the capital and resources needed to execute complex development projects.

The healthcare sector represents a growing portion of our advisory practice, and we continue to identify new opportunities for strategic investment in this essential industry.`,
    author: 'Healthcare Advisory Team',
    published: true,
    imagePath: '/provided-images/healthcare1.JPG'
  },
  {
    title: 'Pharmaceutical Supply Chain Innovation: Streamlining Global Distribution',
    excerpt: 'Leveraging technology and strategic partnerships to optimize pharmaceutical logistics',
    content: `The pharmaceutical industry faces complex challenges in global supply chain management, from regulatory compliance to cold chain logistics. King Arthur Capital is at the forefront of connecting pharmaceutical manufacturers with distribution solutions that ensure product quality and market access.

Our pharmaceutical advisory services encompass import/export facilitation, contract manufacturing partnerships, and supply chain optimization. We work with both established pharmaceutical companies and emerging biotech firms to navigate international markets.

Recent initiatives include establishing distribution networks for critical medications in underserved markets, facilitating contract manufacturing agreements, and advising on regulatory compliance across multiple jurisdictions.

Technology integration is key to modern pharmaceutical supply chains. We help clients implement tracking systems, quality control protocols, and inventory management solutions that meet stringent regulatory requirements while optimizing operational efficiency.

Our deep industry expertise and global network enable us to solve complex pharmaceutical logistics challenges and create value for all stakeholders in the healthcare ecosystem.`,
    author: 'Pharmaceutical Advisory Group',
    published: true,
    imagePath: '/provided-images/Pharmaceutical.JPG'
  },
  {
    title: 'Global Capital Markets Update: Q4 2024 Investment Trends',
    excerpt: 'Key insights from our capital advisory team on market dynamics and investment opportunities',
    content: `As we conclude 2024, King Arthur Capital's capital advisory team provides insights on major trends shaping global investment markets and opportunities heading into 2025.

**Emerging Markets:** Continued strong growth in emerging markets, particularly in Asia and Africa, is driving demand for infrastructure investment and development capital. Our team has facilitated several significant transactions connecting institutional capital with high-growth market opportunities.

**Commodities Focus:** Supply chain restructuring and resource security concerns are creating opportunities in strategic commodities. We're seeing increased institutional interest in direct commodity investments and trading operations.

**Infrastructure Development:** Both traditional and renewable energy infrastructure projects are attracting substantial capital commitments. Our advisory services help match project developers with appropriate financing sources.

**Private Equity Activity:** Middle-market private equity continues to show strong performance, with particular strength in sectors including healthcare, technology, and industrial operations.

Our capital advisory practice provides strategic guidance, deal structuring, and investor relations support across these sectors. We maintain relationships with institutional investors, family offices, and strategic corporate investors globally.

For clients seeking capital or investment opportunities, our team offers customized solutions backed by deep market knowledge and extensive transaction experience.`,
    author: 'Capital Markets Team',
    published: true,
    imagePath: '/provided-images/capitaladvisory1.JPG'
  }
];

async function seedNews() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: 'uploads'
    });

    // Get News model
    const News = mongoose.model('News', new mongoose.Schema({
      title: String,
      content: String,
      excerpt: String,
      imageId: mongoose.Schema.Types.ObjectId,
      imageFilename: String,
      author: String,
      published: Boolean
    }, { timestamps: true }));

    let totalUploaded = 0;
    let totalSkipped = 0;

    console.log('📰 Processing news articles...\n');
    
    for (const article of newsData) {
      try {
        let imageId = null;
        let imageFilename = null;

        // Upload featured image if provided
        if (article.imagePath) {
          const publicPath = path.join(__dirname, '..', 'public', article.imagePath);
          
          if (fs.existsSync(publicPath)) {
            const fileBuffer = fs.readFileSync(publicPath);
            const filename = path.basename(article.imagePath);
            const ext = path.extname(filename).toLowerCase();
            
            const contentTypeMap = {
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.png': 'image/png',
              '.gif': 'image/gif',
              '.webp': 'image/webp'
            };
            const contentType = contentTypeMap[ext] || 'image/jpeg';

            const uploadStream = bucket.openUploadStream(filename, {
              contentType: contentType,
              metadata: {
                originalName: filename,
                uploadedAt: new Date(),
                type: 'news',
                seeded: true
              }
            });

            uploadStream.end(fileBuffer);

            await new Promise((resolve, reject) => {
              uploadStream.on('finish', resolve);
              uploadStream.on('error', reject);
            });

            imageId = uploadStream.id;
            imageFilename = filename;
          }
        }

        // Create news article
        const newsArticle = new News({
          title: article.title,
          content: article.content,
          excerpt: article.excerpt,
          imageId,
          imageFilename,
          author: article.author,
          published: article.published
        });

        await newsArticle.save();

        console.log(`   ✓ Created: ${article.title}`);
        totalUploaded++;

      } catch (error) {
        console.error(`   ❌ Error creating article:`, error.message);
        totalSkipped++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✨ News seeding complete!`);
    console.log(`   📊 Total created: ${totalUploaded} articles`);
    console.log(`   ⚠️  Total skipped: ${totalSkipped} articles`);
    console.log('='.repeat(60) + '\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedNews();
