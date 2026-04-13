const express = require("express");
const fs = require("fs");
const multer = require("multer");
const os = require("os");
const path = require("path");

const { uploadBankStatement } = require("../controllers/uploadController");

const router = express.Router();
const uploadDir = path.join(os.tmpdir(), "bank-statement-uploads");

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Only PDF files are allowed"));
      return;
    }

    cb(null, true);
  },
});

router.post("/upload", upload.single("file"), uploadBankStatement);

module.exports = router;
