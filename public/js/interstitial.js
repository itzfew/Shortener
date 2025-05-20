let currentStep = 1;
const totalSteps = 4;
let countdown = 10;
let countdownInterval;
let blogPosts = [];
const shortCode = window.location.pathname.substring(1);

// DOM elements
const currentStepEl = document.getElementById('current-step');
const totalStepsEl = document.getElementById('total-steps');
const postTitleEl = document.getElementById('post-title');
const postContentEl = document.getElementById('post-content');
const countdownEl = document.getElementById('countdown');
const nextBtn = document.getElementById('next-btn');
const continueBtn = document.getElementById('continue-btn');
const getLinkBtn = document.getElementById('get-link-btn');
const infoText = document.getElementById('info-text');

// Sample blog posts
const defaultPosts = [
  { title: "AI in 2025", content: "Explore how artificial intelligence is reshaping the world—from automation to creativity." },
  { title: "Top Travel Escapes", content: "Unwind with the most stunning destinations to explore this year, handpicked for adventurers." },
  { title: "Hack Your Productivity", content: "Discover science-backed ways to stay focused and beat procrastination with ease." },
  { title: "Global Economy Watch", content: "A quick dive into current events impacting businesses and nations worldwide." },
  { title: "Digital Minimalism", content: "Reclaim your time by reducing digital noise—be intentional about tech usage." },
];

async function fetchBlogPosts() {
  try {
    const response = await fetch('/api/blog-posts');
    blogPosts = response.ok ? await response.json() : [];
  } catch {
    blogPosts = [];
  }
  if (blogPosts.length === 0) blogPosts = defaultPosts;
  updateBlogPost();
}

// Update blog post content
function updateBlogPost() {
  const post = blogPosts[Math.floor(Math.random() * blogPosts.length)];
  postTitleEl.textContent = post.title;
  postContentEl.textContent = post.content;
  currentStepEl.textContent = currentStep;
  totalStepsEl.textContent = totalSteps;
  infoText.textContent = `${totalSteps - currentStep} steps left out of ${totalSteps}`;
}

// Start countdown
function startCountdown() {
  countdown = 10;
  countdownEl.textContent = countdown;
  infoText.textContent = `Step ${currentStep} of ${totalSteps}`;

  nextBtn.style.display = 'none';
  continueBtn.style.display = 'none';
  clearInterval(countdownInterval);

  countdownInterval = setInterval(() => {
    countdown--;
    countdownEl.textContent = countdown;

    if (countdown <= 0) {
      clearInterval(countdownInterval);
      nextBtn.style.display = 'inline-block';
      infoText.textContent = "Refer to the bottom to continue.";
      if (currentStep === totalSteps) {
        continueBtn.style.display = 'none';
        getLinkBtn.style.display = 'block';
      } else {
        continueBtn.style.display = 'inline-block';
      }
    }
  }, 1000);
}

// Next button click
nextBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Continue button click
continueBtn.addEventListener('click', () => {
  if (currentStep < totalSteps) {
    currentStep++;
    updateBlogPost();
    startCountdown();
  }
});

// Get Link
getLinkBtn.addEventListener('click', async () => {
  try {
    const response = await fetch(`/api/resolve/${shortCode}`);
    const data = await response.json();
    if (response.ok) {
      window.location.href = data.originalUrl;
    } else {
      postTitleEl.textContent = "Error";
      postContentEl.textContent = data.error || "Failed to resolve URL";
    }
  } catch {
    postTitleEl.textContent = "Error";
    postContentEl.textContent = "Could not connect to server";
  }
});

// Init
function init() {
  nextBtn.style.display = 'none';
  continueBtn.style.display = 'none';
  getLinkBtn.style.display = 'none';
  fetchBlogPosts();
  startCountdown();
}

document.addEventListener('DOMContentLoaded', init);
