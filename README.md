# SmartQ - Salon Queue Management System

## Project Structure

### Backend (server/) 

This project is organized as a monorepo with separate frontend and backend applications:

```
smart-q/
├── frontend/               # React + Vite application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   └── types/          # TypeScript type definitions
│   ├── package.json        # Frontend dependencies
│   ├── vite.config.ts      # Vite configuration
│   └── vercel.json         # Vercel deployment config
├── backend/                # Express + TypeScript API
│   ├── routes.ts           # API routes
│   ├── db.ts              # Database configuration
│   ├── index.ts           # Server entry point
│   ├── package.json        # Backend dependencies
│   ├── tsconfig.json       # TypeScript configuration
│   └── nodemon.json        # Nodemon configuration
├── shared/                 # Shared types and utilities
├── package.json            # Root package.json with scripts
└── render.yaml            # Railway deployment config
```

## 🚀 Features

- **Real-time Queue Management**: Live updates on queue status and wait times
- **Multi-channel Notifications**: SMS, WhatsApp, and email notifications
- **Customer Portal**: Self-service queue joining and status checking
- **Admin Dashboard**: Comprehensive management interface for staff
- **Analytics & Reporting**: Detailed insights into queue performance
- **Multi-location Support**: Manage queues across multiple branches
- **Appointment Scheduling**: Allow customers to book specific time slots

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **React Query** for data fetching
- **Wouter** for routing

### Backend
- **Node.js** with Express and TypeScript
- **MongoDB** with Mongoose ODM
- **WebSocket** for real-time updates
- **JWT** authentication with Passport.js
- **Nodemon** for development auto-reload

### Services & APIs
- **Twilio** for SMS notifications
- **WhatsApp Business API** for WhatsApp messaging
- **Nodemailer** for email notifications
- **Cloudinary** for file storage

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB database
- Twilio account (for SMS)
- WhatsApp Business API access
- Cloudinary account (for file uploads)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd smart-q
npm run install:all
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Database
MONGO_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# WhatsApp
WHATSAPP_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id

# Email
EMAIL_USER=your_email_address
EMAIL_PASS=your_email_password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Server
PORT=5001
NODE_ENV=development
```

### 3. Development

Start both frontend and backend in development mode:

```bash
npm run dev
```

This will start:
- Frontend: `http://localhost:3000` (Vite dev server)
- Backend: `http://localhost:5001` (Express with nodemon)

### Individual Development Commands

```bash
# Frontend only
npm run dev:frontend

# Backend only  
npm run dev:backend
```

## 🏗️ Building & Deployment

### Build for Production

```bash
npm run build
```

### Deployment

#### Frontend (Vercel)
The frontend is configured for Vercel deployment with `vercel.json`:

1. Connect your repository to Vercel
2. Set the root directory to `frontend`
3. Vercel will automatically detect the Vite configuration

#### Backend (Railway)
The backend is configured for Railway deployment with `render.yaml`:

1. Connect your repository to Railway
2. Railway will use the build and start commands from the configuration
3. Set environment variables in Railway dashboard

### Environment Variables for Production

Update the CORS configuration in `backend/index.ts` with your production frontend URL:

```typescript
origin: process.env.NODE_ENV === 'production' 
  ? ['https://your-frontend-domain.vercel.app']
  : ['http://localhost:3000', 'http://127.0.0.1:3000']
```

## 📁 Key Configuration Files

- **Root `package.json`**: Monorepo scripts and workspace configuration
- **Frontend `vite.config.ts`**: Vite configuration with proxy for API calls
- **Backend `nodemon.json`**: Auto-reload configuration for development
- **Backend `tsconfig.json`**: TypeScript configuration for Node.js
- **Frontend `tsconfig.json`**: TypeScript configuration for React
- **`vercel.json`**: Vercel deployment configuration
- **`render.yaml`**: Railway deployment configuration

## 🔧 Development Features

- **Hot Reload**: Both frontend (Vite HMR) and backend (nodemon) support hot reloading
- **CORS Configured**: Frontend can communicate with backend seamlessly
- **TypeScript**: Full TypeScript support across the entire stack
- **Shared Types**: Common types and utilities in the `shared` directory
- **Concurrent Development**: Run both frontend and backend simultaneously

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Queue Management
- `GET /api/queues` - Get all queues
- `POST /api/queues` - Create new queue
- `PUT /api/queues/:id` - Update queue
- `DELETE /api/queues/:id` - Delete queue

### Customer Management
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Add customer to queue
- `PUT /api/customers/:id` - Update customer status
- `DELETE /api/customers/:id` - Remove customer from queue

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.