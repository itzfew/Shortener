import { auth, sendPasswordResetEmail } from '../firebase.js';

const resetForm = document.getElementById('reset-form');
const messageDiv = document.getElementById('message');

resetForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;

  try {
    await sendPasswordResetEmail(auth, email);
    messageDiv.textContent = 'Password reset email sent! Check your inbox.';
  } catch (error) {
    console.error('Reset password error:', error);
    messageDiv.textContent = error.message;
    messageDiv.classList.add('error');
  }
});
