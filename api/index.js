// api/index.js
import express from 'express';
import { db, ref, set, get } from '../firebase.js';
import { customAlphabet } from 'nanoid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Initialize nanoid for generating short codes (6 characters)
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);

// POST /api/shorten - Create a shortened URL
app.post('/api/shorten', async (req, res) => {
  const { url } = req.body;

  // Basic URL validation
  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const shortCode = nanoid();
    const shortUrl = `${req.headers.origin}/${shortCode}`;

    // Store in Firebase
    await set(ref(db, `urls/${shortCode}`), {
      originalUrl: url,
      createdAt: Date.now(),
    });

    res.json({ shortUrl });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /:shortCode - Serve interstitial page
app.get('/:shortCode', async (req, res) => {
  const { shortCode } = req.params;

  try {
    const snapshot = await get(ref(db, `urls/${shortCode}`));
    if (snapshot.exists()) {
      // Serve the interstitial page with the short code
      res.sendFile(path.join(__dirname, '../public/interstitial.html'));
    } else {
      res.status(404).json({ error: 'Short URL not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default app;
