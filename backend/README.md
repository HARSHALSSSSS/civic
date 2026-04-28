# Civiconnect - Backend API

A comprehensive backend API for the Civiconnect platform, enabling citizens to report civic issues and government staff to manage and resolve them efficiently.

## 🚀 Features

- **User Authentication & Authorization**: JWT-based authentication with role-based access control
- **Civic Issue Reporting**: Citizens can report various civic issues with photos and location data
- **Staff Management System**: Government staff can manage, assign, and track issue resolution
- **Geospatial Queries**: Location-based report filtering and nearby issue discovery
- **File Upload & Processing**: Automatic image processing and optimization
- **Real-time Analytics**: Dashboard with comprehensive reporting analytics
- **Email Notifications**: Automated notifications for status updates
- **Rate Limiting**: API protection against abuse
- **Comprehensive Logging**: Detailed logging for monitoring and debugging

## 📋 Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 5.0
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd civiconnect-platform/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your configuration:
   - MongoDB connection string
   - JWT secret key
   - Email service credentials (optional)

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Running Tests
```bash
npm test
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "citizen",
  "phone": "+1234567890"
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

### Report Endpoints

#### Create Report
```http
POST /reports
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "title": "Pothole on Main Street",
  "description": "Large pothole causing traffic issues",
  "category": "Pothole",
  "priority": 4,
  "longitude": -122.4194,
  "latitude": 37.7749,
  "address": "Main Street, City",
  "photos": [file1, file2] // Optional image files
}
```

#### Get Reports
```http
GET /reports?page=1&limit=10&category=Pothole&status=Submitted
Authorization: Bearer <token> // Optional for public reports
```

#### Get Single Report
```http
GET /reports/:id
Authorization: Bearer <token> // Optional for public reports
```

#### Update Report (Citizens)
```http
PUT /reports/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated title",
  "description": "Updated description",
  "priority": 5
}
```

### Staff Endpoints

#### Get Staff Dashboard
```http
GET /staff/dashboard
Authorization: Bearer <token>
```

#### Assign Report
```http
PUT /staff/reports/:id/assign
Authorization: Bearer <token>
Content-Type: application/json

{
  "staffId": "staff-user-id" // Optional, defaults to current user
}
```

#### Update Report Status
```http
PUT /staff/reports/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "In Progress",
  "resolutionDetails": "Work crew assigned",
  "estimatedResolutionDate": "2024-02-15T10:00:00.000Z"
}
```

#### Add Staff Comment
```http
POST /staff/reports/:id/comment
Authorization: Bearer <token>
Content-Type: application/json

{
  "comment": "Investigation started, will update soon"
}
```

## 🗂️ Project Structure

```
src/
├── config/
│   ├── database.js      # MongoDB connection
│   └── logger.js        # Winston logging configuration
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── reportController.js  # Report management logic
│   └── staffController.js   # Staff operations logic
├── middleware/
│   ├── auth.js         # Authentication middleware
│   ├── error.js        # Error handling middleware
│   └── upload.js       # File upload processing
├── models/
│   ├── User.js         # User schema
│   └── Report.js       # Report schema
├── routes/
│   ├── auth.js         # Authentication routes
│   ├── reports.js      # Report routes
│   └── staff.js        # Staff routes
└── server.js           # Main application entry point
```

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/civiconnect |
| `JWT_SECRET` | JWT secret key | Required |
| `JWT_EXPIRE` | JWT expiration time | 7d |
| `MAX_FILE_SIZE` | Max upload file size in bytes | 5242880 (5MB) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Different permissions for citizens and staff
- **Rate Limiting**: Protection against API abuse
- **Input Validation**: Comprehensive validation using express-validator
- **File Upload Security**: File type validation and size limits
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Helmet.js**: Security headers for Express applications

## 🗄️ Database Schema

### User Model
- Authentication and profile information
- Role-based permissions (citizen, staff, admin)
- Department assignment for staff members

### Report Model
- Comprehensive civic issue reporting
- Geospatial location data
- Photo attachments
- Status tracking and staff assignments
- Citizen feedback system

## 🚀 Deployment

### Production Checklist
1. Set `NODE_ENV=production`
2. Use a strong JWT secret
3. Configure MongoDB Atlas or production MongoDB instance
4. Set up email service credentials
5. Configure CORS for production domain
6. Set up proper logging and monitoring
7. Configure reverse proxy (nginx/Apache)
8. Set up SSL/TLS certificates

### Docker Deployment (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 📊 Monitoring & Logging

The application uses Winston for comprehensive logging:
- **Console**: Development logging
- **File**: Production logging (`logs/combined.log`, `logs/error.log`)
- **Error Tracking**: Automatic error logging with stack traces

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Built with ❤️ for civic engagement and transparent governance**