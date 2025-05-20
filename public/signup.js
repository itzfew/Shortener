import { auth, db, ref, set, createUserWithEmailAndPassword } from '../firebase.js';

const signupForm = document.getElementById('signup-form');
const errorDiv = document.getElementById('error');

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;
  const pincode = document.getElementById('pincode').value;
  const password = document.getElementById('password').value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await set(ref(db, `users/${user.uid}`), {
      name,
      email,
      phone,
      pincode,
      createdAt: Date.now(),
    });
    window.location.href = '/';
  } catch (error) {
    console.error('Signup error:', error);
    errorDiv.textContent = error.message;
  }
});
