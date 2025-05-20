// public/js/script.js
document.addEventListener('DOMContentLoaded', () => {
  const urlForm = document.getElementById('url-form');
  const urlInput = document.getElementById('url-input');
  const resultDiv = document.getElementById('result');
  
  urlForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    resultDiv.innerHTML = '';
    
    const url = urlInput.value.trim();
    if (!url || !url.startsWith('http')) {
      resultDiv.innerHTML = '<div class="error-message">Please enter a valid URL starting with http/https</div>';
      return;
    }
    
    try {
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ url })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        resultDiv.innerHTML = `
          <div class="success-message">
            Shortened URL: <a href="${data.shortUrl}" target="_blank">${data.shortUrl}</a>
          </div>
        `;
      } else {
        resultDiv.innerHTML = `<div class="error-message">${data.error || 'Error shortening URL'}</div>`;
      }
    } catch (error) {
      resultDiv.innerHTML = '<div class="error-message">Could not connect to server</div>';
    }
  });
  
  // Check auth status and update UI
  async function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const loginLink = document.getElementById('login-link');
    const signupLink = document.getElementById('signup-link');
    
    if (token) {
      try {
        const response = await fetch('/api/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          // User is authenticated
          loginLink.textContent = 'Dashboard';
          loginLink.href = '/dashboard.html';
          signupLink.style.display = 'none';
        } else {
          // Token is invalid
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    }
  }
  
  checkAuthStatus();
});
