// Create context menu on install and when settings change
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed/updated, creating context menu...');
  updateContextMenu();
});

// Listen for messages from popup to update context menu
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateContextMenu') {
    console.log('Updating context menu from popup...');
    updateContextMenu();
    sendResponse({success: true});
  }
});

// Function to update context menu based on saved configurations
async function updateContextMenu() {
  try {
    console.log('Clearing all context menu items...');
    // Remove all existing menu items
    await chrome.contextMenus.removeAll();
    
    // Get saved menu configurations
    const settings = await chrome.storage.sync.get(['menuConfigs']);
    const menuConfigs = settings.menuConfigs || {};
    console.log('Menu configs:', menuConfigs);
    
    // Create separate menu items for enabled configurations
    let hasEnabledMenus = false;
    
    for (const [menuId, config] of Object.entries(menuConfigs)) {
      if (config.enabled && config.title && config.provider && config.apiKey) {
        console.log(`Creating menu item: ${config.title}`);
        
        chrome.contextMenus.create({
          id: `aiAnalyze_${menuId}`,
          title: config.title,
          contexts: ["link", "selection", "page"],
          documentUrlPatterns: ["http://*/*", "https://*/*"]
        });
        
        hasEnabledMenus = true;
      }
    }
    
    // If no menus are configured, create default one
    if (!hasEnabledMenus) {
      console.log('No enabled menus, creating default...');
      chrome.contextMenus.create({
        id: "aiAnalyze_default",
        title: "Analyze with AI (Configure in settings)",
        contexts: ["link", "selection"],
        enabled: false
      });
    }
    
    console.log('Context menu update completed');
  } catch (error) {
    console.error('Error updating context menu:', error);
  }
}

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // Check if this is one of our AI analyze menu items
  if (info.menuItemId.startsWith('aiAnalyze_')) {
    const menuId = info.menuItemId.replace('aiAnalyze_', '');
    
    // Handle default menu item (no configuration)
    if (menuId === 'default') {
      await chrome.tabs.sendMessage(tab.id, {
        action: "showDialog",
        content: "Please configure AI settings in the extension popup first.",
        isError: true
      });
      return;
    }
    
    try {
      // Get configuration for this menu item
      const settings = await chrome.storage.sync.get(['menuConfigs']);
      const menuConfigs = settings.menuConfigs || {};
      const config = menuConfigs[menuId];
      
      if (!config || !config.enabled) {
        await chrome.tabs.sendMessage(tab.id, {
          action: "showDialog",
          content: "This menu item is not properly configured.",
          isError: true
        });
        return;
      }
      
      if (!config.provider || !config.apiKey) {
        await chrome.tabs.sendMessage(tab.id, {
          action: "showDialog",
          content: "AI provider or API key not configured for this menu item.",
          isError: true
        });
        return;
      }

      // Check if we have selected text
      if (info.selectionText) {
        // Analyze selected text
        await chrome.tabs.sendMessage(tab.id, {
          action: "showDialog",
          content: "Analyzing selected text...",
          isLoading: true,
          url: "Selected Text"
        });

        // Send selected text to AI
        const aiResponse = await queryAI(null, config, null, info.selectionText);
        
        // Show result
        await chrome.tabs.sendMessage(tab.id, {
          action: "showDialog",
          content: aiResponse,
          isLoading: false,
          url: "Selected Text"
        });
        
      } else if (info.linkUrl) {
        // Analyze link (existing functionality)
        await chrome.tabs.sendMessage(tab.id, {
          action: "showDialog",
          content: "Loading page content...",
          isLoading: true,
          url: info.linkUrl
        });

        // Request content loading through content script
        const pageData = await chrome.tabs.sendMessage(tab.id, {
          action: "fetchPageContent",
          url: info.linkUrl
        });
        
        if (pageData?.success) {
          console.log('AI Link Analyzer: Page content loaded successfully');
        } else {
          console.warn('AI Link Analyzer: Page content loading failed, analyzing URL only');
        }
        
        // Update status
        await chrome.tabs.sendMessage(tab.id, {
          action: "showDialog",
          content: pageData?.success ? "Analyzing content with AI..." : "Analyzing link...",
          isLoading: true,
          url: info.linkUrl
        });

        // Send request to AI
        const aiResponse = await queryAI(info.linkUrl, config, pageData);
        
        // Show result
        await chrome.tabs.sendMessage(tab.id, {
          action: "showDialog",
          content: aiResponse,
          isLoading: false,
          url: info.linkUrl
        });
        
      } else {
        // Analyze current page content (when no selection or link)
        await chrome.tabs.sendMessage(tab.id, {
          action: "showDialog",
          content: "Analyzing current page...",
          isLoading: true,
          url: tab.url
        });

        // Get current page content
        const pageData = await chrome.tabs.sendMessage(tab.id, {
          action: "getCurrentPageContent"
        });
        
        if (pageData?.success) {
          console.log('AI Link Analyzer: Current page content loaded successfully');
        } else {
          console.warn('AI Link Analyzer: Current page content loading failed, analyzing URL only');
        }
        
        // Update status
        await chrome.tabs.sendMessage(tab.id, {
          action: "showDialog",
          content: pageData?.success ? "Analyzing page with AI..." : "Analyzing page...",
          isLoading: true,
          url: tab.url
        });

        // Send request to AI with current page content
        const aiResponse = await queryAI(tab.url, config, pageData, null, true);
        
        // Show result
        await chrome.tabs.sendMessage(tab.id, {
          action: "showDialog",
          content: aiResponse,
          isLoading: false,
          url: tab.url
        });
      }
      
    } catch (error) {
      await chrome.tabs.sendMessage(tab.id, {
        action: "showDialog",
        content: `Analysis error: ${error.message}`,
        isError: true
      }).catch(() => {});
    }
  }
});

