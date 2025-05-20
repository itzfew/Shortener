document.addEventListener('DOMContentLoaded', () => {
  const urlForm = document.getElementById('url-form');
  const urlInput = document.getElementById('url-input');
  const customCode = document.getElementById('custom-code');
  const resultDiv = document.getElementById('result');
  const loginLink = document.getElementById('login-link');
  const signupLink = document.getElementById('signup-link');
  const shortenBtn = document.getElementById('shorten-btn');

  // Check auth status
  async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch('/api/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const user = await response.json();
        loginLink.textContent = 'Dashboard';
        loginLink.href = '/dashboard.html';
        signupLink.style.display = 'none';
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  }

  // Handle form submission
  urlForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    resultDiv.innerHTML = '';
    shortenBtn.disabled = true;
    
    const url = urlInput.value.trim();
    const code = customCode.value.trim();
    
    if (!url || !url.startsWith('http')) {
      resultDiv.innerHTML = '<div class="error-message">Please enter a valid URL starting with http/https</div>';
      shortenBtn.disabled = false;
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers,
        body: JSON.stringify({ url, customCode: code })
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
    } finally {
      shortenBtn.disabled = false;
    }
  });

  checkAuth();
});
