// Buffer polyfill for Solana web3.js
(function() {
  try {
    if (typeof window !== 'undefined') {
      window.global = window;
      window.process = { env: {} };
      
      // Import buffer from node modules
      const bufferScript = document.createElement('script');
      bufferScript.src = 'https://cdn.jsdelivr.net/npm/buffer@6.0.3/index.min.js';
      bufferScript.async = false;
      bufferScript.onload = function() {
        if (typeof window.Buffer !== 'undefined') {
          console.log('Buffer polyfill loaded successfully');
        } else {
          console.error('Failed to load Buffer polyfill');
        }
      };
      document.head.appendChild(bufferScript);
    }
  } catch (e) {
    console.error('Error setting up polyfills:', e);
  }
})();
