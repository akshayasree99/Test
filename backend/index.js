import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Load API key from JSON file
const googleKey = JSON.parse(fs.readFileSync('google-key.json', 'utf8'));
const GEMINI_API_KEY = googleKey.api_key;

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });



app.post('/api/wound-detection', upload.single('image'), async (req, res) => {

    console.log("Request received");
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image uploaded' });
        }

        // Read file and convert to base64
        const imageBase64 = fs.readFileSync(req.file.path, { encoding: 'base64' });

        const response = await axios.post(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent',
            {
                contents: [
                    {
                        parts: [
                            {
                                inlineData: {
                                    mimeType: 'image/jpeg',
                                    data: imageBase64
                                }
                            },
                            { text: "Detect wound and provide a description." }
                        ]
                    }
                ]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GEMINI_API_KEY}`
                }
            }
        );

        fs.unlinkSync(req.file.path);

        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, message: 'Failed to detect wound' });
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

