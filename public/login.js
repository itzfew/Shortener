import { auth, signInWithEmailAndPassword } from '../firebase.js';

const loginForm = document.getElementById('login-form');
const errorDiv = document.getElementById('error');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = '/';
  } catch (error) {
    console.error('Login error:', error);
    errorDiv.textContent = error.message;
  }
});
