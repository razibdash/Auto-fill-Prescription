const express = require("express");
const { transcribeAudio } = require("../controllers/transcriptionController");
const router = express.Router();

const { upload } = require("../utils/Upload");

// POST /api/transcribe
router.post("/transcribe", upload.single("audio"), transcribeAudio);

module.exports = router;
