const axios = require('axios');
const { GoogleGenAI, Modality } = require('@google/genai');
const fs = require("fs");
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('cloudinary').v2;

class GeminiService {
    constructor() {
        this.GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        this.ai = new GoogleGenAI({ apiKey: this.GEMINI_API_KEY });
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
    }

    async generateBlogPost(userInput) {
        const refinedPrompt = `
You are a professional blogger who writes engaging, well-formatted articles on various topics.
Based on the user's input, generate a full blog post that includes:
- A catchy title (not just a statement)
- Well-structured paragraphs
- HTML-style formatting such as:
  - <strong>Bold text</strong>
  - <em>Italic text</em>
  - <h3>Subheadings</h3>
  - <ul><li>Unordered lists</li></ul>
  - Line breaks between paragraphs

Return your response in strict JSON format with the following keys:
{
  "title": "The Title",
  "content": "Formatted blog content here...",
  "tags": ["tag1", "tag2"]
}

Make sure the JSON is valid and properly escaped.
Do not include extra explanations—just return the JSON.

Here's the topic: "${userInput}"
`;
        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.0-flash-001',
                contents: refinedPrompt,
            });
            console.log(response.text);
            const rawText = response.text;
            let parsed;
            try {
                const cleanText = rawText
                    .replace(/```json\n?|```/g, '')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    .trim();
                parsed = JSON.parse(cleanText);
            } catch (parseError) {
                throw new Error("Gemini did not return valid JSON: " + rawText);
            }
            return parsed;
        } catch (error) {
            console.error("Gemini API error:", error.message);
            if (error.response?.data) {
                console.error("Gemini API response:", error.response.data);
            }
            throw error;
        }
    }

    async generateImagePromptFromArticle(articleContent) {
        const prompt = `
    You are a creative assistant helping bloggers generate relevant image prompts for their articles.
    Based on the following blog content, create a short, vivid visual description suitable for generating an image.
    
    Requirements:
    - Keep it concise (1–2 sentences)
    - Focus on themes, mood, colors, and visual elements
    - Avoid markdown formatting
    - Do not mention logos or text overlays unless specified
    
    Blog Content:
    "${articleContent}"
    `;
        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.0-flash-001',
                contents: prompt,
            });
            const generatedPrompt = response.text;
            return generatedPrompt;
        } catch (error) {
            console.error("Error calling Gemini API:", error.message);
            if (error.response?.data) {
                console.error("Gemini API response:", error.response.data);
            }
            throw error;
        }
    }

    async generateImage(articleContent) {
        const prompt = await this.generateImagePromptFromArticle(articleContent);
        console.log(prompt);
        try {
            const response = await this.ai.models.generateContent({
                model: "gemini-2.0-flash-preview-image-generation",
                contents: prompt,
                config: {
                    responseModalities: [Modality.TEXT, Modality.IMAGE],
                }
            });
            const candidates = response.candidates || [];
            for (const candidate of candidates) {
                const parts = candidate?.content?.parts || [];
                for (const part of parts) {
                    if (part.inlineData?.data) {
                        const base64 = part.inlineData.data;
                        const mimeType = part.inlineData.mimeType || "image/png";

                        // Generate unique name for the image
                        const fileName = `blog-cover-${Date.now()}-${uuidv4()}.png`;

                        // Upload to Cloudinary
                        const uploaded = await cloudinary.uploader.upload(`data:${mimeType};base64,${base64}`, {
                            public_id: `blog/${fileName}`,
                            folder: 'blog', // Optional folder in Cloudinary
                            resource_type: 'image',
                            overwrite: false,
                            format: 'png'
                        });

                        console.log("✅ Uploaded image URL:", uploaded.secure_url);
                        return uploaded.secure_url;
                    }
                }
            }

            return null; // No image part found

        } catch (error) {
            console.error("❌ Failed to generate or upload image:", error.message);
            console.dir(error, { depth: null });
            return null;
        }
    }
}

module.exports = new GeminiService();