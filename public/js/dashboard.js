document.addEventListener('DOMContentLoaded', () => {
  const userName = document.getElementById('user-name');
  const userEmail = document.getElementById('user-email');
  const userPhone = document.getElementById('user-phone');
  const userPincode = document.getElementById('user-pincode');
  const urlTableBody = document.getElementById('url-table-body');
  const urlMessage = document.getElementById('url-message');
  const logoutBtn = document.getElementById('logout-btn');

  // Function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  // Fetch user data and URLs
  async function loadDashboard() {
    try {
      const response = await fetch('/api/me', {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          urlMessage.innerHTML = '<div class="error-message">Session expired. Please login again.</div>';
          localStorage.removeItem('token');
          setTimeout(() => (window.location.href = '/auth/login.html'), 2000);
          return;
        }
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      const { user, urls } = data;

      // Populate user info
      userName.textContent = user.name || 'User';
      userEmail.textContent = user.email || 'N/A';
      userPhone.textContent = user.phone || 'N/A';
      userPincode.textContent = user.pincode || 'N/A';

      // Populate URL table
      if (urls && urls.length > 0) {
        urlTableBody.innerHTML = urls
          .map((url) => {
            const createdAt = url.createdAt ? new Date(url.createdAt).toLocaleString() : 'N/A';
            const lastAccessed = url.lastAccessed ? new Date(url.lastAccessed).toLocaleString() : 'Never';
            return `
              <tr>
                <td><a href="${window.location.origin}/${url.shortCode}" target="_blank">${window.location.origin}/${url.shortCode}</a></td>
                <td><a href="${url.originalUrl}" target="_blank">${url.originalUrl}</a></td>
                <td>${url.clicks || 0}</td>
                <td>${createdAt}</td>
                <td>${lastAccessed}</td>
              </tr>
            `;
          })
          .join('');
      } else {
        urlTableBody.innerHTML = '<tr><td colspan="5" class="no-data">No URLs created yet</td></tr>';
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
      urlMessage.innerHTML = '<div class="error-message">Could not load dashboard data</div>';
    }
  }

  // Handle logout
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/auth/login.html';
  });

  // Load dashboard data on page load
  loadDashboard();
});
