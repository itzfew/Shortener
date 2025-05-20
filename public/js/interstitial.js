let currentStep = 1;
const totalSteps = 4;
let countdown = 10;
let countdownInterval;
let blogPostIds = [];
const shortCode = window.location.pathname.substring(1);

// DOM elements
const currentStepEl = document.getElementById('current-step');
const totalStepsEl = document.getElementById('total-steps');
const blogPostEl = document.getElementById('blog-post');
const countdownEl = document.getElementById('countdown');
const continueBtn = document.getElementById('continue-btn');
const getLinkBtn = document.getElementById('get-link-btn');
const infoText = document.getElementById('info-text');

async function fetchBlogPostIds() {
  try {
    const response = await fetch('/api/blog-posts/ids');
    blogPostIds = response.ok ? await response.json() : [];
  } catch {
    blogPostIds = [];
  }
  if (blogPostIds.length === 0) {
    blogPostEl.innerHTML = `
      <h2>Error</h2>
      <p>No blog posts available.</p>
    `;
    return;
  }
  await updateBlogPost();
}

async function updateBlogPost() {
  if (blogPostIds.length === 0) return;
  const postId = blogPostIds[Math.floor(Math.random() * blogPostIds.length)];
  try {
    const response = await fetch(`/posts/${postId}.html`);
    if (response.ok) {
      const content = await response.text();
      blogPostEl.innerHTML = content;
    } else {
      blogPostEl.innerHTML = `
        <h2>Error</h2>
        <p>Failed to load blog post.</p>
      `;
    }
  } catch {
    blogPostEl.innerHTML = `
      <h2>Error</h2>
      <p>Could not connect to server.</p>
    `;
  }
  currentStepEl.textContent = currentStep;
  totalStepsEl.textContent = totalSteps;
  infoText.textContent = `${totalSteps - currentStep} steps left out of ${totalSteps}`;
}

function startCountdown() {
  countdown = 10;
  countdownEl.textContent = countdown;
  continueBtn.style.display = 'none';
  getLinkBtn.style.display = 'none';
  infoText.textContent = `Step ${currentStep} of ${totalSteps}`;

  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    countdown--;
    countdownEl.textContent = countdown;

    if (countdown <= 0) {
      clearInterval(countdownInterval);
      infoText.textContent = "Refer to the bottom to continue.";
      if (currentStep === totalSteps) {
        getLinkBtn.style.display = 'block';
      } else {
        continueBtn.style.display = 'inline-block';
      }
    }
  }, 1000);
}

continueBtn.addEventListener('click', async () => {
  if (currentStep < totalSteps) {
    currentStep++;
    await updateBlogPost();
    startCountdown();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

getLinkBtn.addEventListener('click', async () => {
  try {
    const response = await fetch(`/api/resolve/${shortCode}`);
    const data = await response.json();
    if (response.ok) {
      window.location.href = data.originalUrl;
    } else {
      blogPostEl.innerHTML = `
        <h2>Error</h2>
        <p>${data.error || "Failed to resolve URL"}</p>
      `;
    }
  } catch {
    blogPostEl.innerHTML = `
      <h2>Error</h2>
      <p>Could not connect to server</p>
    `;
  }
});

function init() {
  continueBtn.style.display = 'none';
  getLinkBtn.style.display = 'none';
  fetchBlogPostIds();
  startCountdown();
}

document.addEventListener('DOMContentLoaded', init);
