const fs = require("fs");
const groq = require("../config/groqClient");

async function detectLanguage(audioPath) {
  try {
    const detection = await groq.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-large-v3-turbo",
    });
    return detection.language || detection.language_code ;
  } catch (err) {
    console.error("Language detection failed:", err);
    return "en";
  }
}

async function translateToEnglish(text, detectedLang) {
  if (detectedLang === "en") return text;

  const prompt = `
Translate the following text from ${detectedLang} to English. 
Return only the English text.

Original:
"""${text}"""
`;

  const translationResponse = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: "You are a medical translation assistant." },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
  });

  return translationResponse.choices[0].message.content.trim();
}

module.exports = { detectLanguage, translateToEnglish };
