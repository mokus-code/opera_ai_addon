// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "showDialog") {
    try {
      showAIDialog(message.content, message.isLoading, message.isError, message.url);
      sendResponse({success: true});
    } catch (error) {
      sendResponse({success: false, error: error.message});
    }
    return true;
  } 
  
  if (message.action === "fetchPageContent") {
    fetchPageContent(message.url)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({
        url: message.url,
        title: '',
        metaDescription: '',
        content: '',
        success: false,
        error: error.message
      }));
    return true; // Indicates that response will be asynchronous
  }
  
  return false;
});

// Function for loading web page content
async function fetchPageContent(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Extract text content from HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Remove scripts and styles
    const scripts = doc.querySelectorAll('script, style, noscript');
    scripts.forEach(el => el.remove());
    
    // Get page title
    const title = doc.querySelector('title')?.textContent?.trim() || '';
    
    // Get meta description
    const metaDescription = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    
    // Get main text content
    let mainText = doc.body?.textContent || doc.textContent || '';
    
    // Clean up extra spaces and line breaks
    mainText = mainText.replace(/\s+/g, ' ').trim();
    
    // Limit text length (for token economy)
    const maxLength = 4000;
    if (mainText.length > maxLength) {
      mainText = mainText.substring(0, maxLength) + '...';
    }
    
    return {
      url,
      title,
      metaDescription,
      content: mainText,
      success: true
    };
    
  } catch (error) {
    return {
      url,
      title: '',
      metaDescription: '',
      content: '',
      success: false,
      error: error.message
    };
  }
}

// Function for showing dialog window
function showAIDialog(content, isLoading = false, isError = false, url = '') {
  // Remove existing dialog if any
  const existingDialog = document.getElementById('ai-link-analyzer-dialog');
  if (existingDialog) {
    existingDialog.remove();
  }

  // Create dialog
  const dialog = document.createElement('div');
  dialog.id = 'ai-link-analyzer-dialog';
  dialog.className = 'ai-dialog';
  
  const dialogContent = `
    <div class="ai-dialog-overlay">
      <div class="ai-dialog-content">
        <div class="ai-dialog-header">
          <div class="ai-dialog-icon" id="ai-dialog-icon"></div>
          <div class="ai-dialog-url">${url || 'Link Analysis'}</div>
          <button class="ai-dialog-close" id="ai-dialog-close-btn">×</button>
        </div>
        <div class="ai-dialog-body">
          <div class="ai-dialog-result ${isError ? 'error' : ''} ${isLoading ? 'loading' : ''}">
            ${isLoading ? '<div class="spinner"></div>' : ''}
            <div class="ai-response">${content}</div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  dialog.innerHTML = dialogContent;
  
  // Set icon using proper extension URL
  const iconElement = dialog.querySelector('#ai-dialog-icon');
  if (iconElement) {
    const iconUrl = chrome.runtime.getURL('icons/icon16.png');
    iconElement.style.backgroundImage = `url('${iconUrl}')`;
  }
  
  // Check DOM readiness
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      addDialogToPage(dialog);
    });
  } else {
    addDialogToPage(dialog);
  }
}

// Function for adding dialog to page
function addDialogToPage(dialog) {
  // Add dialog to DOM
  document.body.appendChild(dialog);
  
  // Add handler for close button
  const closeBtn = dialog.querySelector('#ai-dialog-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      dialog.remove();
    });
  }
  
  // Add handler for closing on overlay click
  const overlay = dialog.querySelector('.ai-dialog-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        dialog.remove();
      }
    });
  }
  
  // Add handler for closing on Escape key
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      dialog.remove();
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);
}