import OpenAI from "openai";
import fs from "fs";
import path from "path";
import os from "os";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const OPENAI_MODEL = "gpt-4o";

export async function processVoiceInput(audioBuffer: Buffer, sourceLanguage: string = "te") {
  try {
    // Create a temporary file for the audio
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `audio-${Date.now()}.wav`);
    
    try {
      // Write the buffer to a temporary file
      fs.writeFileSync(tempFilePath, audioBuffer);
      
      console.log("Audio file saved temporarily:", tempFilePath);
      
      // 1. Convert audio to text using Whisper
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: "whisper-1",
        language: sourceLanguage,
      });

      console.log("Transcription successful:", transcription.text);

      // 2. Get AI response using GPT-4o
      const completion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system", 
            content: `You are AgriBuddy, a multilingual farming assistant specializing in agricultural advice. 
            Respond in the same language as the user's query. Focus on providing practical, region-specific farming advice.
            Format responses to be easily readable and actionable.
            If the user asks about crop diseases, pest management, or needs visual guidance, include "[GENERATE_IMAGE]" in your response.
            Make your responses natural and conversational.`
          },
          {
            role: "user",
            content: transcription.text
          }
        ],
        max_tokens: 500,
      });

      console.log("GPT response received");

      // 3. Generate image if needed (for visual explanations)
      let imageUrl = null;
      const responseContent = completion.choices[0].message.content || "";
      
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
      const cleanResponse = responseContent.replace("[GENERATE_IMAGE]", "").trim();
      const speech = await openai.audio.speech.create({
        model: "tts-1",
        voice: sourceLanguage === "te" ? "nova" : "alloy", // Use appropriate voice for language
        input: cleanResponse,
      });

      console.log("Speech generation successful");

      // Get audio as base64
      const audioResponse = Buffer.from(await speech.arrayBuffer()).toString('base64');

      return {
        text: transcription.text,
        response: cleanResponse,
        audioResponse,
        imageUrl
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