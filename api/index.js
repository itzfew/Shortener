import express from 'express';
import { db, ref, set, get, update } from '../firebase.js';
import { customAlphabet } from 'nanoid';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);

// Enhanced Authentication Middleware
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userRef = ref(db, `users/${decoded.uid}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      return res.status(401).json({ error: 'Unauthorized - User not found' });
    }
    
    req.user = {
      ...snapshot.val(),
      uid: decoded.uid
    };
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized - Token expired' });
    }
    res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
};

// User Registration
app.post('/api/signup', async (req, res) => {
  const { name, email, phone, pincode, password } = req.body;
  
  if (!name || !email || !phone || !pincode || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    const users = snapshot.val() || {};
    
    const userExists = Object.values(users).some(u => u.email === email);
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserId = nanoid();
    const newUserRef = ref(db, `users/${newUserId}`);
    
    await set(newUserRef, {
      name,
      email,
      phone,
      pincode,
      password: hashedPassword,
      createdAt: Date.now()
    });
    
    const token = jwt.sign({ uid: newUserId }, JWT_SECRET, { expiresIn: '24h' });
    
    res.status(201).json({ 
      message: 'User created successfully',
      token,
      user: {
        uid: newUserId,
        name,
        email,
        phone,
        pincode
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    const users = snapshot.val() || {};
    
    const userEntry = Object.entries(users).find(([_, u]) => u.email === email);
    if (!userEntry) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const [uid, userData] = userEntry;
    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ uid }, JWT_SECRET, { expiresIn: '24h' });
    
    const userResponse = { ...userData, uid };
    delete userResponse.password;
    
    res.json({ 
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Password Reset Request
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    const users = snapshot.val() || {};
    
    const user = Object.entries(users).find(([_, u]) => u.email === email);
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    
    const [uid] = user;
    const resetToken = jwt.sign({ 
      uid, 
      action: 'reset' 
    }, JWT_SECRET, { expiresIn: '15m' });
    
    res.json({ 
      message: 'If an account exists with this email, a reset link has been sent',
      resetToken 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Password Reset
app.post('/api/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Valid token and password (min 6 chars) are required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.action !== 'reset') {
      return res.status(400).json({ error: 'Invalid token' });
    }
    
    const userRef = ref(db, `users/${decoded.uid}`);
    const snapshot = await get(userRef);
    if (!snapshot.exists()) {
      return res.status(400).json({ error: 'User not found' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await update(userRef, { password: hashedPassword });
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Reset token has expired' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// URL Shortening
app.post('/api/shorten', authenticate, async (req, res) => {
  const { url, customCode } = req.body;
  
  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: 'Valid URL starting with http/https is required' });
  }

  try {
    const shortCode = customCode || nanoid();
    const shortUrl = `${req.headers.origin}/${shortCode}`;
    
    if (customCode) {
      const existingRef = ref(db, `urls/${customCode}`);
      const existingSnapshot = await get(existingRef);
      if (existingSnapshot.exists()) {
        return res.status(400).json({ error: 'Custom code already in use' });
      }
    }
    
    await set(ref(db, `urls/${shortCode}`), { 
      originalUrl: url, 
      createdAt: Date.now(),
      createdBy: req.user.uid,
      clicks: 0,
      lastAccessed: null
    });
    
    res.json({ 
      shortUrl,
      shortCode,
      originalUrl: url
    });
  } catch (error) {
    console.error('Shorten error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// URL Resolution
app.get('/api/resolve/:shortCode', async (req, res) => {
  const { shortCode } = req.params;
  
  try {
    const snapshot = await get(ref(db, `urls/${shortCode}`));
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Short URL not found' });
    }
    
    const urlData = snapshot.val();
    await update(ref(db, `urls/${shortCode}`), { 
      clicks: (urlData.clicks || 0) + 1,
      lastAccessed: Date.now()
    });
    
    res.json({ 
      originalUrl: urlData.originalUrl,
      createdAt: urlData.createdAt,
      clicks: (urlData.clicks || 0) + 1
    });
  } catch (error) {
    console.error('Resolve error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// User Profile
app.get('/api/me', authenticate, async (req, res) => {
  try {
    const urlsRef = ref(db, 'urls');
    const snapshot = await get(urlsRef);
    const allUrls = snapshot.val() || {};
    
    const userUrls = Object.entries(allUrls)
      .filter(([_, urlData]) => urlData.createdBy === req.user.uid)
      .map(([shortCode, urlData]) => ({
        shortCode,
        ...urlData
      }));
    
    const userData = { ...req.user };
    delete userData.password;
    
    res.json({
      user: userData,
      urls: userUrls
    });
  } catch (error) {
    console.error('User profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// URL Statistics
app.get('/api/stats/:shortCode', authenticate, async (req, res) => {
  const { shortCode } = req.params;
  
  try {
    const snapshot = await get(ref(db, `urls/${shortCode}`));
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'URL not found' });
    }
    
    const urlData = snapshot.val();
    if (urlData.createdBy !== req.user.uid) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    res.json({
      originalUrl: urlData.originalUrl,
      shortCode,
      createdAt: urlData.createdAt,
      lastAccessed: urlData.lastAccessed,
      clicks: urlData.clicks || 0
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Blog Post IDs
app.get('/api/blog-posts/ids', async (req, res) => {
  try {
    const postsDir = path.join(__dirname, '../public/posts');
    const files = await fs.readdir(postsDir);
    const postIds = files
      .filter(file => file.endsWith('.html'))
      .map(file => path.basename(file, '.html'));
    res.json(postIds);
  } catch (error) {
    console.error('Blog post IDs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Interstitial Page - Redirect to Blog Post
app.get('/:shortCode', async (req, res) => {
  const { shortCode } = req.params;
  
  try {
    const snapshot = await get(ref(db, `urls/${shortCode}`));
    if (!snapshot.exists()) {
      return res.status(404).sendFile(path.join(__dirname, '../public/404.html'));
    }
    
    // Get blog post IDs
    const postsDir = path.join(__dirname, '../public/posts');
    const files = await fs.readdir(postsDir);
    const postIds = files
      .filter(file => file.endsWith('.html'))
      .map(file => path.basename(file, '.html'));
    
    if (postIds.length === 0) {
      return res.status(404).sendFile(path.join(__dirname, '../public/404.html'));
    }
    
    // Select a random post
    const randomPostId = postIds[Math.floor(Math.random() * postIds.length)];
    
    // Redirect to the blog post page with shortCode as query parameter
    res.redirect(`/posts/${randomPostId}.html?shortCode=${shortCode}`);
  } catch (error) {
    console.error('Interstitial error:', error);
    res.status(500).sendFile(path.join(__dirname, '../public/404.html'));
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default app;
