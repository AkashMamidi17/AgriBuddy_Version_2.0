import fs from "fs";
import path from "path";
import os from "os";
import { storage } from "./storage.js";
import { InsertUser, Product, Post } from "./types.js";
import OpenAI from "openai";
import { z } from "zod";
import db from './db.js';
import { products } from './schema.js';

// Initialize OpenAI client lazily
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set in environment variables");
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

const OPENAI_MODEL = "gpt-4-turbo-preview";

// Store conversation history and user sessions
const userSessions: Map<string, {
  stage: 'initial' | 'name' | 'location' | 'userType' | 'username' | 'complete';
  data: Partial<InsertUser>;
  history: Array<{ role: "system" | "user" | "assistant"; content: string }>;
}> = new Map();

// Function to handle voice input processing
export async function processVoiceInput(audioBuffer: Buffer, sourceLanguage: string = "te", sessionId: string = "default") {
  let tempFilePath = "";
  
  try {
    const client = getOpenAIClient();
    // Create a temporary file for the audio
    const tempDir = os.tmpdir();
    tempFilePath = path.join(tempDir, `audio-${Date.now()}.wav`);
    
    // Write the buffer to a temporary file
    fs.writeFileSync(tempFilePath, audioBuffer);
    
    // Convert audio to text using Whisper API
    const transcription = await client.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: "whisper-1",
      language: sourceLanguage,
    });

    console.log("Transcription:", transcription.text);

    // Get or initialize session
    if (!userSessions.has(sessionId)) {
      userSessions.set(sessionId, {
        stage: 'initial',
        data: {},
        history: []
      });
    }

    const session = userSessions.get(sessionId)!;
    
    // Prepare system message based on context
    const systemMessage = `You are AgriBuddy, an AI assistant for farmers. You can:
    1. Help farmers create profiles
    2. Provide farming advice and information
    3. Help farmers connect with other farmers
    4. Assist in creating marketplace listings
    5. Answer questions about crops, weather, and market prices
    
    Current conversation stage: ${session.stage}
    Previous context: ${JSON.stringify(session.data)}`;

    // Add user message to history
    session.history.push({ role: "user", content: transcription.text });

    // Get AI response
    const completion = await client.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemMessage },
        ...session.history
      ],
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0].message.content || "I'm sorry, I couldn't process your request. Please try again.";
    session.history.push({ role: "assistant", content: aiResponse });

    // Handle profile creation flow
    if (aiResponse.toLowerCase().includes("name")) {
      session.stage = 'name';
    } else if (aiResponse.toLowerCase().includes("type") || aiResponse.toLowerCase().includes("farmer")) {
      session.stage = 'userType';
    } else if (aiResponse.toLowerCase().includes("location") || aiResponse.toLowerCase().includes("village")) {
      session.stage = 'location';
    } else if (aiResponse.toLowerCase().includes("username")) {
      session.stage = 'username';
    }

    // Extract and store user information
    if (session.stage === 'name') {
      const nameMatch = transcription.text.match(/my name is ([A-Za-z\s]+)/i);
      if (nameMatch) session.data.name = nameMatch[1].trim();
    } else if (session.stage === 'userType') {
      if (transcription.text.toLowerCase().includes("farmer")) {
        session.data.userType = "farmer";
      }
    } else if (session.stage === 'location') {
      const locationMatch = transcription.text.match(/from ([A-Za-z\s]+)/i);
      if (locationMatch) {
        const location = locationMatch[1].trim();
        session.data.location = location || undefined;
      }
    } else if (session.stage === 'username') {
      const usernameMatch = transcription.text.match(/username[:\s]+([A-Za-z0-9_]+)/i);
      if (usernameMatch) {
        session.data.username = usernameMatch[1].trim();
        // Create user profile
        const newUser = await storage.createUser({
          name: session.data.name || "",
          userType: session.data.userType || "farmer",
          username: session.data.username || "",
          password: `temp_${Math.random().toString(36).substring(2, 10)}`,
          location: session.data.location || "",
          updatedAt: new Date()
        });
        session.stage = 'complete';
      }
    }

    // Generate voice response
    const audioResponse = await client.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: aiResponse,
    });

    const responseAudioBuffer = Buffer.from(await audioResponse.arrayBuffer());

    return {
      text: aiResponse,
      audio: responseAudioBuffer.toString('base64'),
      sessionId,
      profileData: session.data
    };

  } catch (error) {
    console.error("Error processing voice input:", error);
    throw error;
  } finally {
    // Clean up temporary file
    if (tempFilePath) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (error) {
        console.error("Error cleaning up temporary file:", error);
      }
    }
  }
}

// Function to handle marketplace operations
export async function handleMarketplaceOperation(operation: string, data: any) {
  switch (operation) {
    case 'createListing':
      return await storage.createProduct(data as Product);
    case 'placeBid':
      return await storage.createBid(data);
    case 'getListings':
      return await storage.getAllProducts();
    default:
      throw new Error('Invalid marketplace operation');
  }
}

// Function to handle farmer connections
export async function handleFarmerConnection(operation: string, data: any) {
  switch (operation) {
    case 'createPost':
      return await storage.createPost(data as Post);
    case 'getPosts':
      return await storage.getAllPosts();
    default:
      throw new Error('Invalid connection operation');
  }
}

// Update the type for the product creation
const createProduct = async (data: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
  const [result] = await db.query(
    'INSERT INTO products (name, description, price, imageUrl, category, status, currentBid, biddingEndTime, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [data.title, data.description, data.price, data.images[0], 'general', data.status, data.currentBid, data.biddingEndTime?.toISOString().split('T')[0], data.userId]
  );
  return result;
};