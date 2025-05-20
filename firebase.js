// firebase.js
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get } from 'firebase/database';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDKvGPZZvjnAaEpRPOTSY0rLLaLG74rdA8",
  authDomain: "kashurpedia.firebaseapp.com",
  databaseURL: "https://kashurpedia-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kashurpedia",
  storageBucket: "kashurpedia.firebasestorage.app",
  messagingSenderId: "27142359347",
  appId: "1:27142359347:web:67ed5904cca6f570db1646",
  measurementId: "G-HGL5ZSK9MQ"
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
          content: "Artificial Intelligence is revolutionizing industries, from healthcare to finance. Explore the latest trends and predictions for AI in 2025, including advancements in machine learning and automation.",
          author: "Tech Guru",
          date: "2025-05-15"
        },
        {
          title: "Top 10 Travel Destinations for 2025",
          content: "Plan your next adventure with our list of must-visit destinations, from tropical beaches in Bali to vibrant cities like Tokyo. Discover unique experiences and travel tips.",
          author: "Wanderlust",
          date: "2025-05-10"
        },
        {
          title: "Boost Your Productivity",
          content: "Learn practical tips to stay focused and achieve your goals with these productivity hacks. From time management to minimizing distractions, take control of your day.",
          author: "Life Coach",
          date: "2025-05-05"
        },
        {
          title: "Sustainable Living Tips",
          content: "Discover how small changes in your daily life can make a big impact on the environment. Learn about eco-friendly practices and sustainable products.",
          author: "Green Advocate",
          date: "2025-04-30"
        },
        {
          title: "The Rise of Remote Work",
          content: "Remote work is reshaping the workplace. Explore tools, strategies, and tips for thriving in a remote environment in 2025.",
          author: "Work Expert",
          date: "2025-04-25"
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
