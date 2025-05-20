import { auth, onAuthStateChanged } from '../firebase.js';

const urlForm = document.getElementById('url-form');
const resultDiv = document.getElementById('result');

onAuthStateChanged(auth, (user) => {
  if (user) {
    urlForm.style.display = 'flex';
  } else {
    urlForm.style.display = 'none';
    resultDiv.innerHTML = 'Please <a href="/login.html">log in</a> to shorten URLs.';
  }
});

urlForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const urlInput = document.getElementById('url-input').value;
  resultDiv.innerHTML = '';

  try {
    const idToken = await auth.currentUser.getIdToken();
    const response = await fetch('/api/shorten', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({ url: urlInput }),
    });
    const data = await response.json();

    if (response.ok) {
      resultDiv.innerHTML = `Shortened URL: <a href="${data.shortUrl}" target="_blank">${data.shortUrl}</a>`;
    } else {
      resultDiv.innerHTML = `Error: ${data.error || 'Failed to shorten URL'}`;
    }
  } catch (error) {
    console.error('Error in shorten request:', error);
    resultDiv.innerHTML = 'Error: Could not connect to server';
  }
});
