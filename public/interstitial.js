// Sample posts for dynamic content
const posts = [
  "Discover the latest tech trends in 2025! AI is transforming industries.",
  "Check out these amazing travel destinations for your next vacation.",
  "Learn how to boost your productivity with these simple tips.",
  "Stay updated with the latest news and insights from around the world."
];

let currentPage = 1;
const totalPages = 4;
let countdown = 10;

const pageTitle = document.getElementById('page-title');
const countdownDiv = document.getElementById('countdown');
const postContent = document.getElementById('post-content');
const getLinkButton = document.getElementById('get-link');

// Get short code from URL
const shortCode = window.location.pathname.substring(1);

function updatePage() {
  pageTitle.textContent = `Page ${currentPage} of ${totalPages}`;
  postContent.textContent = posts[currentPage - 1];
  countdownDiv.textContent = countdown;

  if (currentPage === totalPages && countdown === 0) {
    countdownDiv.style.display = 'none';
    getLinkButton.style.display = 'block';
  }
}

function startCountdown() {
  countdown = 10;
  countdownDiv.textContent = countdown;

  const interval = setInterval(() => {
    countdown--;
    countdownDiv.textContent = countdown;

    if (countdown <= 0) {
      clearInterval(interval);
      currentPage++;
      if (currentPage <= totalPages) {
        updatePage();
        startCountdown();
      }
    }
  }, 1000);
}

// Fetch original URL and handle "Get Link" click
getLinkButton.addEventListener('click', async () => {
  try {
    const response = await fetch(`/api/resolve/${shortCode}`);
    const data = await response.json();
    if (response.ok) {
      window.location.href = data.originalUrl;
    } else {
      postContent.textContent = `Error: ${data.error}`;
    }
  } catch (error) {
    postContent.textContent = 'Error: Could not connect to server';
  }
});

// Add new API endpoint to resolve short code
async function resolveShortCode() {
  try {
    const response = await fetch(`/api/resolve/${shortCode}`);
    const data = await response.json();
    if (!response.ok) {
      postContent.textContent = `Error: ${data.error}`;
    }
  } catch (error) {
    postContent.textContent = 'Error: Could not connect to server';
  }
}

// Initialize the first page
updatePage();
startCountdown();
