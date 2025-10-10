// backend/services/geminiService.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize the Gemini API client
const API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

interface ServiceDetails {
  serviceName: string;
  duration?: number;
  price?: number;
}

/**
 * Generates a service description based on the service name and optional details
 * @param serviceDetails The details of the service
 * @returns Generated description for the service
 */
export async function generateServiceDescription(
  serviceDetails: string | ServiceDetails
): Promise<string> {
  try {
    // Make sure API key is available
    if (!API_KEY) {
      console.error('❌ GEMINI_API_KEY is not configured in environment variables');
      throw new Error('GEMINI_API_KEY is not configured');
    }

    console.log('✅ API Key found, length:', API_KEY.length);

    // Handle both string and object inputs for backward compatibility
    const details: ServiceDetails = 
      typeof serviceDetails === 'string' 
        ? { serviceName: serviceDetails }
        : serviceDetails;

    const { serviceName, duration, price } = details;

    console.log('📝 Generating description for:', serviceName);

    // Initialize the model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7, // Balanced creativity
        maxOutputTokens: 150, // Limit response length
      }
    });

    // Create enhanced prompt with optional details
    let prompt = `Generate a concise, professional description (2-3 sentences) for a salon service named "${serviceName}".`;
    
    if (duration) {
      prompt += ` The service takes approximately ${duration} minutes.`;
    }
    
    if (price) {
      prompt += ` It is priced at ₹${price}.`;
    }
    
    prompt += ` The description should highlight the benefits, experience, and what customers can expect. Make it engaging and suitable for a salon booking system.`;

    console.log('🤖 Calling Gemini API...');

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✨ Description generated successfully');
    console.log('📄 Generated text:', text.substring(0, 100) + '...');
    
    return text.trim();
  } catch (error: any) {
    console.error('❌ Error generating service description:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    
    // More descriptive fallback based on service name
    const serviceName = typeof serviceDetails === 'string' 
      ? serviceDetails 
      : serviceDetails.serviceName;
    
    return `Experience our professional ${serviceName} service, tailored to enhance your look and boost your confidence.`;
  }
}

/**
 * Validates if the Gemini API is properly configured
 * @returns Boolean indicating if API is ready
 */
export function isGeminiConfigured(): boolean {
  return !!API_KEY;
}