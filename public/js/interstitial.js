// public/js/interstitial.js
const totalSteps = 4;
let countdown = 10;
let countdownInterval;
const urlParams = new URLSearchParams(window.location.search);
const shortCode = urlParams.get('shortCode');

async function fetchBlogPostIds() {
  try {
    const response = await fetch('/api/blog-posts/ids', {
      headers: { 'X-User-Id': localStorage.getItem('userId') || 'anonymous' }
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Fetch blog post IDs error:', error.message);
    return [];
  }
}

async function goToNextPost(currentStep) {
  const blogPostIds = await fetchBlogPostIds();
  if (blogPostIds.length === 0) {
    document.querySelector('.blog-post').innerHTML = `
      <h2>Error</h2>
      <p>No blog posts available</p>
    `;
    return;
  }

  const currentPostId = window.location.pathname.split('/posts/')[1]?.replace('.html', '');
  const availablePostIds = blogPostIds.filter(id => id !== currentPostId);
  if (availablePostIds.length === 0) return;

  const nextPostId = availablePostIds[Math.floor(Math.random() * availablePostIds.length)];
  const nextStep = currentStep + 1;

  try {
    const response = await fetch('/api/update-step', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-User-Id': localStorage.getItem('userId') || 'anonymous'
      },
      body: JSON.stringify({ shortCode, step: nextStep })
    });
    if (!response.ok) throw new Error('Failed to update step');
    window.location.href = `/posts/${nextPostId}?shortCode=${shortCode}`;
  } catch (error) {
    console.error('Step update error:', error.message);
    document.querySelector('.blog-post').innerHTML = `
      <h2>Error</h2>
      <p>Could not connect to server</p>
    `;
  }
}

function startCountdown(currentStep) {
  countdown = 10;
  const countdownEl = document.getElementById('countdown');
  const continueBtn = document.getElementById('continue-btn');
  const getLinkBtn = document.getElementById('get-link-btn');
  const infoText = document.getElementById('info-text');

  if (countdownEl) countdownEl.textContent = countdown;
  if (continueBtn) continueBtn.style.display = 'none';
  if (getLinkBtn) getLinkBtn.style.display = 'none';
  if (infoText) infoText.textContent = `Step ${currentStep} of ${totalSteps}`;

  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    countdown--;
    if (countdownEl) countdownEl.textContent = countdown;

    if (countdown <= 0) {
      clearInterval(countdownInterval);
      if (infoText) infoText.textContent = "Refer to the bottom to continue.";
      if (currentStep === totalSteps) {
        if (getLinkBtn) getLinkBtn.style.display = 'block';
      } else {
        if (continueBtn) continueBtn.style.display = 'inline-block';
      }
    }
  }, 1000);
}

async function init() {
  if (!shortCode) {
    document.querySelector('.blog-post').innerHTML = `
      <h2>Error</h2>
      <p>Invalid URL</p>
    `;
    return;
  }

  const currentStep = parseInt(document.getElementById('current-step').textContent, 10);
  startCountdown(currentStep);

  const continueBtn = document.getElementById('continue-btn');
  const getLinkBtn = document.getElementById('get-link-btn');

  if (continueBtn) {
    continueBtn.addEventListener('click', async () => {
      if (currentStep < totalSteps) {
        await goToNextPost(currentStep);
      }
    });
  }

  if (getLinkBtn) {
    getLinkBtn.addEventListener('click', async () => {
      try {
        const response = await fetch(`/api/resolve/${shortCode}`, {
          headers: { 'X-User-Id': localStorage.getItem('userId') || 'anonymous' }
        });
        const data = await response.json();
        if (response.ok) {
          window.location.href = data.originalUrl;
        } else {
          document.querySelector('.blog-post').innerHTML = `
            <h2>Error</h2>
            <p>${data.error || "Failed to resolve URL"}</p>
          `;
        }
      } catch (error) {
        console.error('Resolve error:', error.message);
        document.querySelector('.blog-post').innerHTML = `
          <h2>Error</h2>
          <p>Could not connect to server</p>
        `;
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', init);
