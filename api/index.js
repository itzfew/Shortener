// api/index.js
import express from 'express';
import { db, auth, ref, set, get } from '../firebase.js';
import { customAlphabet } from 'nanoid';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Initialize Firebase Admin
initializeApp({
  credential: process.env.GOOGLE_APPLICATION_CREDENTIALS
    ? cert(JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS))
    : cert(require('../serviceAccount.json')),
});

// Middleware to verify Firebase ID token
async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

// Initialize nanoid for generating short codes
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);

// POST /api/shorten - Create a shortened URL (authenticated)
app.post('/api/shorten', verifyToken, async (req, res) => {
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
      userId: req.user.uid,
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

// GET /api/blog-posts/random - Fetch random blog post
app.get('/api/blog-posts/random', async (req, res) => {
  try {
    const snapshot = await get(ref(db, 'blogPosts'));
    if (snapshot.exists()) {
      const posts = snapshot.val();
      const randomPost = posts[Math.floor(Math.random() * posts.length)];
      res.json(randomPost);
    } else {
      res.status(404).json({ error: 'No blog posts found' });
    }
  } catch (error) {
    console.error('Error in /api/blog-posts/random:', error);
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
