// test-fetch.mjs
async function test() {
  const url = 'http://127.0.0.1:3000/health';
  console.log(`Fetching ${url} with a curl User-Agent...`);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'curl/7.88.1' // Mimic curl's User-Agent
      }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    console.log('Success:');
    console.log(data);
  } catch (error) {
    console.error('Error:', error);
  }
}

test();