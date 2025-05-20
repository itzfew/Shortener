// firebase.js
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get } from 'firebase/database';

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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, set, get };
