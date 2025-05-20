// public/js/interstitial.js
let currentStep = 1;
const totalSteps = 4;
let countdown = 10;
let countdownInterval;
let blogPosts = [];
const shortCode = window.location.pathname.substring(1);

// DOM elements
const currentStepEl = document.getElementById('current-step');
const totalStepsEl = document.getElementById('total-steps');
const stepsRemainingEl = document.getElementById('steps-remaining');
const postTitleEl = document.getElementById('post-title');
const postContentEl = document.getElementById('post-content');
const countdownEl = document.getElementById('countdown');
const countdownContainer = document.getElementById('countdown-container');
const nextBtn = document.getElementById('next-btn');
const continueBtn = document.getElementById('continue-btn');
const getLinkBtn = document.getElementById('get-link-btn');

// Curated blog posts
const defaultPosts = [
  {
    title: "AI Revolution in 2025",
    content: "Artificial Intelligence is reshaping industries in 2025. From advanced language models to autonomous vehicles, discover how AI is driving innovation and transforming our daily lives."
  },
  {
    title: "Top 10 Dream Destinations",
    content: "Explore breathtaking destinations for 2025! From the serene beaches of Bali to the majestic fjords of Norway, plan your next adventure with our curated list of must-visit places."
  },
  {
    title: "Master Your Productivity",
    content: "Boost your efficiency with proven techniques. Learn about time-blocking, the Pomodoro technique, and smart tools to maximize your productivity in work and life."
  },
  {
    title: "Global Tech Innovations",
    content: "Stay ahead with the latest tech breakthroughs. From quantum computing to sustainable energy solutions, explore innovations shaping a better future."
  }
];

// Fetch blog posts
async function fetchBlogPosts() {
  try {
    const response = await fetch('/api/blog-posts');
    if (response.ok) {
      blogPosts = await response.json();
      if (blogPosts.length === 0) {
        blogPosts = defaultPosts;
      }
      updateBlogPost();
    }
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    blogPosts = defaultPosts;
    updateBlogPost();
    postTitleEl.textContent = "Error";
    postContentEl.textContent = "Could not load blog posts. Please wait for your link.";
  }
}

// Update blog post content
function updateBlogPost() {
  if (blogPosts.length === 0) return;

  const postIndex = Math.floor(Math.random() * blogPosts.length); // Random post
  const post = blogPosts[postIndex];

  postTitleEl.textContent = post.title;
  postContentEl.textContent = post.content;
  currentStepEl.textContent = currentStep;
  totalStepsEl.textContent = totalSteps;
  stepsRemainingEl.textContent = `${totalSteps - currentStep} steps remaining`;
}

// Start countdown
function startCountdown() {
  countdown = 10;
  countdownEl.textContent = countdown;
  countdownContainer.classList.remove('hidden');
  continueBtn.classList.add('hidden');

  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    countdown--;
    countdownEl.textContent = countdown;

    if (countdown <= 0) {
      clearInterval(countdownInterval);
      if (currentStep < totalSteps) {
        nextBtn.textContent = "Next";
        continueBtn.classList.remove('hidden');
        continueBtn.textContent = "Please click to continue";
      } else {
        nextBtn.textContent = "Scroll down to continue";
        getLinkBtn.classList.remove('hidden');
        continueBtn.classList.add('hidden');
      }
    }
  }, 1000);
}

// Handle next button click
nextBtn.addEventListener('click', () => {
  if (currentStep < totalSteps) {
    currentStep++;
    updateBlogPost();
    startCountdown();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

// Handle continue button click
continueBtn.addEventListener('click', () => {
  if (currentStep < totalSteps) {
    currentStep++;
    updateBlogPost();
    startCountdown();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

// Handle get link button click
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
  } catch (error) {
    postTitleEl.textContent = "Error";
    postContentEl.textContent = "Could not connect to server";
  }
});

// Initialize
function init() {
  fetchBlogPosts();
  countdownContainer.classList.add('hidden');
  continueBtn.classList.add('hidden');
  if (currentStep === totalSteps) {
    getLinkBtn.classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', init);
