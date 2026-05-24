import { GoogleGenAI } from "@google/genai";
import type { AspectRatio } from "@/types/generation";

const apiKey = process.env.GEMINI_API_KEY || '';

// Initialize client only if key is present to avoid immediate errors
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateImage = async (
  prompt: string,
  aspectRatio: AspectRatio = '1:1',
  referenceImageBase64?: string
): Promise<string> => {
  console.log("🔑 Gemini API Key available:", !!apiKey);
  console.log("🤖 AI Client initialized:", !!ai);

  if (!apiKey || !ai) {
    throw new Error("Gemini API Key is missing. Please check your environment variables.");
  }

  try {
    console.log("📝 Generating with prompt:", prompt.substring(0, 50) + "...");
    console.log("📐 Aspect ratio:", aspectRatio);

    const parts: any[] = [];

    // If a reference image is provided, add it to the parts
    if (referenceImageBase64) {
      // Extract the actual base64 data and mime type
      // Expected format: "data:image/png;base64,..."
      let mimeType = 'image/png';
      let data = referenceImageBase64;

      const matches = referenceImageBase64.match(/^data:(.+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        mimeType = matches[1];
        data = matches[2];
      }

      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: data
        }
      });
    }

    // Add text prompt
    parts.push({ text: prompt });

    // Using gemini-2.5-flash-image for image generation
    console.log("🚀 Calling Gemini API...");
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: parts,
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
        },
      },
    });

    console.log("✅ Gemini API response received");
    console.log("📊 Response candidates:", response.candidates?.length || 0);

    let imageUrl = '';

    console.log("🔍 Checking response structure...");
    console.log("Has candidates:", !!response.candidates);
    console.log("Has first candidate:", !!response.candidates?.[0]);
    console.log("Has content:", !!response.candidates?.[0]?.content);
    console.log("Has parts:", !!response.candidates?.[0]?.content?.parts);

    // Iterate through parts to find the image
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      const parts = response.candidates[0].content.parts;
      console.log("📦 Number of parts:", parts.length);

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        console.log(`Part ${i}:`, {
          hasInlineData: !!part.inlineData,
          hasText: !!part.text,
          keys: Object.keys(part),
        });

        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          console.log("🖼️ Found image data!");
          console.log("Image data length:", base64EncodeString?.length || 0);
          console.log("MIME type:", mimeType);
          imageUrl = `data:${mimeType};base64,${base64EncodeString}`;
          break;
        }
      }
    }

    if (!imageUrl) {
      console.error("❌ No image data found in response");
      console.error("Full response structure:", JSON.stringify(response, null, 2).substring(0, 500));
      throw new Error("No image data found in the response.");
    }

    console.log("✨ Image URL created successfully, length:", imageUrl.length);
    return imageUrl;

  } catch (error: any) {
    console.error("❌ Gemini Image Generation Error:", error);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 3),
    });
    throw new Error(error.message || "Failed to generate image with Gemini.");
  }
};
