import OpenAI from "openai";
import { createReadStream } from "fs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function processVoiceInput(audioBuffer: Buffer, sourceLanguage: string = "te") {
  try {
    // 1. Convert audio to text using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: createReadStream(audioBuffer),
      model: "whisper-1",
      language: sourceLanguage,
    });

    // 2. Get AI response using GPT-4
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: "system",
          content: `You are AgriBuddy, a multilingual farming assistant specializing in agricultural advice. 
          Respond in the same language as the user's query. Focus on providing practical, region-specific farming advice.
          Format responses to be easily readable and actionable.`
        },
        {
          role: "user",
          content: transcription.text
        }
      ],
      max_tokens: 500,
    });

    // 3. Generate image if needed (for visual explanations)
    let imageUrl = null;
    if (completion.choices[0].message.content.includes("[GENERATE_IMAGE]")) {
      const image = await openai.images.generate({
        model: "dall-e-3",
        prompt: `Agricultural visualization: ${completion.choices[0].message.content}`,
        n: 1,
        size: "1024x1024",
      });
      imageUrl = image.data[0].url;
    }

    // 4. Convert response to speech
    const speech = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: completion.choices[0].message.content,
    });

    // Get audio as base64
    const audioResponse = Buffer.from(await speech.arrayBuffer()).toString('base64');

    return {
      text: transcription.text,
      response: completion.choices[0].message.content,
      audioResponse,
      imageUrl
    };
  } catch (error) {
    console.error("AI processing error:", error);
    throw new Error("Failed to process voice input");
  }
}
