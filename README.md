# UGC Project - Backend API

## 🚀 Overview

This is the backend server for the UGC Project, built with **Express.js**, **TypeScript**, **Prisma ORM**, **Neon Database**, and **Clerk Authentication**.

## 📋 Features

- ✅ **Type-safe** API with TypeScript
- ✅ **Clerk Authentication** for secure user management
- ✅ **Prisma ORM** with Neon PostgreSQL database
- ✅ **Proper error handling** with custom error classes
- ✅ **Standardized API responses** (success/error)
- ✅ **Webhook support** for Clerk events
- ✅ **CORS enabled** for frontend integration
- ✅ **Request validation** middleware
- ✅ **Credit system** for user management

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Neon PostgreSQL
- **ORM**: Prisma
- **Authentication**: Clerk
- **Validation**: Custom validators

## 📦 Installation

1. **Clone the repository**

```bash
cd server
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

   - Copy `.env.example` to `.env`
   - Fill in your actual credentials

4. **Set up Prisma and Database**

```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

5. **Start the development server**

```bash
npm run server
```

The server will start on `http://localhost:5000`

## 📁 Project Structure

```
server/
├── configs/           # Configuration files (Prisma, etc.)
├── controller/        # Webhook controllers (Clerk)
├── controllers/       # API controllers (User, Project)
├── middlewares/       # Auth, error handling, validation
├── routes/            # API routes
├── utils/             # Utility functions (API response, error handler)
├── validators/        # Request validation
├── types/             # TypeScript type definitions
├── prisma/            # Prisma schema and migrations
└── server.ts          # Main application entry point
```

## 🔌 API Endpoints

### **Health Check**

#### `GET /`

Server status check

- **Response**: `{ success: true, message: "Server is live", data: {...} }`

#### `GET /api/health`

Detailed health check

- **Response**: `{ success: true, data: { status, uptime, timestamp } }`

---

### **User Routes** (`/api/users`)

All user routes require authentication (Clerk token).

#### `GET /api/users/profile`

Get current user's profile

- **Auth**: Required
- **Response**:

```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "image": "https://...",
    "credits": 20,
    "createdAt": "2026-03-04T00:00:00.000Z",
    "_count": { "projects": 5 }
  }
}
```

#### `PUT /api/users/profile`

Update user profile

- **Auth**: Required
- **Body**: `{ name?: string, image?: string }`
- **Response**: Updated user object

#### `GET /api/users/credits`

Get user's available credits

- **Auth**: Required
- **Response**: `{ success: true, data: { credits: 20 } }`

#### `GET /api/users/stats`

Get user statistics

- **Auth**: Required
- **Response**:

```json
{
  "success": true,
  "data": {
    "credits": 20,
    "totalProjects": 10,
    "imagesGenerated": 8,
    "videosGenerated": 5,
    "projectsThisMonth": 3
  }
}
```

---

### **Project Routes** (`/api/projects`)

#### `POST /api/projects`

Create a new project

- **Auth**: Required
- **Body**:

```json
{
  "name": "My Project",
  "productName": "Product Name",
  "productDescription": "Description...",
  "userPrompt": "Custom prompt...",
  "aspectRatio": "9:16",
  "targetLength": 5,
  "uploadedImages": ["url1", "url2"]
}
```

- **Response**: Created project object
- **Note**: Deducts 2 credits from user

#### `GET /api/projects/my?page=1&limit=20&filter=all`

Get user's projects (paginated)

- **Auth**: Required
- **Query params**:
  - `page` (default: 1)
  - `limit` (default: 20)
  - `filter`: "all" | "images" | "videos"
- **Response**:

