const totalSteps = 4;
let countdown = 10;
let countdownInterval;
let blogPostIds = [];
const urlParams = new URLSearchParams(window.location.search);
const shortCode = urlParams.get('shortCode');

export async function fetchBlogPostIds() {
  try {
    const response = await fetch('/api/blog-posts/ids');
    blogPostIds = response.ok ? await response.json() : [];
    return blogPostIds;
  } catch (error) {
    console.error('Fetch blog post IDs error:', error);
    return [];
  }
}

function getCurrentStep() {
  const step = sessionStorage.getItem(`step_${shortCode}`);
  return step ? parseInt(step, 10) : 1;
}

function setCurrentStep(step) {
  sessionStorage.setItem(`step_${shortCode}`, step);
}

async function goToNextPost() {
  if (blogPostIds.length === 0) return;
  const currentPostId = window.location.pathname.split('/posts/')[1]?.replace('.html', '');
  const availablePostIds = blogPostIds.filter(id => id !== currentPostId);
  if (availablePostIds.length === 0) return;
  const nextPostId = availablePostIds[Math.floor(Math.random() * availablePostIds.length)];
  const nextStep = getCurrentStep() + 1;
  setCurrentStep(nextStep);
  window.location.href = `/posts/${nextPostId}.html?shortCode=${shortCode}`;
}

function startCountdown() {
  countdown = 10;
  const countdownEl = document.getElementById('countdown');
  const continueBtn = document.getElementById('continue-btn');
  const getLinkBtn = document.getElementById('get-link-btn');
  const infoText = document.getElementById('info-text');
  const currentStep = getCurrentStep();

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

function injectInterstitialElements() {
  const container = document.querySelector('.interstitial-container');
  if (!container) return;

  const currentStep = getCurrentStep();

  // Inject header
  const header = document.createElement('header');
  header.innerHTML = `
    <h1>URL Shortener</h1>
    <div class="progress-steps">
      Step <span id="current-step">${currentStep}</span> of <span id="total-steps">${totalSteps}</span>
    </div>
  `;
  container.prepend(header);

  // Inject info text
  const infoText = document.createElement('div');
  infoText.id = 'info-text';
  infoText.textContent = `Step ${currentStep} of ${totalSteps}`;
  container.appendChild(infoText);

  // Inject countdown
  const countdownContainer = document.createElement('div');
  countdownContainer.className = 'countdown-container';
  countdownContainer.innerHTML = `
    <p>Your link will be available in <span id="countdown">10</span> seconds</p>
  `;
  container.appendChild(countdownContainer);

  // Inject buttons and ad placeholder
  const footer = document.createElement('footer');
  footer.innerHTML = `
    <button id="continue-btn" class="btn primary">Continue</button>
    <button id="get-link-btn" class="btn primary" style="display: none;">Get Link</button>
    <div class="ad-placeholder" style="display: none;">[Ad Placeholder]</div>
  `;
  container.appendChild(footer);

  // Initialize button event listeners
  const continueBtn = document.getElementById('continue-btn');
  const getLinkBtn = document.getElementById('get-link-btn');

  if (continueBtn) {
    continueBtn.addEventListener('click', async () => {
      if (currentStep < totalSteps) {
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
          const blogPostEl = document.querySelector('.blog-post');
          if (blogPostEl) {
            blogPostEl.innerHTML = `
              <h2>Error</h2>
              <p>${data.error || "Failed to resolve URL"}</p>
            `;
          }
        }
      } catch {
        const blogPostEl = document.querySelector('.blog-post');
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
    const blogPostEl = document.querySelector('.blog-post');
    if (blogPostEl) {
      blogPostEl.innerHTML = `
        <h2>Error</h2>
        <p>Invalid URL</p>
      `;
    }
    return;
  }

  await fetchBlogPostIds();
  if (blogPostIds.length === 0) {
    const blogPostEl = document.querySelector('.blog-post');
    if (blogPostEl) {
      blogPostEl.innerHTML = `
        <h2>Error</h2>
        <p>No blog posts available</p>
      `;
    }
    return;
  }

  injectInterstitialElements();
  startCountdown();
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('/posts/')) {
    init();
  }
});
