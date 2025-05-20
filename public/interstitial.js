let currentPage = 1;
const totalPages = 4;
let countdown = 10;
let currentPost = null;

const progress = document.getElementById('progress');
const postTitle = document.getElementById('post-title');
const postMeta = document.getElementById('post-meta');
const postBody = document.getElementById('post-body');
const nextButton = document.getElementById('next-button');
const countdownDiv = document.getElementById('countdown');
const instruction = document.getElementById('instruction');
const continueButton = document.getElementById('continue-button');
const getLinkButton = document.getElementById('get-link');

// Get short code from URL
const shortCode = window.location.pathname.substring(1);

async function fetchRandomPost() {
  try {
    const response = await fetch('/api/blog-posts/random');
    const data = await response.json();
    if (response.ok) {
      currentPost = data;
      postTitle.textContent = data.title;
      postMeta.textContent = `By ${data.author} on ${data.date}`;
      postBody.textContent = data.content;
    } else {
      postBody.textContent = `Error: ${data.error}`;
      postBody.classList.add('error');
    }
  } catch (error) {
    console.error('Error fetching post:', error);
    postBody.textContent = 'Error: Could not load blog post';
    postBody.classList.add('error');
  }
}

function updatePage() {
  progress.textContent = `You are currently on step ${currentPage}/${totalPages}`;
  nextButton.style.display = 'block';
  countdownDiv.style.display = 'none';
  instruction.style.display = 'none';
  continueButton.style.display = 'none';
  getLinkButton.style.display = 'none';
  fetchRandomPost();
}

function startCountdown() {
  countdown = 10;
  countdownDiv.textContent = countdown;
  countdownDiv.style.display = 'block';
  nextButton.style.display = 'none';

  const interval = setInterval(() => {
    countdown--;
    countdownDiv.textContent = countdown;

    if (countdown <= 0) {
      clearInterval(interval);
      instruction.style.display = 'block';
      continueButton.style.display = currentPage < totalPages ? 'block' : 'none';
      getLinkButton.style.display = currentPage === totalPages ? 'block' : 'none';
    }
  }, 1000);
}

nextButton.addEventListener('click', () => {
  startCountdown();
});

continueButton.addEventListener('click', () => {
  currentPage++;
  if (currentPage <= totalPages) {
    updatePage();
  }
});

getLinkButton.addEventListener('click', async () => {
  try {
    const response = await fetch(`/api/resolve/${shortCode}`);
    const data = await response.json();
    if (response.ok && data.originalUrl) {
      console.log(`Redirecting to ${data.originalUrl}`);
      window.location.href = data.originalUrl;
    } else {
      postBody.textContent = `Error: ${data.error || 'Invalid response'}`;
      postBody.classList.add('error');
    }
  } catch (error) {
    console.error('Error fetching original URL:', error);
    postBody.textContent = 'Error: Could not connect to server';
    postBody.classList.add('error');
  }
});

async function validateShortCode() {
  try {
    const response = await fetch(`/api/resolve/${shortCode}`);
    const data = await response.json();
    if (!response.ok) {
      postBody.textContent = `Error: ${data.error || 'Invalid short code'}`;
      postBody.classList.add('error');
      countdownDiv.style.display = 'none';
      nextButton.style.display = 'none';
    } else {
      updatePage();
    }
  } catch (error) {
    console.error('Error validating short code:', error);
    postBody.textContent = 'Error: Could not connect to server';
    postBody.classList.add('error');
    countdownDiv.style.display = 'none';
    nextButton.style.display = 'none';
  }
}

// Initialize
validateShortCode();