// Function for AI queries
async function queryAI(url, config, pageData = null, selectedText = null, isCurrentPage = false) {
  const { provider, apiKey, prompt } = config;
  
  let fullPrompt;
  
  if (selectedText) {
    // If we have selected text, analyze it
    fullPrompt = `${prompt || 'Analyze this selected text:'}

Selected text:
${selectedText}`;
  } else if (isCurrentPage && pageData?.success && pageData.content) {
    // If analyzing current page content
    fullPrompt = `${prompt || 'Analyze the content of this web page:'}

Current Page URL: ${url}
Title: ${pageData.title}
Description: ${pageData.metaDescription}

Page content:
${pageData.content}`;
  } else if (pageData?.success && pageData.content) {
    // If page content was successfully loaded (for links)
    fullPrompt = `${prompt || 'Analyze the content of this web page:'}

URL: ${url}
Title: ${pageData.title}
Description: ${pageData.metaDescription}

Page content:
${pageData.content}`;
  } else {
    // If content loading failed, analyze URL only
    const defaultPrompt = isCurrentPage ? 'Analyze this web page:' : 'Analyze this link and tell what can be found on it:';
    fullPrompt = `${prompt || defaultPrompt} ${url}`;
    if (pageData && !pageData.success) {
      fullPrompt += `\n\nNote: Failed to load page content (${pageData.error}). Please analyze based on URL.`;
    }
  }
  
  switch (provider) {
    case 'openai':
      return await queryOpenAI(fullPrompt, apiKey);
    case 'claude':
      return await queryClaude(fullPrompt, apiKey);
    case 'gemini':
      return await queryGemini(fullPrompt, apiKey);
    case 'deepseek':
      return await queryDeepSeek(fullPrompt, apiKey);
    default:
      throw new Error('Unsupported AI provider');
  }
}

// OpenAI API
async function queryOpenAI(prompt, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Claude API (Anthropic)
async function queryClaude(prompt, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// Google Gemini API
async function queryGemini(prompt, apiKey) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// DeepSeek API
async function queryDeepSeek(prompt, apiKey) {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}