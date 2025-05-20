import express from 'express';
import { db, ref, set, get, update } from '../firebase.js';
import { customAlphabet } from 'nanoid';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);

// Authentication middleware
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userRef = ref(db, `users/${decoded.uid}`);
    const snapshot = await get(userRef);
    if (!snapshot.exists()) return res.status(401).json({ error: 'User not found' });
    req.user = snapshot.val();
    req.user.uid = decoded.uid;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// User registration
app.post('/api/signup', async (req, res) => {
  const { name, email, phone, pincode, password } = req.body;
  
  try {
    // Check if user exists
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    const users = snapshot.val() || {};
    const userExists = Object.values(users).some(u => u.email === email);
    
    if (userExists) return res.status(400).json({ error: 'User already exists' });
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserRef = ref(db, 'users/' + nanoid());
    
    await set(newUserRef, {
      name,
      email,
      phone,
      pincode,
      password: hashedPassword,
      createdAt: Date.now()
    });
    
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    const users = snapshot.val() || {};
    
    const user = Object.entries(users).find(([_, u]) => u.email === email);
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    
    const [uid, userData] = user;
    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ uid }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { ...userData, uid } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Password reset request
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  try {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    const users = snapshot.val() || {};
    
    const user = Object.entries(users).find(([_, u]) => u.email === email);
    if (!user) return res.status(400).json({ error: 'User not found' });
    
    const [uid] = user;
    const resetToken = jwt.sign({ uid, action: 'reset' }, JWT_SECRET, { expiresIn: '15m' });
    
    // In a real app, you would send this token via email
    res.json({ resetToken });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset password
app.post('/api/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.action !== 'reset') return res.status(400).json({ error: 'Invalid token' });
    
    const userRef = ref(db, `users/${decoded.uid}`);
    const snapshot = await get(userRef);
    if (!snapshot.exists()) return res.status(400).json({ error: 'User not found' });
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await update(userRef, { password: hashedPassword });
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Shorten URL (authenticated)
app.post('/api/shorten', authenticate, async (req, res) => {
  const { url, customCode } = req.body;
  
  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: 'Invalid URL' });
  }
  
  try {
    const shortCode = customCode || nanoid();
    const shortUrl = `${req.headers.origin}/${shortCode}`;
    
    // Check if code exists
    const existingRef = ref(db, `urls/${shortCode}`);
    const existingSnapshot = await get(existingRef);
    if (existingSnapshot.exists()) {
      return res.status(400).json({ error: 'Custom code already in use' });
    }
    
    await set(existingRef, { 
      originalUrl: url, 
      createdAt: Date.now(),
      createdBy: req.user.uid,
      clicks: 0
    });
    
    res.json({ shortUrl });
  } catch (error) {
    console.error('Shorten error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Resolve URL
app.get('/api/resolve/:shortCode', async (req, res) => {
  const { shortCode } = req.params;
  
  try {
    const snapshot = await get(ref(db, `urls/${shortCode}`));
    if (snapshot.exists()) {
      const urlData = snapshot.val();
      // Increment click count
      await update(ref(db, `urls/${shortCode}`), { clicks: (urlData.clicks || 0) + 1 });
      res.json({ originalUrl: urlData.originalUrl });
    } else {
      res.status(404).json({ error: 'Short URL not found' });
    }
  } catch (error) {
    console.error('Resolve error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get URL stats (authenticated)
app.get('/api/stats/:shortCode', authenticate, async (req, res) => {
  const { shortCode } = req.params;
  
  try {
    const snapshot = await get(ref(db, `urls/${shortCode}`));
    if (!snapshot.exists()) return res.status(404).json({ error: 'URL not found' });
    
    const urlData = snapshot.val();
    if (urlData.createdBy !== req.user.uid) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    res.json({
      originalUrl: urlData.originalUrl,
      shortCode,
      createdAt: urlData.createdAt,
      clicks: urlData.clicks || 0
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get blog posts
app.get('/api/blog-posts', async (req, res) => {
  try {
    const snapshot = await get(ref(db, 'blogPosts'));
    const posts = snapshot.val() || [];
    res.json(posts);
  } catch (error) {
    console.error('Blog posts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve interstitial page
app.get('/:shortCode', async (req, res) => {
  const { shortCode } = req.params;
  
  try {
    const snapshot = await get(ref(db, `urls/${shortCode}`));
    if (snapshot.exists()) {
      res.sendFile(path.join(__dirname, '../public/interstitial.html'));
    } else {
      res.status(404).sendFile(path.join(__dirname, '../public/404.html'));
    }
  } catch (error) {
    console.error('Interstitial error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default app;
