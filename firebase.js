// firebase.js
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get } from 'firebase/database';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDKvGPZZvjnAaEpRPOTSY0rLLaLG74rdA8",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "kashurpedia.firebaseapp.com",
  databaseURL: process.env.FIREBASE_DATABASE_URL || "https://kashurpedia-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: process.env.FIREBASE_PROJECT_ID || "kashurpedia",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "kashurpedia.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "27142359347",
  appId: process.env.FIREBASE_APP_ID || "1:27142359347:web:67ed5904cca6f570db1646",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-HGL5ZSK9MQ"
};

try {
  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);
  const auth = getAuth(app);
  console.log('Firebase initialized successfully');

  // Initialize sample blog posts if not already present
  async function initializeBlogPosts() {
    const postsRef = ref(db, 'blogPosts');
    const snapshot = await get(postsRef);
    if (!snapshot.exists()) {
      const samplePosts = [
        {
          title: "The Future of AI in 2025",
          content: "Artificial Intelligence is revolutionizing industries, from healthcare to finance. Explore the latest trends and predictions for AI in 2025.",
          author: "Tech Guru",
          date: "2025-05-15"
        },
        {
          title: "Top 10 Travel Destinations for 2025",
          content: "Plan your next adventure with our list of must-visit destinations, from tropical beaches to vibrant cities.",
          author: "Wanderlust",
          date: "2025-05-10"
        },
        {
          title: "Boost Your Productivity",
          content: "Learn practical tips to stay focused and achieve your goals with these productivity hacks.",
          author: "Life Coach",
          date: "2025-05-05"
        },
        {
          title: "Sustainable Living Tips",
          content: "Discover how small changes in your daily life can make a big impact on the environment.",
          author: "Green Advocate",
          date: "2025-04-30"
        }
      ];
      await set(postsRef, samplePosts);
      console.log('Sample blog posts initialized');
    }
  }
  initializeBlogPosts();

  export { db, auth, ref, set, get, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail };
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}
