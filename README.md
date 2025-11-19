# King Arthur Capital - Backend API

## Setup Instructions

### 1. Choose MongoDB Option

**Option A: Local MongoDB (Development)**
```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Linux
sudo apt-get install mongodb
sudo systemctl start mongod
```

**Option B: MongoDB Atlas (Recommended for Production)**
1. Go to https://cloud.mongodb.com
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Whitelist your IP address

### 2. Configure Environment Variables
Edit the `.env` file:

**For Local MongoDB:**
```
MONGODB_URI=mongodb://localhost:27017/king_arthur_capital
```

**For MongoDB Atlas:**
```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/king_arthur_capital?retryWrites=true&w=majority
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Start Development Server
```bash
npm run dev
```

The server will run on `http://localhost:8085` and automatically create the required database tables.

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with password
- `GET /api/auth/verify` - Verify JWT token

### Gallery Management
- `GET /api/gallery` - Get all gallery items (public)
- `GET /api/gallery/:id` - Get single gallery item (public)
- `POST /api/gallery` - Create gallery item (protected)
- `PUT /api/gallery/:id` - Update gallery item (protected)
- `DELETE /api/gallery/:id` - Delete gallery item (protected)
- `GET /api/gallery/meta/categories` - Get all categories (public)

### News Management
- `GET /api/news` - Get all published news (public)
- `GET /api/news/:id` - Get single news item (public if published)
- `POST /api/news` - Create news (protected)
- `PUT /api/news/:id` - Update news (protected)
- `DELETE /api/news/:id` - Delete news (protected)

## Default Admin Credentials
- Password: `admin123`

**⚠️ Change this in production by updating the `.env` file!**

## Image Storage
- **All images stored in MongoDB using GridFS**
- No local file system storage needed
- Images accessible via API: `/api/gallery/image/:id` and `/api/news/image/:id`
- Perfect for cloud hosting (no uploads directory required)

## Production Deployment
1. Set `NODE_ENV=production` in your production environment
2. Update the `.env` file with MongoDB Atlas connection string
3. Update `PRODUCTION_FRONTEND_URL`
4. Run `npm start` to start the production server

## Database Schema

### Gallery Collection (MongoDB)
```javascript
{
  title: String (required),
  description: String,
  category: String (required, indexed),
  imageId: ObjectId (required),
  imageFilename: String (required),
  createdAt: Date,
  updatedAt: Date
}
```

### News Collection (MongoDB)
```javascript
{
  title: String (required),
  content: String (required),
  excerpt: String,
  imageId: ObjectId,
  imageFilename: String,
  author: String (default: 'King Arthur Capital'),
  published: Boolean (default: false, indexed),
  createdAt: Date,
  updatedAt: Date
}
```

### GridFS (Images)
- All images stored in GridFS bucket named 'uploads'
- Supports streaming for efficient delivery
- Automatic content-type detection
