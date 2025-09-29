import jwt from 'jsonwebtoken';

const JWT_SECRET = "smartq-development-secret-key";

const userData = {
    userId: "test-user-123",
    email: "test@example.com", 
    role: "salon_owner"
};

const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '24h' });
console.log('Generated JWT Token:', token);