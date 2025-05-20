import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, set } from "firebase/database";

const auth = getAuth();
const db = getDatabase();

document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  // extract values and create account
});
