// firebase.js
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, update, remove } from 'firebase/database';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDKvGPZZvjnAaEpRPOTSY0rLLaLG74rdA8",
  authDomain: "kashurpedia.firebaseapp.com",
  databaseURL: "https://kashurpedia-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kashurpedia",
  storageBucket: "kashurpedia.appspot.com",
  messagingSenderId: "27142359347",
  appId: "1:27142359347:web:67ed5904cca6f570db1646",
  measurementId: "G-HGL5ZSK9MQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const db = getDatabase(app);
const auth = getAuth(app);

// Database reference helper function
const dbRef = (path) => ref(db, path);

// Export Firebase services
export { 
  db, 
  auth,
  dbRef,
  ref, 
  set, 
  get, 
  update,
  remove,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
};
