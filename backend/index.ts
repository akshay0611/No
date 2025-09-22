import dotenv from "dotenv";
// Load environment variables first
dotenv.config();

import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
// import { setupVite, serveStatic } from "./vite"; // Disabled for clean separation
import { connectDB } from "./db";
import { errorHandler } from "./errorHandler";
import { wsManager } from "./websocket";
import path from "path";
import { fileURLToPath } from "url";

// Needed for serving static in production
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment variables already loaded at the top

// Connect to MongoDB
let isMongoConnected = false;
connectDB()
  .then(() => {
    isMongoConnected = true;
    console.log("✅ MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    console.log("⚠️ Continuing with in-memory storage for development...");
  });

const app = express();

// CORS configuration for frontend communications
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Setting up CORS...');

app.use(cors({
  origin: function (origin, callback) {
    console.log('CORS request from origin:', origin);
    
    const allowedOrigins = [
      'https://noline-woad.vercel.app',  // Production frontend
      'http://localhost:3000',          // Local development
      'http://127.0.0.1:3000',         // Local development alternative
      undefined                         // Allow requests with no origin (mobile apps, etc.)
    ];
    
    if (allowedOrigins.includes(origin)) {
      console.log('Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('Origin blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200 // For legacy browser support
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check route for Railway
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    mongo: isMongoConnected ? "connected" : "disconnected",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Basic root route
app.get("/", (req, res) => {
  res.json({
    message: "SMART-Q Backend API",
    status: "running",
    version: "1.0.0",
    env: process.env.NODE_ENV,
    cors_info: "CORS should allow https://noline-woad.vercel.app"
  });
});

// CORS test endpoint
app.get("/api/cors-test", (req, res) => {
  res.json({
    message: "CORS is working!",
    origin: req.get('Origin'),
    timestamp: new Date().toISOString()
  });
});

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  const pathName = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (pathName.startsWith("/api")) {
      let logLine = `${req.method} ${pathName} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      console.log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Custom error handler
  app.use(errorHandler);

  const env = app.get("env") || "development";

  if (env === "development") {
    // Development mode - backend only, frontend runs separately
    console.log("🔧 Running in development mode - backend only");
    console.log("🌐 Frontend should be running separately on http://localhost:3000");
  } else {
    // ✅ Serve frontend build in production
    // NOTE: server runs from dist/server.js, so frontend dist is at ../frontend/dist
    const clientDistPath = path.resolve(__dirname, "../frontend/dist");

    app.use(express.static(clientDistPath));

    // Fallback for React Router
    app.get("*", (req, res) => {
      res.sendFile(path.join(clientDistPath, "index.html"));
    });
  }

  // Initialize WebSocket server
  wsManager.initialize(server);

  // Listen on Render’s port
  const port = parseInt(process.env.PORT || "5001", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
     console.log(`🚀 Serving on port ${port}`);
     console.log(`🔌 WebSocket server ready on ws://localhost:${port}/ws`);
    }
  );
})();
