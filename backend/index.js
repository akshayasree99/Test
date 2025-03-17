import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = 'gemini-1.5-flash';

app.use(cors());
app.use(express.json());

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only image files are allowed!'), false);
  }
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads/')) fs.mkdirSync('uploads/');

app.post('/api/wound-detection', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.json({ data: [] }); // ✅ Return empty array if no image

    const imageBase64 = fs.readFileSync(req.file.path, { encoding: 'base64' });

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              { inlineData: { mimeType: req.file.mimetype, data: imageBase64 } },
              { text: `Analyze this image and return ONLY JSON in the format:
                {
                  "data": [
                    {
                      "type": "string",
                      "location": "string",
                      "appearance": {
                        "color": "string",
                        "size": "string",
                        "texture": "string"
                      },
                      "infection": "string",
                      "severity": "integer (1-5)"
                    }
                  ]
                }
                If no wounds are detected, return { "data": [] } ONLY.` }
            ]
          }
        ],
        generationConfig: { temperature: 0.2, maxOutputTokens: 800 }
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    fs.unlinkSync(req.file.path);

    try {
      const textContent = response.data.candidates[0].content.parts[0].text;
      const cleanText = textContent.replace(/```json\n?|\n?```/g, '').trim();
      const parsedData = JSON.parse(cleanText);
        console.log(parsedData);
      return res.json({ data: parsedData.data[0]}); // ✅ Now wraps in { "data": [...] }
    } catch (parseError) {
      console.error("Parse error:", parseError);
      return res.json({ data: [] });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.json({ data: [] });
  }
});

// Health check endpoint
app.get('/health', (req, res) => res.status(200).send('ok'));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
