// Handle login form
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const messageDiv = document.getElementById('login-message');
  
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      localStorage.setItem('token', data.token);
      messageDiv.innerHTML = '<div class="success-message">Login successful! Redirecting...</div>';
      setTimeout(() => window.location.href = '/', 1500);
    } else {
      messageDiv.innerHTML = `<div class="error-message">${data.error || 'Login failed'}</div>`;
    }
  } catch (error) {
    messageDiv.innerHTML = '<div class="error-message">Could not connect to server</div>';
  }
});

// Handle signup form
document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;
  const pincode = document.getElementById('pincode').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  const messageDiv = document.getElementById('signup-message');
  
  if (password !== confirmPassword) {
    messageDiv.innerHTML = '<div class="error-message">Passwords do not match</div>';
    return;
  }
  
  try {
    const response = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, pincode, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      messageDiv.innerHTML = '<div class="success-message">Account created successfully! Redirecting to login...</div>';
      setTimeout(() => window.location.href = '/auth/login.html', 2000);
    } else {
      messageDiv.innerHTML = `<div class="error-message">${data.error || 'Signup failed'}</div>`;
    }
  } catch (error) {
    messageDiv.innerHTML = '<div class="error-message">Could not connect to server</div>';
  }
});

// Handle forgot password form
document.getElementById('forgot-password-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const messageDiv = document.getElementById('forgot-message');
  
  try {
    const response = await fetch('/api/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      document.getElementById('forgot-password-form').style.display = 'none';
      document.getElementById('reset-form-container').style.display = 'block';
      document.getElementById('reset-token').value = data.resetToken;
      messageDiv.innerHTML = '<div class="success-message">Please check your email for reset instructions</div>';
    } else {
      messageDiv.innerHTML = `<div class="error-message">${data.error || 'Password reset failed'}</div>`;
    }
  } catch (error) {
    messageDiv.innerHTML = '<div class="error-message">Could not connect to server</div>';
  }
});

// Handle reset password form
document.getElementById('reset-password-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const token = document.getElementById('reset-token').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmNewPassword = document.getElementById('confirm-new-password').value;
  const messageDiv = document.getElementById('reset-message');
  
  if (newPassword !== confirmNewPassword) {
    messageDiv.innerHTML = '<div class="error-message">Passwords do not match</div>';
    return;
  }
  
  try {
    const response = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      messageDiv.innerHTML = '<div class="success-message">Password updated successfully! Redirecting to login...</div>';
      setTimeout(() => window.location.href = '/auth/login.html', 2000);
    } else {
      messageDiv.innerHTML = `<div class="error-message">${data.error || 'Password reset failed'}</div>`;
    }
  } catch (error) {
    messageDiv.innerHTML = '<div class="error-message">Could not connect to server</div>';
  }
});
