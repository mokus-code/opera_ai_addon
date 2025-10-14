# AI Link Analyzer - Opera Browser Extension

## Description

AI Link Analyzer is an Opera browser extension that analyzes web content using artificial intelligence. When you right-click on any link, the extension loads the web page content and sends it to your chosen AI provider for analysis. You can also select any text on a page and right-click to analyze just that selected text directly.

## ✨ Key Features

- 🌐 **Deep content analysis**: Automatically loads and analyzes web page content from links
- 📝 **Selected text analysis**: Analyze any selected text on web pages
- 🎯 **Multiple menu items**: Configure up to 10 different AI analysis options
- 🤖 **Multiple AI providers**: OpenAI GPT, Anthropic Claude, Google Gemini, DeepSeek
- ⚙️ **Individual configurations**: Each menu item has its own AI provider, API key, and custom prompt
- 📖 **Content extraction**: Automatically cleans HTML and extracts title, description, and main text
- 💬 **Beautiful dialog window**: Analysis results displayed in a modal window directly on the page
- ⚡ **Quick access**: Integration with browser context menu
- 🔧 **Customizable prompts**: Personalize AI queries to get the information you need
- 🧪 **API testing**: Check connection to AI providers for each configuration

## Installation

1. Open Opera
2. Go to `opera://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked extension"
5. Select the extension folder (`opera_ai_addon`)

## Configuration

1. Click on the extension icon in the toolbar
2. Configure multiple menu items using the tab interface:
   - **Menu Item Title**: Custom name that appears in context menu
   - **AI Provider**: Choose from OpenAI, Claude, Gemini, or DeepSeek
   - **API Key**: Enter your API key for the selected provider
   - **Custom Prompt**: Personalize the AI analysis prompt
   - **Enable/Disable**: Toggle each menu item on/off
3. Click "Save All Settings" to apply changes
4. Optionally: click "Test Current" to check the connection for active tab

### Multiple Menu Items

The extension comes with two pre-configured menu items:

1. **Summary** - Provides a brief summary of web page content
   - Default prompt: "Analyze the content and provide a brief summary (one paragraph, no introduction, no structuring, no explanatory labels)"
   - Status: Enabled by default (requires API configuration)

2. **Translation** - Translates content to Spanish
   - Default prompt: "Translate to Spanish"  
   - Status: Enabled by default (requires API configuration)

3. **AI Analysis** - General content analysis
   - Default prompt: "Analyze the content of this link and tell what can be found on it"
   - Status: Disabled by default

You can configure up to 10 different menu items, each with:
- Individual AI provider and API key
- Custom prompts for different analysis types
- Separate enable/disable controls
- Examples:
  - "Technical Review" for code/technical content
  - "Security Check" for security analysis
  - "Content Summary" for article summaries

### Getting API Keys

- **OpenAI**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Anthropic**: [console.anthropic.com](https://console.anthropic.com/)
- **Google AI**: [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
- **DeepSeek**: [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)

## Usage

### Analyzing Links
1. Find any link on a web page
2. Right-click on it
3. Select "Analyze with AI"
4. The extension will automatically:
   - Load the web page content
   - Extract title, description, and main text
   - Send the data to the selected AI provider
   - Show the analysis result in a dialog window

### Analyzing Selected Text
1. Select any text on a web page
2. Right-click on the selected text
3. Select "Analyze with AI"
4. The extension will send the selected text directly to the AI provider for analysis

## 🧠 What the AI Analyzes

- **Page title**
- **Meta description**
- **Main text content** (up to 4000 characters)
- **Site topic and purpose**
- **Key information and summary**

When unable to load page content (e.g., due to CORS), the AI will analyze the link based on the URL.

## Project Structure

```
opera_ai_addon/
├── manifest.json          # Extension manifest
├── background.js           # Service Worker for context menu handling and AI requests
├── content.js             # Content Script for dialog window functionality
├── dialog.css             # Dialog window styles
├── popup.html             # Extension settings HTML
├── popup.css              # Settings styles
├── popup.js               # Settings logic
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # Documentation
```

## Technical Information

### Supported APIs

- **OpenAI**: GPT-3.5 Turbo via official API
- **Anthropic**: Claude via official API  
- **Google**: Gemini Pro via Google AI API
- **DeepSeek**: DeepSeek Chat via official API

### Permissions

- `contextMenus` - for creating context menu items
- `activeTab` - for interacting with the active tab
- `storage` - for saving settings
- `http://*/*`, `https://*/*` - for making requests to AI APIs

### Security

- API keys are stored locally in the browser
- Data transmission occurs only to official AI APIs
- The extension does not collect or transmit personal information

## Development

### Requirements

- Opera (or any Chromium-based browser)
- API key from one of the supported AI providers

### Build

The extension does not require building - it's a ready-to-use set of files.

### Testing

1. Load the extension in developer mode
2. Configure an AI provider
3. Use the "Test" button in settings
4. Check functionality on any web page with links

## Support

If you encounter problems:

### If nothing happens when right-clicking:

1. **Check extension installation**:
   - Go to `opera://extensions/`
   - Make sure the extension is enabled
   - Try reloading the extension

2. **Check settings**:
   - Click on the extension icon
   - Make sure an AI provider is selected
   - Make sure a correct API key is entered
   - Click "Test" to verify

3. **Check permissions**:
   - In `opera://extensions/` find the extension
   - Make sure all permissions are granted
   - Try reinstalling the extension

### Other issues:

1. Check API key correctness
2. Make sure the correct provider is selected
3. Check internet connection
4. Look at logs in developer console (F12)

## License

MIT License - freely use and modify the code.