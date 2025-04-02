import fs from "fs";
import path from "path";
import os from "os";
import { storage } from "./storage";
import { InsertUser } from "@shared/schema";

// Use OpenAI API if key exists, otherwise use local simulation
const USE_LOCAL_SIMULATION = !process.env.OPENAI_API_KEY;

// Import OpenAI
import OpenAI from "openai";

// Initialize OpenAI client if we have an API key
let openai: any = null;
if (!USE_LOCAL_SIMULATION) {
  try {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } catch (error) {
    console.error("Failed to initialize OpenAI client:", error);
  }
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const OPENAI_MODEL = "gpt-4o";

// Store conversation history for profile creation
const userSessions: Map<string, {
  stage: 'initial' | 'name' | 'location' | 'userType' | 'username' | 'complete';
  data: Partial<InsertUser>;
  history: Array<{ role: "system" | "user" | "assistant"; content: string }>;
}> = new Map();

// Local simulation for testing without API keys
async function simulateVoiceProcessing(audioBuffer: Buffer, sourceLanguage: string = "te", sessionId: string = "default") {
  // Generate some fake text based on audio length (simulate transcription)
  const audioLength = audioBuffer.length;
  
  // Simulated transcription based on audio length
  let simulatedText = "Hello, I need help with farming";
  
  if (audioLength < 10000) {
    simulatedText = "Hello, I need some quick advice";
  } else if (audioLength > 50000) {
    simulatedText = "I want to know detailed information about crop diseases and their prevention methods";
  }
  
  // If there are multiple recording attempts, simulate a profile creation flow
  if (userSessions.has(sessionId)) {
    const session = userSessions.get(sessionId)!;
    
    // Simulate different stages of profile creation
    if (session.stage === 'name') {
      simulatedText = "My name is Rajesh Kumar";
    } else if (session.stage === 'userType') {
      simulatedText = "I am a farmer";
    } else if (session.stage === 'location') {
      simulatedText = "I am from Hyderabad village";
    } else if (session.stage === 'username') {
      simulatedText = "My username is rajesh_farmer";
    }
  }
  
  // Detect if this is a profile creation request
  if (simulatedText.toLowerCase().includes("create profile") || 
      simulatedText.toLowerCase().includes("sign up") || 
      simulatedText.toLowerCase().includes("register")) {
    simulatedText = "I want to create a profile";
  }
  
  console.log("Simulated transcription:", simulatedText);
  return { text: simulatedText };
}

// Function to generate simulated AI responses
async function simulateAIResponse(text: string, sourceLanguage: string, session?: any) {
  let response = "";
  let imageUrl = null;
  
  // Check if this is a profile creation conversation
  const isProfileCreation = text.toLowerCase().includes("create profile") || 
                           text.toLowerCase().includes("sign up") ||
                           text.toLowerCase().includes("register");
  
  if (isProfileCreation && (!session || session.stage === 'initial' || session.stage === 'name')) {
    response = "Great! I'll help you create a profile. What is your full name?";
  } else if (session && session.stage !== 'complete') {
    // Handle different stages of profile creation
    if (session.stage === 'name' && text.toLowerCase().includes("name")) {
      const nameMatch = text.match(/my name is ([A-Za-z\s]+)/i) || 
                       text.match(/name[:\s]+([A-Za-z\s]+)/i);
      
      if (nameMatch && nameMatch[1]) {
        session.data.name = nameMatch[1].trim();
        session.stage = 'userType';
        response = `Thanks ${session.data.name}! Are you a farmer or a consumer?`;
      } else {
        response = "I didn't catch your name. Could you please tell me your full name?";
      }
    } else if (session.stage === 'userType') {
      if (text.toLowerCase().includes("farmer")) {
        session.data.userType = "farmer";
        session.stage = 'location';
        response = "Great! Which village or town are you from?";
      } else if (text.toLowerCase().includes("consumer")) {
        session.data.userType = "consumer";
        session.stage = 'location';
        response = "Excellent! Which city or town do you live in?";
      } else {
        response = "Please let me know if you're a farmer who grows produce or a consumer who buys produce.";
      }
    } else if (session.stage === 'location') {
      const locationMatch = text.match(/from ([A-Za-z\s]+)/i) ||
                           text.match(/village[:\s]+([A-Za-z\s]+)/i) ||
                           text.match(/city[:\s]+([A-Za-z\s]+)/i);
      
      if (locationMatch && locationMatch[1]) {
        session.data.location = locationMatch[1].trim();
        session.stage = 'username';
        response = "Almost done! What username would you like to use for logging in?";
      } else {
        response = "I need to know which village, town, or city you're from. Please specify your location.";
      }
    } else if (session.stage === 'username') {
      const usernameMatch = text.match(/username[:\s]+([A-Za-z0-9_]+)/i) ||
                           text.match(/login[:\s]+([A-Za-z0-9_]+)/i) ||
                           text.match(/([A-Za-z0-9_]+)/i);
      
      if (usernameMatch && usernameMatch[1]) {
        session.data.username = usernameMatch[1].trim();
        session.stage = 'complete';
        
        // Generate password
        const tempPassword = `temp_${Math.random().toString(36).substring(2, 10)}`;
        
        // Create the user
        try {
          const profileData = {
            ...session.data,
            password: tempPassword
          };
          
          const newUser = await storage.createUser(profileData);
          console.log("New user created:", newUser);
          
          response = `Great! I've collected all the information needed for your profile:
          - Name: ${session.data.name}
          - Type: ${session.data.userType} 
          - Location: ${session.data.location}
          - Username: ${session.data.username}
          
          Your profile has been created successfully. You can now log in with your username.
          A temporary password has been generated for you, which you should change after logging in.`;
        } catch (error) {
          console.error("Failed to create user:", error);
          response = "There was an error creating your profile. Please try again later.";
        }
      } else {
        response = "Please provide a username that you'll use to log in to the platform.";
      }
    }
  } else {
    // Regular farming assistant responses
    if (text.toLowerCase().includes("crop") && text.toLowerCase().includes("disease")) {
      response = "Common crop diseases include leaf spot, powdery mildew, and rust. To prevent diseases, practice crop rotation, use resistant varieties, and maintain good field hygiene. [GENERATE_IMAGE]";
      imageUrl = "https://images.unsplash.com/photo-1624638760852-0e4490a51b12?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1024&q=80";
    } else if (text.toLowerCase().includes("weather")) {
      response = "For accurate weather forecasts, I recommend checking local weather services. Generally, prepare for monsoon season by ensuring proper drainage in your fields, and have irrigation plans ready for dry spells.";
    } else if (text.toLowerCase().includes("price") || text.toLowerCase().includes("market")) {
      response = "Current market trends show stable prices for rice and wheat. Consider diversifying your crops to include in-demand vegetables like tomatoes and onions, which are fetching good prices this season.";
    } else if (text.toLowerCase().includes("fertilizer") || text.toLowerCase().includes("soil")) {
      response = "For healthy soil, use a balanced approach: rotate crops, add organic matter, and test soil before applying fertilizers. Overuse of chemical fertilizers can damage soil health long-term.";
    } else if (text.toLowerCase().includes("equipment") || text.toLowerCase().includes("machinery")) {
      response = "Small tractors and power tillers are good investments for medium-sized farms. Consider forming a cooperative with neighboring farmers to share costs of expensive equipment like harvesters.";
    } else {
      response = "Thank you for your question about farming. I can provide information on crop management, weather patterns, market prices, soil health, and farming equipment. What specific agricultural topic would you like to learn more about?";
    }
  }
  
  // Generate a simulated audio response
  // In a real implementation, this would use text-to-speech
  const simulatedAudioData = Buffer.from("Simulated audio data").toString('base64');
  
  return {
    response,
    audioResponse: simulatedAudioData,
    imageUrl,
    profileCreation: session?.stage !== 'complete' && session?.stage !== 'initial'
  };
}

export async function processVoiceInput(audioBuffer: Buffer, sourceLanguage: string = "te", sessionId: string = "default") {
  try {
    // Create a temporary file for the audio
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `audio-${Date.now()}.wav`);
    
    try {
      // Write the buffer to a temporary file
      fs.writeFileSync(tempFilePath, audioBuffer);
      
      console.log("Audio file saved temporarily:", tempFilePath);
      
      // Determine whether to use OpenAI API or local simulation
      let transcription;
      if (USE_LOCAL_SIMULATION) {
        transcription = await simulateVoiceProcessing(audioBuffer, sourceLanguage, sessionId);
      } else {
        // 1. Convert audio to text using Whisper API
        transcription = await openai.audio.transcriptions.create({
          file: fs.createReadStream(tempFilePath),
          model: "whisper-1",
          language: sourceLanguage,
        });
      }

      console.log("Transcription successful:", transcription.text);

      // Check if this is a profile creation conversation
      const isProfileCreation = transcription.text.toLowerCase().includes("create profile") || 
                               transcription.text.toLowerCase().includes("sign up") ||
                               transcription.text.toLowerCase().includes("register") ||
                               transcription.text.toLowerCase().includes("new account");

      // Get or initialize session
      if (!userSessions.has(sessionId) && isProfileCreation) {
        userSessions.set(sessionId, {
          stage: 'initial',
          data: {},
          history: []
        });
      }

      const session = userSessions.get(sessionId);
      let responseData;
      
      // Use local simulation or OpenAI API based on availability
      if (USE_LOCAL_SIMULATION) {
        responseData = await simulateAIResponse(transcription.text, sourceLanguage, session);
      } else {
        // Prepare system message based on conversation context
        let systemMessage = "";
        let responseContent = "";
        
        if (session && (session.stage !== 'complete')) {
          // This is a profile creation session
          systemMessage = `You are AgriBuddy's registration assistant. You are helping a user create a profile.
            Current stage: ${session.stage}.
            Your job is to collect the following information in a natural conversation:
            - name (full name)
            - userType (must be either 'farmer' or 'consumer')
            - location (village or town name)
            - username (preferred login name)
            
            For each response, follow these rules:
            1. Focus on collecting just ONE piece of missing information at a time.
            2. After collecting a piece of information, confirm it with the user.
            3. Use a friendly, conversational tone appropriate for rural users.
            4. Respond in the same language as the user's message (${sourceLanguage}).
            5. If the user provides multiple pieces of information at once, process them all.
            6. When all information is collected, include [PROFILE_COMPLETE] in your response, followed by JSON.
            7. Do not ask for a password - the system will handle that separately.`;
          
          // Add conversation history
          session.history.push({ role: "user", content: transcription.text });
          
          // Process the user input based on current stage
          if (session.stage === 'initial') {
            session.stage = 'name';
          }

          // Extract information based on the current stage and user input
          const userInput = transcription.text.toLowerCase();
          
          // Extract name if in name stage or if name is mentioned
          if (session.stage === 'name' && !session.data.name) {
            const nameMatch = transcription.text.match(/my name is ([A-Za-z\s]+)/i) || 
                             transcription.text.match(/name[:\s]+([A-Za-z\s]+)/i) ||
                             transcription.text.match(/([A-Za-z\s]+) is my name/i);
            
            if (nameMatch && nameMatch[1]) {
              session.data.name = nameMatch[1].trim();
              session.stage = 'userType';
            }
          }
          
          // Extract user type if in userType stage or if user type is mentioned
          if ((session.stage === 'userType' || !session.data.userType) && 
              (userInput.includes('farmer') || userInput.includes('consumer'))) {
            session.data.userType = userInput.includes('farmer') ? 'farmer' : 'consumer';
            if (session.stage === 'userType') session.stage = 'location';
          }
          
          // Extract location if in location stage or if location is mentioned
          if ((session.stage === 'location' || !session.data.location) && 
              (userInput.includes('village') || userInput.includes('city') || 
              userInput.includes('from') || userInput.includes('location'))) {
            const locationMatch = transcription.text.match(/from ([A-Za-z\s]+)/i) ||
                                transcription.text.match(/village[:\s]+([A-Za-z\s]+)/i) ||
                                transcription.text.match(/city[:\s]+([A-Za-z\s]+)/i) ||
                                transcription.text.match(/location[:\s]+([A-Za-z\s]+)/i);
            
            if (locationMatch && locationMatch[1]) {
              session.data.location = locationMatch[1].trim();
              if (session.stage === 'location') {
                session.stage = session.data.username ? 'complete' : 'username';
              }
            }
          }
          
          // Extract username if in username stage or if username is mentioned
          if (((session.stage === 'username' && !session.data.username) || 
              (!session.data.username && (userInput.includes('username') || userInput.includes('login') || userInput.includes('account'))))) {
            const usernameMatch = transcription.text.match(/username[:\s]+([A-Za-z0-9_]+)/i) ||
                                transcription.text.match(/login[:\s]+([A-Za-z0-9_]+)/i) ||
                                transcription.text.match(/account[:\s]+([A-Za-z0-9_]+)/i);
            
            if (usernameMatch && usernameMatch[1]) {
              session.data.username = usernameMatch[1].trim();
              if (session.data.name && session.data.userType && session.data.location) {
                session.stage = 'complete';
              }
            }
          }

          // Check if profile is complete
          const isComplete = session.data.name && session.data.userType && 
                            session.data.location && session.data.username;
                            
          // Prepare the next prompt based on current stage and collected data
          let nextPrompt;
          if (isComplete) {
            const profileData = {
              ...session.data,
              // Generate a temporary password that user can change later
              password: `temp_${Math.random().toString(36).substring(2, 10)}`
            };
            
            nextPrompt = `Great! I've collected all the information needed for your profile:
              - Name: ${session.data.name}
              - Type: ${session.data.userType} 
              - Location: ${session.data.location}
              - Username: ${session.data.username}
              
              [PROFILE_COMPLETE] ${JSON.stringify(profileData)}
              
              Your profile has been created successfully. You can now log in with your username.
              A temporary password has been generated for you, which you should change after logging in.`;
              
            session.stage = 'complete';
          } else if (session.stage === 'name' && !session.data.name) {
            nextPrompt = "To create your profile, I need some information. What is your full name?";
          } else if (session.stage === 'userType' && !session.data.userType) {
            nextPrompt = `Thanks ${session.data.name}. Are you a farmer or a consumer?`;
          } else if (session.stage === 'location' && !session.data.location) {
            nextPrompt = `Great! Now, which village or town are you from?`;
          } else if (session.stage === 'username' && !session.data.username) {
            nextPrompt = `Almost done! What username would you like to use for logging in?`;
          } else {
            // Handle partial information case
            const missingFields = [];
            if (!session.data.name) missingFields.push("name");
            if (!session.data.userType) missingFields.push("whether you're a farmer or consumer");
            if (!session.data.location) missingFields.push("location");
            if (!session.data.username) missingFields.push("username");
            
            nextPrompt = `I still need to know your ${missingFields.join(", ")}. Can you provide this information?`;
          }
          
          // 2. Get AI response based on our next prompt
          const completion = await openai.chat.completions.create({
            model: OPENAI_MODEL,
            messages: [
              { role: "system", content: systemMessage },
              ...session.history,
              { role: "user", content: nextPrompt },
            ],
            max_tokens: 500,
          });
          
          responseContent = completion.choices[0].message.content || "";
          
          // Check if profile is complete and extract the JSON data
          if (responseContent.includes("[PROFILE_COMPLETE]")) {
            try {
              const jsonMatch = responseContent.match(/\[PROFILE_COMPLETE\]\s*({[^}]+})/);
              if (jsonMatch && jsonMatch[1]) {
                const profileData = JSON.parse(jsonMatch[1]);
                console.log("Profile creation data:", profileData);
                
                // Create the user in the database
                try {
                  const newUser = await storage.createUser(profileData);
                  console.log("New user created:", newUser);
                  
                  // Clean up the JSON data from the response
                  responseContent = responseContent.replace(/\[PROFILE_COMPLETE\]\s*({[^}]+})/, "[PROFILE_COMPLETE]");
                } catch (dbError) {
                  console.error("Failed to create user:", dbError);
                  responseContent += "\n\nThere was an error creating your profile. Please try again later.";
                }
              }
            } catch (jsonError) {
              console.error("Failed to parse profile data:", jsonError);
            }
          }
          
          // Add AI response to history
          session.history.push({ role: "assistant", content: responseContent });
        } else {
          // Normal conversation mode
          systemMessage = `You are AgriBuddy, a multilingual farming assistant specializing in agricultural advice. 
          Respond in the same language as the user's query (${sourceLanguage}). Focus on providing practical, region-specific farming advice.
          Format responses to be easily readable and actionable.
          If the user asks about crop diseases, pest management, or needs visual guidance, include "[GENERATE_IMAGE]" in your response.
          If the user wants to create a profile or register, suggest starting a new conversation with "create profile".
          Make your responses natural and conversational.`;
          
          // 2. Get AI response using GPT-4o
          const completion = await openai.chat.completions.create({
            model: OPENAI_MODEL,
            messages: [
              { role: "system", content: systemMessage },
              { role: "user", content: transcription.text }
            ],
            max_tokens: 500,
          });
          
          responseContent = completion.choices[0].message.content || "";
        }

        // 3. Generate image if needed (for visual explanations)
        let imageUrl = null;
        
        if (responseContent.includes("[GENERATE_IMAGE]")) {
          const cleanPrompt = responseContent.replace("[GENERATE_IMAGE]", "").trim();
          const image = await openai.images.generate({
            model: "dall-e-3",
            prompt: `Agricultural visualization for farmers: ${cleanPrompt}. Create a clear, instructional image that would be helpful for farmers.`,
            n: 1,
            size: "1024x1024",
          });
          imageUrl = image.data[0].url;
          console.log("Image generated:", imageUrl);
        }

        // 4. Convert response to speech
        const cleanResponse = responseContent.replace("[GENERATE_IMAGE]", "")
                                            .replace(/\[PROFILE_COMPLETE\]/g, "")
                                            .trim();
                                            
        const speech = await openai.audio.speech.create({
          model: "tts-1",
          voice: sourceLanguage === "te" ? "nova" : "alloy", // Use appropriate voice for language
          input: cleanResponse,
        });

        console.log("Speech generation successful");

        // Get audio as base64
        const audioResponse = Buffer.from(await speech.arrayBuffer()).toString('base64');
        
        responseData = {
          response: cleanResponse,
          audioResponse,
          imageUrl,
          profileCreation: session?.stage !== 'complete' && session?.stage !== 'initial'
        };
      }

      return {
        text: transcription.text,
        ...responseData
      };
    } finally {
      // Clean up the temporary file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
        console.log("Temporary audio file deleted");
      }
    }
  } catch (error) {
    console.error("AI processing error:", error);
    throw new Error(`Failed to process voice input: ${error instanceof Error ? error.message : String(error)}`);
  }
}