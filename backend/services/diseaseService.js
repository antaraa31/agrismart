const { GoogleGenerativeAI } = require('@google/generative-ai');

const analyzeImage = async (imageBuffer, mimeType) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('Gemini API Key not configured in .env');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // gemini-1.5-pro natively supports multimodal image inputs
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const prompt = `You are an expert agricultural plant pathologist. Analyze this image of a plant leaf.
Pay close attention to lesion shapes, colors, and patterns (e.g., distinguish between rust pustules and blight lesions).

1. Identify the exact disease present (e.g., Potato Early/Late Blight, Leaf Spot, Rust).
2. Provide a confidence percentage.
3. List 2 short, actionable organic or chemical treatment suggestions.

Respond ONLY with a valid JSON object using this exact structure, with no markdown formatting or extra text:
{
  "disease": "Disease Name Here",
  "confidence": "95%",
  "treatments": ["Treatment 1", "Treatment 2"]
}`;

  const imagePart = {
    inlineData: {
      data: imageBuffer.toString("base64"),
      mimeType
    },
  };

  const result = await model.generateContent([prompt, imagePart]);
  const responseText = result.response.text();

  try {
    // Strip out markdown code blocks if the AI accidentally includes them
    const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Failed to parse Gemini output as JSON:', responseText);
    throw new Error('AI returned an unparseable response.');
  }
};

module.exports = {
  analyzeImage
};
