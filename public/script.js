document.getElementById('url-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const urlInput = document.getElementById('url-input').value;
  const resultDiv = document.getElementById('result');

  try {
    const response = await fetch('/api/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: urlInput }),
    });
    const data = await response.json();

    if (response.ok) {
      resultDiv.innerHTML = `Shortened URL: <a href="${data.shortUrl}" target="_blank">${data.shortUrl}</a>`;
    } else {
      resultDiv.innerHTML = `Error: ${data.error}`;
    }
  } catch (error) {
    resultDiv.innerHTML = 'Error: Could not connect to server';
  }
});
