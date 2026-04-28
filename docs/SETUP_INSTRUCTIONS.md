# Samvad Platform - Setup Instructions

## 🚀 Quick Start Guide for SIH 2025 Demo

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager
- Android Studio (for Android) or Xcode (for iOS)
- Git

### 🖥️ Backend Setup (Next.js API)

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   
4. **Verify backend is running:**
   - Open browser: `http://localhost:3000`
   - You should see the Admin Dashboard login page

### 📱 Frontend Setup (React Native)

1. **Navigate to mobile app directory:**
   ```bash
   cd frontend/SamvadApp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **For Android:**
   ```bash
   npx react-native run-android
   ```

4. **For iOS (Mac only):**
   ```bash
   cd ios && pod install && cd ..
   npx react-native run-ios
   ```

### 🔧 Configuration

#### Mobile App API Configuration
Edit `frontend/SamvadApp/src/services/api.ts`:
```typescript
// Change this to your backend URL
const BASE_URL = 'http://YOUR_IP_ADDRESS:3000/api';
```

**For Android Emulator:** Use `http://10.0.2.2:3000/api`  
**For iOS Simulator:** Use `http://localhost:3000/api`  
**For Physical Device:** Use your computer's IP address

### 🎯 Demo Accounts

#### Citizen Account
- **Email:** `citizen@example.com`
- **Type:** Citizen
- **Usage:** Mobile app login

#### Admin Account  
- **Email:** `admin@government.in`
- **Type:** Admin
- **Usage:** Web dashboard login

### 📊 Demo Data

The system initializes with:
- Default admin and citizen users
- Empty issues database (JSON file)
- AI categorization rules for Pothole, Drainage, Streetlight

### 🔍 Verification Steps

1. **Backend Health Check:**
   ```bash
   curl http://localhost:3000/api/issues?userType=admin
   ```
   Should return: `{"success":true,"data":[],"message":"Retrieved 0 issues"}`

2. **Mobile App Connection:**
   - Login with citizen@example.com
   - Check console logs for API connection errors

3. **Admin Dashboard:**
   - Access `http://localhost:3000`
   - Login with admin@government.in
   - Verify "No issues reported yet" message

### 🚨 Troubleshooting

#### Backend Issues
```bash
# Check if port 3000 is available
lsof -i :3000

# Clear npm cache if needed
npm cache clean --force
```

#### Mobile App Issues
```bash
# Reset Metro cache
npx react-native start --reset-cache

# For Android build issues
cd android && ./gradlew clean && cd ..
```

#### Network Issues
- Ensure mobile device and computer are on same WiFi
- Disable Windows Firewall temporarily
- Check antivirus blocking connections

### 📁 Project Structure
```
samvad-civic-platform/
├── backend/                 # Next.js API server
│   ├── pages/api/          # API endpoints
│   ├── lib/dataManager.js  # Data storage
│   ├── data/               # JSON database files
│   └── styles/             # CSS for admin dashboard
├── frontend/SamvadApp/     # React Native mobile app
│   ├── src/screens/        # App screens
│   ├── src/services/       # API service
│   └── src/components/     # Reusable components
├── shared/                 # Shared TypeScript types
├── docs/                   # Documentation
└── README.md
```

### 🎬 Pre-Demo Checklist

- [ ] Backend server running (`npm run dev` in backend/)
- [ ] Mobile app installed and running
- [ ] Admin dashboard accessible at localhost:3000
- [ ] Demo accounts working (citizen@example.com, admin@government.in)
- [ ] Network connectivity between mobile and backend
- [ ] Clear any existing demo data if needed

### 🔄 Reset Demo Data

To clear all issues and start fresh:
```bash
# Stop backend server
# Delete data files
rm backend/data/issues.json
# Restart backend server
cd backend && npm run dev
```

### 📞 Support

For technical issues during demo:
1. Check console logs in both mobile app and browser
2. Verify API endpoints are responding
3. Use backup demo screenshots if needed
4. Fall back to browser mobile view if React Native fails

### 🌐 Production Deployment Notes

**Backend:**
- Deploy to Vercel, Netlify, or AWS
- Replace JSON storage with PostgreSQL
- Add proper authentication and security

**Mobile App:**
- Build release APK/IPA
- Configure production API endpoints
- Submit to app stores

**Environment Variables:**
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
API_BASE_URL=https://api.samvad.gov.in
```