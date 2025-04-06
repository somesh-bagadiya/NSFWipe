# NSFWipe

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/nsfwipe)](your_store_link_here)
[![Firefox Add-ons](https://img.shields.io/amo/v/nsfwipe)](your_firefox_link_here)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support-orange.svg)](https://www.buymeacoffee.com/thedlc)

A privacy-focused browser extension that automatically manages and cleans your browsing history by removing NSFW content and maintaining a clean browsing environment.

<p align="center">
  <img src="icons/icon128.png" alt="NSFWipe Logo">
</p>

## 🌟 Features

- 🚫 Automatic NSFW content blocking and removal
- 🔒 Privacy-focused with local-only storage
- 📊 Detailed history management interface
- 🔍 Domain and keyword-based filtering
- 📝 Comprehensive deletion logs
- 🔄 Real-time history monitoring
- ⚡ Fast and lightweight
- 🌙 Dark mode support
- 🌐 Cross-browser compatibility

## 📥 Installation

### Chrome Web Store

[![Chrome Web Store](https://img.shields.io/chrome-web-store/users/nsfwipe)](your_store_link_here)

1. Install from the [Chrome Web Store](your_store_link_here)
2. Click the extension icon to open the management interface
3. Start adding custom domains or keywords to block

### Firefox Add-ons

[![Firefox Add-ons](https://img.shields.io/amo/users/nsfwipe)](your_firefox_link_here)

1. Install from [Firefox Add-ons](your_firefox_link_here)
2. Click the extension icon to open the management interface
3. Start adding custom domains or keywords to block

## 🚀 Usage

### Basic Usage

- Click the extension icon to view the main interface
- Switch between Domains and Keywords tabs
- Add new domains or keywords to block
- View blocked history with the "View History" button

### Managing History

- View blocked sites organized by domain and keyword matches
- Sort entries by time (newest/oldest)
- Export history to CSV
- Clear history as needed

### Customization

- Add custom domains to block
- Add custom keywords to filter
- All settings are stored locally for privacy
- Toggle between light and dark themes

## 🔒 Privacy

- No data collection or transmission
- All data stored locally
- No external server communication
- Clear history and logs anytime

## ⚙️ Requirements

- Chrome/Chromium-based browser version 88 or higher
- Firefox version 109.0 or higher
- Permissions:
  - History access (for cleaning)
  - Storage (for settings)
  - Tabs (for management)
  - Web Navigation (for monitoring)

## 👨‍💻 Development

### Prerequisites

- Git
- Chrome or Firefox browser
- Basic knowledge of JavaScript and browser extensions

### Setup

1. Clone the repository

```bash
git clone https://github.com/yourusername/nsfwipe
cd nsfwipe
```

2. Load in Chrome

- Open Chrome
- Go to `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the extension directory

3. Load in Firefox

- Open Firefox
- Go to `about:debugging`
- Click "This Firefox"
- Click "Load Temporary Add-on"
- Select the manifest.json file

### Project Structure

```
nsfwipe/
├── icons/                 # Extension icons
├── background.js         # Background service worker
├── popup.html           # Extension popup interface
├── popup.js            # Popup functionality
├── blocked_history.html # History view
├── blocked_history.js  # History functionality
├── blocked_history.css # History styling
├── manifest.json      # Extension manifest
├── LICENSE           # MIT license
└── README.md        # This file
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please ensure your PR adheres to:

- Consistent code style
- Proper documentation
- Meaningful commit messages
- No unnecessary dependencies

## ☕ Support the Project

If you find this extension helpful, consider supporting its development:

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/thedlc)

Your support helps maintain and improve the extension!

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support:

- [Open an issue](https://github.com/yourusername/nsfwipe/issues)
- [View existing issues](https://github.com/yourusername/nsfwipe/issues?q=is%3Aissue)
- Contact: [Your Contact Information]

## 📝 Changelog

### Version 1.0.0 (YYYY-MM-DD)

- Initial release
- Basic NSFW filtering
- History management
- Custom patterns
- Export functionality
- Cross-browser support
- Dark mode implementation

## 🙏 Acknowledgments

- All contributors who have helped this project grow
- The open-source community for inspiration and tools
- Users who provide valuable feedback and suggestions
