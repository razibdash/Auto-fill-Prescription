const multer = require("multer");
const fs = require("fs");
const path = require("path"); 

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

module.exports = { upload };