```json
{
  "success": true,
  "data": {
    "projects": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

#### `GET /api/projects/public?page=1&limit=20`

Get all published projects (community page)

- **Auth**: Not required
- **Query params**: `page`, `limit`
- **Response**: Paginated list of public projects

#### `GET /api/projects/:projectId`

Get project by ID

- **Auth**: Optional (required for private projects)
- **Response**: Project object
- **Access**: Owner or public projects only

#### `PUT /api/projects/:projectId`

Update project

- **Auth**: Required (must be owner)
- **Body**: Any project fields to update

```json
{
  "name": "Updated name",
  "isPublished": true,
  "generatedImage": "https://...",
  "generatedVideo": "https://..."
}
```

#### `DELETE /api/projects/:projectId`

Delete project

- **Auth**: Required (must be owner)
- **Response**: `{ success: true, data: { id: "project_id" } }`

#### `PATCH /api/projects/:projectId/publish`

Toggle project publish status

- **Auth**: Required (must be owner)
- **Response**: Updated project object
- **Note**: Project must have generated content

---

### **Webhooks**

#### `POST /api/clerk-webhooks`

Clerk webhook handler

- **Events handled**:
  - `user.created` - Creates user in database
  - `user.updated` - Updates user in database
  - `user.deleted` - Deletes user from database
  - `paymentAttempt.updated` - Adds credits based on plan

---

## 🔐 Authentication

This API uses **Clerk** for authentication. Include the Clerk session token in your requests:

```javascript
fetch("http://localhost:5000/api/users/profile", {
  headers: {
    Authorization: "Bearer YOUR_CLERK_TOKEN",
  },
});
```

---

## 📊 Database Schema

### **User Model**

```prisma
model User {
  id        String   @id
  email     String
  name      String
  image     String
  credits   Int      @default(20)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  projects  Project[]
}
```

### **Project Model**

```prisma
model Project {
  id                 String   @id @default(uuid())
  name               String
  userId             String
  productName        String
  productDescription String   @default("")
  userPrompt         String   @default("")
  aspectRatio        String   @default("9:16")
  targetLength       Int      @default(5)
  uploadedImages     String[]
  generatedImage     String   @default("")
  generatedVideo     String   @default("")
  isGenerating       Boolean  @default(false)
  isPublished        Boolean  @default(false)
  error              String   @default("")
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  user               User     @relation(fields: [userId], references: [id])
}
```

---

## 🎯 API Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (only in development)"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

---

## 🧪 Testing with Clerk

1. Set up Clerk webhooks in your Clerk Dashboard
2. Use the webhook URL: `http://localhost:5000/api/clerk-webhooks`
3. Add your `CLERK_WEBHOOK_SIGNING_SECRET` to `.env`

---

## 🚀 Deployment

1. **Build the project**

```bash
npm run build
```

2. **Set environment variables** on your hosting platform

3. **Run migrations**

```bash
npx prisma migrate deploy
```

4. **Start the server**

```bash
npm start
```

---

## 📝 Scripts

- `npm start` - Start the production server
- `npm run server` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript

---

## 🔧 Environment Variables

See `.env.example` for all required environment variables:

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port
- `DATABASE_URL` - Neon PostgreSQL connection string
- `CLIENT_URL` - Frontend URL for CORS
- `CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key
- `CLERK_WEBHOOK_SIGNING_SECRET` - Clerk webhook secret

---

## 🤝 Contributing

1. Make changes in your feature branch
2. Test thoroughly
3. Ensure TypeScript compiles without errors
4. Submit a pull request

---

## 📄 License

MIT License

---

## 💡 Tips

- Always validate user input
- Use the `ApiResponseUtil` for consistent responses
- Use the `handleError` function for error handling
- Protect routes with the `protect` middleware
- Check user credits before expensive operations
- Use transactions for critical database operations

---

## 🐛 Common Issues

### Issue: Prisma Client not generated

**Solution**: Run `npx prisma generate`

### Issue: Database connection failed

**Solution**: Check your `DATABASE_URL` in `.env`

### Issue: Clerk authentication fails

**Solution**: Verify your Clerk keys and ensure middleware is set up correctly

### Issue: CORS errors

**Solution**: Make sure `CLIENT_URL` matches your frontend URL

---

## 📞 Support

For issues or questions, please create an issue in the repository.

---

**Built with ❤️ using Express.js, TypeScript, and Prisma**
