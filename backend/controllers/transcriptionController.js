const fs = require("fs");
const path = require("path");
const groq = require("../config/groqClient");
const { detectLanguage, translateToEnglish } = require("../utils/languageUtils");
const { systemPrompt,userPrompt } = require("../prompts/userPrompt");
const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');

const elevenlabs = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
});
console.log('ElevenLabs client initialized.', elevenlabs);
async function transcribeAudio(req, res) {
  try { 
    if (!req.file) return res.status(400).json({ error: "No audio uploaded" });
    const audioPath = path.resolve(req.file.path);
    const { country } = req.body;
     const filePath = req.file.path; 
    const audioFileStream = fs.createReadStream(filePath);

    // Using ElevenLabs for transcription
        const transcriptionResult = await elevenlabs.speechToText.convert({
            file: audioFileStream, 
            modelId: 'scribe_v1', 
            language: 'bn', 
            diarize: true
        });

        console.log('Transcription successful.');
           const rawText = transcriptionResult.text;
        console.log("Raw transcription:", rawText);

    // 3️  Translate to English if needed
    const englishText = await translateToEnglish(rawText);
    console.log("English transcription:", englishText);

    // 4️ Optional: Apply userPrompt + systemPrompt for structured JSON
    const prompt = userPrompt(englishText, country);

    const chatResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt(country) },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
    });

    // 4️⃣ Safely parse JSON: remove backticks, extra text
    let modelContent = chatResponse.choices[0].message.content;
    modelContent = modelContent.replace(/```/g, "").trim();
    const match = modelContent.match(/\{[\s\S]*\}/);

    if (!match) throw new Error("No valid JSON found in model output");
    const prescription = JSON.parse(match[0]);

    const transcriptionJSON = {
      transcription: englishText,
      prescription,
    };
    console.log("Final structured JSON:", transcriptionJSON);
    // Cleanup
    fs.unlinkSync(audioPath);

    res.json({
      rawTranscription: rawText,
      transcriptionJSON,
      englishTranscription: transcriptionJSON.transcription,
      prescription: transcriptionJSON.prescription,
    });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: err.message });
  }
}


module.exports = { transcribeAudio };
