// public/js/script.js
document.addEventListener('DOMContentLoaded', () => {
  const urlForm = document.getElementById('url-form');
  const urlInput = document.getElementById('url-input');
  const resultDiv = document.getElementById('result');
  
  // Function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  urlForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    resultDiv.innerHTML = '';
    
    const url = urlInput.value.trim();
    if (!url || !url.startsWith('http')) {
      resultDiv.innerHTML = '<div class="error-message">Please enter a valid URL starting with http/https</div>';
      return;
    }
    
    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ url })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        resultDiv.innerHTML = `
          <div class="success-message">
            Shortened URL: <a href="${data.shortUrl}" target="_blank">${data.shortUrl}</a>
          </div>
        `;
      } else if (response.status === 401) {
        // Handle unauthorized error
        resultDiv.innerHTML = '<div class="error-message">Session expired. Please login again.</div>';
        localStorage.removeItem('token');
        setTimeout(() => window.location.href = '/auth/login.html', 2000);
      } else {
        resultDiv.innerHTML = `<div class="error-message">${data.error || 'Error shortening URL'}</div>`;
      }
    } catch (error) {
      resultDiv.innerHTML = '<div class="error-message">Could not connect to server</div>';
    }
  });

  // Check auth status on page load
  async function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const loginLink = document.getElementById('login-link');
    const signupLink = document.getElementById('signup-link');
    
    if (token) {
      try {
        const response = await fetch('/api/me', {
          headers: getAuthHeaders()
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
