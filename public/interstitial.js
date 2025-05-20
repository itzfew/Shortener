import { blogPosts } from './blog-posts.js';

let currentStep = 1;
const totalSteps = 4;
let countdown = 10;

const title = document.getElementById('page-title');
const content = document.getElementById('post-content');
const stepIndicator = document.getElementById('step-indicator');
const nextButton = document.getElementById('next-button');
const continueButton = document.getElementById('continue-button');
const getLinkButton = document.getElementById('get-link');
const countdownDiv = document.getElementById('countdown');

const shortCode = window.location.pathname.substring(1);

function loadBlog(step) {
  const blog = blogPosts[Math.floor(Math.random() * blogPosts.length)];
  stepIndicator.textContent = `You are currently on step ${step}/${totalSteps}`;
  content.innerHTML = `<h3>${blog.title}</h3><p>${blog.content}</p>`;
}

function startCountdown() {
  nextButton.style.display = 'none';
  countdownDiv.style.display = 'block';
  let timeLeft = countdown;
  countdownDiv.textContent = timeLeft;

  const timer = setInterval(() => {
    timeLeft--;
    countdownDiv.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timer);
      countdownDiv.style.display = 'none';
      if (currentStep < totalSteps) {
        continueButton.style.display = 'block';
      } else {
        getLinkButton.style.display = 'block';
      }
    }
  }, 1000);
}

nextButton.addEventListener('click', startCountdown);

continueButton.addEventListener('click', () => {
  currentStep++;
  continueButton.style.display = 'none';
  loadBlog(currentStep);
  nextButton.style.display = 'block';
});

getLinkButton.addEventListener('click', async () => {
  const response = await fetch(`/api/resolve/${shortCode}`);
  const data = await response.json();
  if (response.ok) {
    window.location.href = data.originalUrl;
  } else {
    content.textContent = `Error: ${data.error}`;
  }
});

// Initial Load
loadBlog(currentStep);
nextButton.style.display = 'block';
