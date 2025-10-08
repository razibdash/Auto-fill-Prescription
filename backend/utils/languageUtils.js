const fs = require("fs");
const groq = require("../config/groqClient");
// Assuming 'groq' is your initialized Groq client object

async function detectLanguage(audioPath) {
  try {
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-large-v3",
      // IMPORTANT: Use 'verbose_json' to get the language code in the metadata.
      response_format: "verbose_json", 
    });

    console.log("Full transcription response (verbose_json):", transcription);

    // The detected language code is available in the 'language' field of the response.
    const languageCode = transcription.language;

    if (languageCode) {
      console.log("Detected Language Code:", languageCode);
      return languageCode;
    } else {
      console.warn("Language code not found in the response. Defaulting to 'en'.");
      return 'en'; 
    }

  } catch (err) {
    console.error("Language detection failed:", err);
    // You can keep a sensible default fallback language.
    return "en";
  }
}

// Example usage (assuming groq client is initialized and audioPath is valid)
// detectLanguage('./my_audio_file.mp3').then(code => console.log('Final Code:', code));

async function translateToEnglish(text) {
  if (!text || text.trim() === "") return "";
  const prompt = `
  Translate the following text from ${text} to English.
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
