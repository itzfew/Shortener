import express from 'express';
import { db, ref, set, get, update } from '../firebase.js';
import { customAlphabet } from 'nanoid';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import ejs from 'ejs';
import expressLayouts from 'express-ejs-layouts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../public/views'));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  next();
});

const JWT_SECRET = 'your-secret-key'; // Hardcoded as per request
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);

// Authentication Middleware
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
    
    req.user = { ...snapshot.val(), uid: decoded.uid };
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
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
      user: { uid: newUserId, name, email, phone, pincode }
    });
  } catch (error) {
    console.error('Signup error:', error.message);
    res.status(500).json({ error: 'Could not connect to server' });
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
    
    res.json({ token, user: userResponse });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Could not connect to server' });
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
    const resetToken = jwt.sign({ uid, action: 'reset' }, JWT_SECRET, { expiresIn: '15m' });
    
    res.json({ 
      message: 'If an account exists with this email, a reset link has been sent',
      resetToken 
    });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    res.status(500).json({ error: 'Could not connect to server' });
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
    console.error('Reset password error:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Reset token has expired' });
    }
    res.status(500).json({ error: 'Could not connect to server' });
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
    
    // Initialize step tracking
    await set(ref(db, `userSteps/${req.user.uid}_${shortCode}`), {
      step: 1,
      timestamp: Date.now()
    });
    
    res.json({ 
      shortUrl,
      shortCode,
      originalUrl: url
    });
  } catch (error) {
    console.error('Shorten error:', error.message);
    res.status(500).json({ error: 'Could not connect to server' });
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
    console.error('Resolve error:', error.message);
    res.status(500).json({ error: 'Could not connect to server' });
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
    
    res.json({ user: userData, urls: userUrls });
  } catch (error) {
    console.error('User profile error:', error.message);
    res.status(500).json({ error: 'Could not connect to server' });
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
    console.error('Stats error:', error.message);
    res.status(500).json({ error: 'Could not connect to server' });
  }
});

// Get Blog Post IDs
app.get('/api/blog-posts/ids', async (req, res) => {
  try {
    const postsRef = ref(db, 'blogPosts');
    const snapshot = await get(postsRef);
    const posts = snapshot.val() || {};
    const postIds = Object.keys(posts);
    res.json(postIds);
  } catch (error) {
    console.error('Blog post IDs error:', error.message);
    res.status(500).json({ error: 'Could not connect to server' });
  }
});

// Get Blog Post
app.get('/api/blog-posts/:postId', async (req, res) => {
  const { postId } = req.params;
  try {
    const postRef = ref(db, `blogPosts/${postId}`);
    const snapshot = await get(postRef);
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    res.json(snapshot.val());
  } catch (error) {
    console.error('Blog post error:', error.message);
    res.status(500).json({ error: 'Could not connect to server' });
  }
});

// Update User Step
app.post('/api/update-step', async (req, res) => {
  const { shortCode, step } = req.body;
  const userId = req.headers['x-user-id'] || 'anonymous';

  if (!shortCode || !step) {
    return res.status(400).json({ error: 'Short code and step are required' });
  }

  try {
    await set(ref(db, `userSteps/${userId}_${shortCode}`), {
      step,
      timestamp: Date.now()
    });
    res.json({ message: 'Step updated successfully' });
  } catch (error) {
    console.error('Step update error:', error.message);
    res.status(500).json({ error: 'Could not connect to server' });
  }
});

// Interstitial Page
app.get('/:shortCode', async (req, res) => {
  const { shortCode } = req.params;
  
  try {
    const snapshot = await get(ref(db, `urls/${shortCode}`));
    if (!snapshot.exists()) {
      console.log(`Short URL not found: ${shortCode}`);
      return res.render('404', { error: 'Short URL not found' });
    }
    
    const postsRef = ref(db, 'blogPosts');
    const postsSnapshot = await get(postsRef);
    const posts = postsSnapshot.val() || {};
    const postIds = Object.keys(posts);
    
    if (postIds.length === 0) {
      console.log('No blog posts found');
      return res.render('404', { error: 'No blog posts available' });
    }
    
    const userId = req.headers['x-user-id'] || 'anonymous';
    const stepRef = ref(db, `userSteps/${userId}_${shortCode}`);
    const stepSnapshot = await get(stepRef);
    const currentStep = stepSnapshot.exists() ? stepSnapshot.val().step : 1;
    
    const randomPostId = postIds[Math.floor(Math.random() * postIds.length)];
    const postRef = ref(db, `blogPosts/${randomPostId}`);
    const postSnapshot = await get(postRef);
    const postData = postSnapshot.val();
    
    res.render('interstitial', {
      shortCode,
      currentStep,
      totalSteps: 4,
      post: postData
    });
  } catch (error) {
    console.error('Interstitial error:', error.message);
    res.render('404', { error: 'Could not connect to server' });
  }
});

// Blog Post Page
app.get('/posts/:postId', async (req, res) => {
  const { postId } = req.params;
  const shortCode = req.query.shortCode;
  
  try {
    const postRef = ref(db, `blogPosts/${postId}`);
    const postSnapshot = await get(postRef);
    if (!postSnapshot.exists()) {
      return res.render('404', { error: 'Blog post not found' });
    }
    
    const userId = req.headers['x-user-id'] || 'anonymous';
    const stepRef = ref(db, `userSteps/${userId}_${shortCode}`);
    const stepSnapshot = await get(stepRef);
    const currentStep = stepSnapshot.exists() ? stepSnapshot.val().step : 1;
    
    res.render('post', {
      shortCode,
      currentStep,
      totalSteps: 4,
      post: postSnapshot.val()
    });
  } catch (error) {
    console.error('Blog post page error:', error.message);
    res.render('404', { error: 'Could not connect to server' });
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default app;
