const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const Groq = require("groq-sdk");
const cors = require("cors");
const { systemPrompt } = require("./prompts/systemPrompt");



dotenv.config();
const port = process.env.PORT || 3000;
const app = express();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use(cors());
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // keep .m4a, .mp3, .webm etc.
    cb(null, Date.now() + ext);
  }
});

// only allow supported audio formats
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = [
      ".flac", ".mp3", ".mp4", ".mpeg", ".mpga", ".m4a",
      ".ogg", ".opus", ".wav", ".webm"
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type. Upload audio only."));
    }
  }
});




// 🎯 Main API route
app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio uploaded" });
    }
    console.log(req.body)
    const { country } = req.body; // 🧠 Retrieve the country

    const audioPath = path.resolve(req.file.path);
     // 1️⃣ Transcribe audio with Groq Whisper
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-large-v3",
      prompt: systemPrompt(country),
    });
    const text = transcription.text;
    console.log(text);

            const prompt = `
            You are a medical scribe assistant. 
            Extract a complete and structured prescription in JSON format from the doctor’s spoken note below. 
            If the note lacks dosage, frequency, or duration, fill in reasonable defaults based on the diagnosis and standard ${country} medical guidelines.

            Doctor note:
            """${text}"""
        `;



    // 2️⃣ Use chat model to convert into structured prescription
    const chatResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:systemPrompt(country)
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" } // ✅ Correct for Groq
    });

    const prescription = JSON.parse(chatResponse.choices[0].message.content);
    console.log("✅ Prescription:", prescription);

    // cleanup uploaded file
    fs.unlinkSync(audioPath);

    res.json({
      transcription: text,
      prescription
    });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: err.message });
  }
});


app.listen(port, () => console.log(`🚀 Server running at http://localhost:${port}`));
