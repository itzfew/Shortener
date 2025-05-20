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
app.use(express.static(path.join(__dirname, '../public')));

// Initialize nanoid for generating short codes (6 characters)
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);

// POST /api/shorten - Create a shortened URL
app.post('/api/shorten', async (req, res) => {
  const { url } = req.body;

  if (!url || !url.startsWith('http')) {
    console.error('Invalid URL:', url);
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const shortCode = nanoid();
    const shortUrl = `${req.headers.origin}/${shortCode}`;

    await set(ref(db, `urls/${shortCode}`), {
      originalUrl: url,
      createdAt: Date.now(),
    });

    console.log(`Shortened URL: ${shortUrl}`);
    res.json({ shortUrl });
  } catch (error) {
    console.error('Error in /api/shorten:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/resolve/:shortCode - Fetch original URL
app.get('/api/resolve/:shortCode', async (req, res) => {
  const { shortCode } = req.params;

  try {
    const snapshot = await get(ref(db, `urls/${shortCode}`));
    if (snapshot.exists()) {
      const { originalUrl } = snapshot.val();
      console.log(`Resolved ${shortCode} to ${originalUrl}`);
      res.json({ originalUrl });
    } else {
      console.error(`Short code not found: ${shortCode}`);
      res.status(404).json({ error: 'Short URL not found' });
    }
  } catch (error) {
    console.error('Error in /api/resolve:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /:shortCode - Serve interstitial page
app.get('/:shortCode', async (req, res) => {
  const { shortCode } = req.params;

  try {
    const snapshot = await get(ref(db, `urls/${shortCode}`));
    if (snapshot.exists()) {
      res.sendFile(path.join(__dirname, '../public/interstitial.html'));
    } else {
      console.error(`Short code not found: ${shortCode}`);
      res.status(404).json({ error: 'Short URL not found' });
    }
  } catch (error) {
    console.error('Error in /:shortCode:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default app;
