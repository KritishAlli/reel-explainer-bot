const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenAI } = require('@google/genai');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const genai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

const EXPLANATION_PROMPT =
  "Analyze these sequential frames from an Instagram reel and provide a 3-sentence explanation using this exact structure: Sentence 1: State the main topic of the reel. Use the template: 'This reel is about [insert topic].' Sentence 2: Provide the essential background context a beginner would need to understand this topic. Sentence 3: Explain how that background context connects directly to what happens in the reel. CRITICAL FORMATTING RULES: 1. Output ONLY the 3 sentences. Do not include labels like 'Sentence 1:', titles, or conversational filler. 2. Insert exactly two newlines (a blank line) after Sentence 1 and after Sentence 2.";

async function explainFrames(base64Frames) {
  return explainFramesGemini(base64Frames);
}

async function explainFramesGemini(base64Frames) {
  const imageParts = base64Frames.map((data) => ({
    inlineData: { mimeType: 'image/png', data },
  }));

  const response = await genai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [...imageParts, { text: EXPLANATION_PROMPT }],
      },
    ],
  });

  return response.text ?? "Couldn't generate an explanation for this one.";
}



async function explainFramesClaude(base64Frames) {
  const imageBlocks = base64Frames.map((data) => ({
    type: 'image',
    source: { type: 'base64', media_type: 'image/png', data },
  }));

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: [
          ...imageBlocks,
          { type: 'text', text: EXPLANATION_PROMPT },
        ],
      },
    ],
  });

  const textBlock = message.content.find((c) => c.type === 'text');
  return textBlock ? textBlock.text : "Couldn't generate an explanation for this one.";
}

module.exports = { explainFrames, explainFramesGemini, explainFramesClaude };


