# Deployment Guide

## 🚀 Quick Deployment Steps

### Prerequisites
1. **Railway Account** (for backend deployment)
2. **Vercel Account** (for frontend deployment)
3. **Environment Variables** ready

### Backend Deployment (Railway)

1. **Connect Repository to Railway**
   - Go to [Railway](https://railway.app)
   - Create new project from GitHub repo
   - Select your repository

2. **Configure Build Settings**
   - Railway will automatically detect the `render.yaml` configuration
   - Build Command: `cd backend && npm install --include=dev && npm run build`
   - Start Command: `cd backend && npm start`

3. **Set Environment Variables**
   ```env
   NODE_ENV=production
   PORT=5001
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   WHATSAPP_TOKEN=your_whatsapp_token
   WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
   EMAIL_USER=your_email_address
   EMAIL_PASS=your_email_password
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

4. **Deploy**
   - Railway will automatically deploy when you push to main branch
   - Note your Railway backend URL (e.g., `https://your-app.railway.app`)

### Frontend Deployment (Vercel)

1. **Connect Repository to Vercel**
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Set **Root Directory** to `frontend`

2. **Configure Build Settings**
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Set Environment Variables**
   ```env
   VITE_API_URL=https://your-railway-backend-url.railway.app
   ```

4. **Update CORS Configuration**
   - After deployment, update `backend/index.ts`:
   ```typescript
   origin: process.env.NODE_ENV === 'production' 
     ? ['https://your-vercel-app.vercel.app'] // Replace with your actual Vercel URL
     : ['http://localhost:3000', 'http://127.0.0.1:3000']
   ```

5. **Deploy**
   - Vercel will automatically deploy
   - Your frontend will be available at `https://your-app.vercel.app`

## 🔧 Local Development Setup

### 1. Install Dependencies
```bash
# Install root dependencies (concurrently)
npm install

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies  
cd ../backend && npm install
```

### 2. Environment Setup
Create `.env` file in the root directory with all required variables.

### 3. Start Development
```bash
# From root directory - starts both frontend and backend
npm run dev

# Or individually:
npm run dev:frontend  # Frontend only (port 3000)
npm run dev:backend   # Backend only (port 5001)
```

## 📋 Post-Deployment Checklist

- [ ] Backend deployed successfully on Railway
- [ ] Frontend deployed successfully on Vercel  
- [ ] Environment variables set correctly
- [ ] CORS configuration updated with production URLs
- [ ] Database connection working
- [ ] API endpoints accessible from frontend
- [ ] Real-time features (WebSocket) working
- [ ] File uploads (Cloudinary) working
- [ ] Notifications (SMS/WhatsApp/Email) working

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure frontend URL is added to CORS configuration in backend
   - Check that both HTTP and HTTPS versions are included if needed

2. **Environment Variables**
   - Verify all required environment variables are set in both Railway and Vercel
   - Check variable names match exactly (case-sensitive)

3. **Build Failures**
   - Check that all dependencies are listed in package.json
   - Ensure TypeScript compilation passes locally first

4. **Database Connection**
   - Verify MongoDB URI is correct and accessible from Railway
   - Check database user permissions

5. **API Not Accessible**
   - Verify Railway backend URL is correct
   - Check that API routes are properly configured
   - Ensure Railway service is running

### Logs and Debugging

- **Railway Logs**: Check deployment and runtime logs in Railway dashboard
- **Vercel Logs**: Check build and function logs in Vercel dashboard
- **Local Testing**: Always test the production build locally first:
  ```bash
  npm run build
  npm start
  ```
