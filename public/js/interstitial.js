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

// Fetch blog posts
async function fetchBlogPosts() {
  try {
    const response = await fetch('/api/blog-posts');
    if (response.ok) {
      blogPosts = await response.json();
      if (blogPosts.length === 0) {
        blogPosts = [
          { title: "Tech Trends 2025", content: "Discover the latest tech trends in 2025! AI is transforming industries." },
          { title: "Travel Destinations", content: "Check out these amazing travel destinations for your next vacation." },
          { title: "Productivity Tips", content: "Learn how to boost your productivity with these simple tips." },
          { title: "World News", content: "Stay updated with the latest news and insights from around the world." }
        ];
      }
      updateBlogPost();
    }
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    postTitleEl.textContent = "Error";
    postContentEl.textContent = "Could not load blog posts. Please wait for your link.";
  }
}

// Update blog post content
function updateBlogPost() {
  if (blogPosts.length === 0) return;
  
  const postIndex = (currentStep - 1) % blogPosts.length;
  const post = blogPosts[postIndex];
  
  postTitleEl.textContent = post.title;
  postContentEl.textContent = post.content;
  currentStepEl.textContent = currentStep;
  totalStepsEl.textContent = totalSteps;
}

// Start countdown
function startCountdown() {
  countdown = 10;
  countdownEl.textContent = countdown;
  
  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    countdown--;
    countdownEl.textContent = countdown;
    
    if (countdown <= 0) {
      clearInterval(countdownInterval);
      if (currentStep < totalSteps) {
        nextBtn.textContent = "Next";
      } else {
        nextBtn.textContent = "Scroll down to continue";
      }
    }
  }, 1000);
}

// Handle next button click
nextBtn.addEventListener('click', () => {
  if (countdown > 0) {
    clearInterval(countdownInterval);
    countdown = 0;
    countdownEl.textContent = countdown;
    nextBtn.textContent = currentStep < totalSteps ? "Next" : "Scroll down to continue";
  } else if (currentStep < totalSteps) {
    currentStep++;
    updateBlogPost();
    startCountdown();
    nextBtn.textContent = "Next";
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
  startCountdown();
  
  // Show get link button on last step
  if (currentStep === totalSteps) {
    continueBtn.style.display = 'none';
    getLinkBtn.style.display = 'block';
  }
}

document.addEventListener('DOMContentLoaded', init);
