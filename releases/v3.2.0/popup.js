document.addEventListener('DOMContentLoaded', async () => {
  const statusDiv = document.getElementById('status');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');

  // Default menu configurations
  const defaultMenus = {
    1: {
      title: 'Summary',
      provider: '',
      apiKey: '',
      prompt: 'Analyze the content of this link and provide a brief summary (one paragraph, no introduction, structuring, or explanatory labels):',
      enabled: true
    },
    2: {
      title: 'Translation',
      provider: '',
      apiKey: '',
      prompt: 'Translate to Spanish',
      enabled: true
    },
    3: {
      title: 'Detailed Analysis',
      provider: '',
      apiKey: '',
      prompt: 'Analyze the content of this link in detail, including structure, main topics and key points:',
      enabled: false
    }
  };

  // Provider information
  const providerInfo = {
    openai: {
      help: 'Get your key at platform.openai.com/api-keys',
      placeholder: 'sk-...'
    },
    claude: {
      help: 'Get your key at console.anthropic.com',
      placeholder: 'sk-ant-...'
    },
    gemini: {
      help: 'Get your key at makersuite.google.com/app/apikey',
      placeholder: 'AIza...'
    },
    deepseek: {
      help: 'Get your key at platform.deepseek.com/api_keys',
      placeholder: 'sk-...'
    }
  };

  let currentTab = 1;
  let maxTabs = 3;

  // Initialize tabs functionality
  initializeTabs();
  
  // Load saved settings
  await loadSettings();

  // Initialize event listeners
  initializeEventListeners();

  function initializeTabs() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabId = e.target.dataset.tab;
        if (tabId) {
          switchTab(parseInt(tabId.replace('menu', '')));
        }
      });
    });

    // Add tab button
    document.getElementById('addTab').addEventListener('click', addNewTab);
  }

  function switchTab(tabNumber) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="menu${tabNumber}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`menu${tabNumber}`).classList.add('active');

    currentTab = tabNumber;
    updateTestButton();
  }

  function addNewTab() {
    if (maxTabs >= 10) {
      showStatus('Maximum 10 menu items', 'error');
      return;
    }

    maxTabs++;
    
    // Add tab button
    const tabsHeader = document.querySelector('.tabs-header');
    const addBtn = document.getElementById('addTab');
    
    const newTabBtn = document.createElement('button');
    newTabBtn.className = 'tab-btn';
    newTabBtn.dataset.tab = `menu${maxTabs}`;
    newTabBtn.textContent = `Item ${maxTabs}`;
    newTabBtn.addEventListener('click', () => switchTab(maxTabs));
    
    tabsHeader.insertBefore(newTabBtn, addBtn);

    // Add tab content
    const tabsContent = document.querySelector('.tabs-content');
    const newTabContent = createTabContent(maxTabs);
    tabsContent.appendChild(newTabContent);

    // Initialize the new tab with default settings
    if (!defaultMenus[maxTabs]) {
      defaultMenus[maxTabs] = {
        title: `Item ${maxTabs}`,
        provider: '',
        apiKey: '',
        prompt: 'Analyze the content of this link:',
        enabled: false
      };
    }

    // Setup event listeners for new tab
    setupTabEventListeners(maxTabs);
    
    // Switch to new tab
    switchTab(maxTabs);
  }

  function createTabContent(tabNumber) {
    const tabContent = document.createElement('div');
    tabContent.className = 'tab-content';
    tabContent.id = `menu${tabNumber}`;
    
    tabContent.innerHTML = `
      <div class="menu-config">
        <div class="form-group menu-header">
          <div class="menu-title-row">
            <label>Menu item title:</label>
            <button class="delete-menu-btn" data-menu="${tabNumber}" title="Delete this menu item">🗑️</button>
          </div>
          <input type="text" class="menu-title" placeholder="Item ${tabNumber}" data-menu="${tabNumber}">
        </div>
        
        <div class="form-group">
          <label>AI Provider:</label>
          <select class="ai-provider" data-menu="${tabNumber}">
            <option value="">Select provider...</option>
            <option value="openai">OpenAI (GPT)</option>
            <option value="claude">Anthropic (Claude)</option>
            <option value="gemini">Google (Gemini)</option>
            <option value="deepseek">DeepSeek</option>
          </select>
        </div>

        <div class="form-group">
          <label>API Key:</label>
          <input type="password" class="api-key" placeholder="Enter API key" data-menu="${tabNumber}">
          <div class="form-help">
            <small class="api-key-help">Get API key from selected provider</small>
          </div>
        </div>

        <div class="form-group">
          <label>AI Prompt:</label>
          <textarea class="prompt" rows="4" placeholder="Analyze the content..." data-menu="${tabNumber}"></textarea>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" class="menu-enabled" data-menu="${tabNumber}">
            Enable this menu item
          </label>
        </div>
      </div>
    `;

    return tabContent;
  }

  function setupTabEventListeners(tabNumber) {
    const tabContent = document.getElementById(`menu${tabNumber}`);
    
    // Provider change
    const providerSelect = tabContent.querySelector('.ai-provider');
    providerSelect.addEventListener('change', (e) => {
      updateProviderInfo(e.target, tabNumber);
      updateTestButton();
    });

    // API key change
    const apiKeyInput = tabContent.querySelector('.api-key');
    apiKeyInput.addEventListener('input', updateTestButton);

    // Enable checkbox change
    const enabledCheckbox = tabContent.querySelector('.menu-enabled');
    enabledCheckbox.addEventListener('change', updateTestButton);
    
    // Delete button
    const deleteBtn = tabContent.querySelector('.delete-menu-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => deleteMenuItem(tabNumber));
    }
  }

  function initializeEventListeners() {
    // Setup listeners for existing tabs
    for (let i = 1; i <= 3; i++) {
      setupTabEventListeners(i);
    }

    // Save button
    saveBtn.addEventListener('click', saveSettings);

    // Test button
    testBtn.addEventListener('click', testCurrentTab);
    
    // Delete buttons for existing tabs
    document.querySelectorAll('.delete-menu-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const menuId = parseInt(e.target.dataset.menu);
        deleteMenuItem(menuId);
      });
    });
  }

  async function loadSettings() {
    try {
      const settings = await chrome.storage.sync.get(['menuConfigs']);
      const menuConfigs = settings.menuConfigs || {};

      // Load configurations for each tab
      for (let i = 1; i <= maxTabs; i++) {
        const config = menuConfigs[i] || defaultMenus[i];
        if (config) {
          setTabValues(i, config);
        }
      }

      updateTestButton();
    } catch (error) {
      showStatus('Settings loading error: ' + error.message, 'error');
    }
  }

  function setTabValues(tabNumber, config) {
    const tabContent = document.getElementById(`menu${tabNumber}`);
    if (!tabContent) return;

    tabContent.querySelector('.menu-title').value = config.title || '';
    tabContent.querySelector('.ai-provider').value = config.provider || '';
    tabContent.querySelector('.api-key').value = config.apiKey || '';
    tabContent.querySelector('.prompt').value = config.prompt || '';
    tabContent.querySelector('.menu-enabled').checked = config.enabled || false;

    if (config.provider) {
      updateProviderInfo(tabContent.querySelector('.ai-provider'), tabNumber);
    }
  }

  function getTabValues(tabNumber) {
    const tabContent = document.getElementById(`menu${tabNumber}`);
    if (!tabContent) return null;

    return {
      title: tabContent.querySelector('.menu-title').value.trim(),
      provider: tabContent.querySelector('.ai-provider').value,
      apiKey: tabContent.querySelector('.api-key').value.trim(),
      prompt: tabContent.querySelector('.prompt').value.trim(),
      enabled: tabContent.querySelector('.menu-enabled').checked
    };
  }

  async function saveSettings() {
    const menuConfigs = {};

    // Collect all tab configurations
    for (let i = 1; i <= maxTabs; i++) {
      const config = getTabValues(i);
      if (config) {
        menuConfigs[i] = config;
      }
    }

    try {
      await chrome.storage.sync.set({ menuConfigs });
      showStatus('Settings saved successfully!', 'success');
      
      // Notify background script to update context menu
      chrome.runtime.sendMessage({ action: 'updateContextMenu' });
    } catch (error) {
      showStatus('Saving error: ' + error.message, 'error');
    }
  }

  async function testCurrentTab() {
    const config = getTabValues(currentTab);
    
    if (!config.provider || !config.apiKey) {
      showStatus('Fill in all required fields', 'error');
      return;
    }

    // Show loading
    testBtn.classList.add('btn-loading');
    testBtn.disabled = true;

    try {
      await testAIConnection(config.provider, config.apiKey, config.prompt);
      showStatus('AI connection successful!', 'success');
    } catch (error) {
      showStatus(`Connection error: ${error.message}`, 'error');
    } finally {
      testBtn.classList.remove('btn-loading');
      updateTestButton();
    }
  }

  function updateProviderInfo(selectElement, tabNumber) {
    const provider = selectElement.value;
    const tabContent = document.getElementById(`menu${tabNumber}`);
    const helpElement = tabContent.querySelector('.api-key-help');
    const apiKeyInput = tabContent.querySelector('.api-key');

    if (provider && providerInfo[provider]) {
      const info = providerInfo[provider];
      helpElement.textContent = info.help;
      apiKeyInput.placeholder = info.placeholder;
    } else {
      helpElement.textContent = 'Get API key from selected provider';
      apiKeyInput.placeholder = 'Enter API key';
    }
  }

  function updateTestButton() {
    const config = getTabValues(currentTab);
    const hasProvider = config && config.provider;
    const hasApiKey = config && config.apiKey;
    testBtn.disabled = !hasProvider || !hasApiKey;
  }

  function deleteMenuItem(tabNumber) {
    // Prevent deleting if only one tab left
    if (maxTabs <= 1) {
      showStatus('Cannot delete the last menu item', 'error');
      return;
    }

    // Confirm deletion
    const tabConfig = getTabValues(tabNumber);
    const tabTitle = tabConfig?.title || `Item ${tabNumber}`;
    if (!confirm(`Delete menu item "${tabTitle}"?`)) {
      return;
    }

    // Remove tab button
    const tabBtn = document.querySelector(`[data-tab="menu${tabNumber}"]`);
    if (tabBtn) {
      tabBtn.remove();
    }

    // Remove tab content
    const tabContent = document.getElementById(`menu${tabNumber}`);
    if (tabContent) {
      tabContent.remove();
    }

    // Update tab numbers and maxTabs
    const remainingTabs = document.querySelectorAll('.tab-btn:not(.add-tab-btn)');
    maxTabs = remainingTabs.length;

    // If deleted tab was active, switch to first available tab
    if (currentTab === tabNumber) {
      if (remainingTabs.length > 0) {
        const firstTab = remainingTabs[0];
        const firstTabNumber = parseInt(firstTab.dataset.tab.replace('menu', ''));
        switchTab(firstTabNumber);
      }
    }

    showStatus('Menu item deleted', 'success');
  }

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status-message ${type}`;
    statusDiv.style.display = 'block';
    
    if (type === 'success') {
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 3000);
    }
  }

  // AI testing functions
  async function testAIConnection(provider, apiKey, prompt) {
    const testPrompt = `${prompt || 'Connection test'}\n\nTest link: https://example.com`;
    
    switch (provider) {
      case 'openai':
        return await testOpenAI(apiKey, testPrompt);
      case 'claude':
        return await testClaude(apiKey, testPrompt);
      case 'gemini':
        return await testGemini(apiKey, testPrompt);
      case 'deepseek':
        return await testDeepSeek(apiKey, testPrompt);
      default:
        throw new Error('Unsupported provider');
    }
  }

  async function testOpenAI(apiKey, prompt) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 50
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  async function testClaude(apiKey, prompt) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 50,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  async function testGemini(apiKey, prompt) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 50 }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  async function testDeepSeek(apiKey, prompt) {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 50
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    return await response.json();
  }
});