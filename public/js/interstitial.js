let currentStep = 1;
const totalSteps = 4;
let countdown = 10;
let countdownInterval;
let blogPostIds = [];
const urlParams = new URLSearchParams(window.location.search);
const shortCode = urlParams.get('shortCode');

// DOM elements (will be in blog post pages)
let currentStepEl, totalStepsEl, countdownEl, continueBtn, getLinkBtn, infoText;

async function fetchBlogPostIds() {
  try {
    const response = await fetch('/api/blog-posts/ids');
    blogPostIds = response.ok ? await response.json() : [];
  } catch {
    blogPostIds = [];
  }
  if (blogPostIds.length === 0) {
    const blogPostEl = document.getElementById('blog-post');
    if (blogPostEl) {
      blogPostEl.innerHTML = `
        <h2>Error</h2>
        <p>No blog posts available.</p>
      `;
    }
  }
}

async function goToNextPost() {
  if (blogPostIds.length === 0) return;
  const currentPostId = window.location.pathname.split('/posts/')[1]?.replace('.html', '');
  const availablePostIds = blogPostIds.filter(id => id !== currentPostId);
  if (availablePostIds.length === 0) return;
  const nextPostId = availablePostIds[Math.floor(Math.random() * availablePostIds.length)];
  window.location.href = `/posts/${nextPostId}.html?shortCode=${shortCode}`;
}

function startCountdown() {
  countdown = 10;
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

function initializeElements() {
  currentStepEl = document.getElementById('current-step');
  totalStepsEl = document.getElementById('total-steps');
  countdownEl = document.getElementById('countdown');
  continueBtn = document.getElementById('continue-btn');
  getLinkBtn = document.getElementById('get-link-btn');
  infoText = document.getElementById('info-text');

  if (currentStepEl) currentStepEl.textContent = currentStep;
  if (totalStepsEl) totalStepsEl.textContent = totalSteps;

  if (continueBtn) {
    continueBtn.addEventListener('click', async () => {
      if (currentStep < totalSteps) {
        currentStep++;
        await goToNextPost();
      }
    });
  }

  if (getLinkBtn) {
    getLinkBtn.addEventListener('click', async () => {
      try {
        const response = await fetch(`/api/resolve/${shortCode}`);
        const data = await response.json();
        if (response.ok) {
          window.location.href = data.originalUrl;
        } else {
          const blogPostEl = document.getElementById('blog-post');
          if (blogPostEl) {
            blogPostEl.innerHTML = `
              <h2>Error</h2>
              <p>${data.error || "Failed to resolve URL"}</p>
            `;
          }
        }
      } catch {
        const blogPostEl = document.getElementById('blog-post');
        if (blogPostEl) {
          blogPostEl.innerHTML = `
            <h2>Error</h2>
            <p>Could not connect to server</p>
          `;
        }
      }
    });
  }
}

async function init() {
  if (!shortCode) {
    const blogPostEl = document.getElementById('blog-post');
    if (blogPostEl) {
      blogPostEl.innerHTML = `
        <h2>Error</h2>
        <p>Invalid URL</p>
      `;
    }
    return;
  }

  await fetchBlogPostIds();
  initializeElements();
  startCountdown();
}

document.addEventListener('DOMContentLoaded', init);
