document.addEventListener('DOMContentLoaded', function() {
  // Check if instructions should be shown
  chrome.storage.local.get(['hideInstructions'], (result) => {
    if (result.hideInstructions) {
      const instructions = document.getElementById('instructions');
      if (instructions) {
        instructions.style.display = 'none';
      }
    }
  });

  // Handle instructions close button
  const closeInstructions = document.getElementById('closeInstructions');
  if (closeInstructions) {
    closeInstructions.addEventListener('click', () => {
      const instructions = document.getElementById('instructions');
      if (instructions) {
        instructions.style.display = 'none';
        chrome.storage.local.set({ hideInstructions: true });
      }
    });
  }

  // Tab switching
  const tabDomains = document.getElementById('tabDomains');
  const tabKeywords = document.getElementById('tabKeywords');
  const domainSection = document.getElementById('domainSection');
  const keywordSection = document.getElementById('keywordSection');

  if (tabDomains && tabKeywords && domainSection && keywordSection) {
    tabDomains.addEventListener('click', () => {
      tabDomains.classList.add('active');
      tabKeywords.classList.remove('active');
      domainSection.style.display = 'block';
      keywordSection.style.display = 'none';
    });

    tabKeywords.addEventListener('click', () => {
      tabKeywords.classList.add('active');
      tabDomains.classList.remove('active');
      keywordSection.style.display = 'block';
      domainSection.style.display = 'none';
    });
  }

  // Load custom patterns
  loadCustomPatterns();

  // Add domain button and Enter key handling
  const addDomainBtn = document.getElementById('addDomain');
  const domainInput = document.getElementById('newDomain');
  
  if (addDomainBtn && domainInput) {
    const handleDomainAdd = () => {
      const domain = domainInput.value.trim().toLowerCase();
      if (domain) {
        addCustomPattern('domains', domain, () => {
          domainInput.value = '';
          loadCustomPatterns();
        });
      }
    };

    addDomainBtn.addEventListener('click', handleDomainAdd);
    domainInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleDomainAdd();
      }
    });
  }

  // Add keyword button and Enter key handling
  const addKeywordBtn = document.getElementById('addKeyword');
  const keywordInput = document.getElementById('newKeyword');
  
  if (addKeywordBtn && keywordInput) {
    const handleKeywordAdd = () => {
      const keyword = keywordInput.value.trim().toLowerCase();
      if (keyword) {
        addCustomPattern('keywords', keyword, () => {
          keywordInput.value = '';
          loadCustomPatterns();
        });
      }
    };

    addKeywordBtn.addEventListener('click', handleKeywordAdd);
    keywordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleKeywordAdd();
      }
    });
  }

  // View blocked history button
  const viewBlockedBtn = document.getElementById('viewBlocked');
  if (viewBlockedBtn) {
    viewBlockedBtn.addEventListener('click', () => {
      console.log('View blocked history button clicked');
      chrome.storage.local.get(['blockedUrls', 'deletionLog'], (result) => {
        console.log('Retrieved data from storage:', result);
        const blockedUrls = result.blockedUrls || [];
        const deletionLog = result.deletionLog || [];
        console.log('Blocked URLs:', blockedUrls);
        console.log('Deletion Log:', deletionLog);
        
        if (blockedUrls.length === 0 && deletionLog.length === 0) {
          alert('No history or deletion logs found.');
          return;
        }

        // Store the data in session storage before opening the window
        const historyData = {
          blockedUrls,
          deletionLog
        };
        sessionStorage.setItem('nsfwipe_history_data', JSON.stringify(historyData));

        // Create a new window to display blocked sites
        const url = chrome.runtime.getURL('blocked_history.html');
        chrome.windows.create({
          url: url,
          type: 'popup',
          width: 800,
          height: 600
        }, (window) => {
          if (chrome.runtime.lastError) {
            console.error('Error opening history window:', chrome.runtime.lastError);
            alert('Could not open history window. Please check your popup blocker settings.');
          }
        });
      });
    });
  }

  // Clear history button
  const clearHistoryBtn = document.getElementById('clearHistory');
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all browsing history?')) {
        chrome.history.deleteAll(() => {
          alert('All browsing history has been cleared.');
        });
      }
    });
  }
});

// Function to load and display custom patterns
function loadCustomPatterns() {
  try {
    chrome.storage.local.get(['customPatterns'], (result) => {
      const patterns = result.customPatterns || { domains: [], keywords: [] };
      
      // Display domains
      const domainsContainer = document.getElementById('customDomains');
      if (domainsContainer) {
        domainsContainer.innerHTML = patterns.domains.map(domain => `
          <div class="pattern-item">
            <span>${sanitizeHTML(domain)}</span>
            <button class="delete-btn" data-type="domains" data-value="${sanitizeHTML(domain)}" title="Remove ${sanitizeHTML(domain)}">×</button>
          </div>
        `).join('');
      }

      // Display keywords
      const keywordsContainer = document.getElementById('customKeywords');
      if (keywordsContainer) {
        keywordsContainer.innerHTML = patterns.keywords.map(keyword => `
          <div class="pattern-item">
            <span>${sanitizeHTML(keyword)}</span>
            <button class="delete-btn" data-type="keywords" data-value="${sanitizeHTML(keyword)}" title="Remove ${sanitizeHTML(keyword)}">×</button>
          </div>
        `).join('');
      }

      // Add delete button listeners
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const type = e.target.dataset.type;
          const value = e.target.dataset.value;
          if (type && value) {
            removeCustomPattern(type, value);
          }
        });
      });
    });
  } catch (error) {
    console.error('Error in loadCustomPatterns:', error);
  }
}

// Function to add a custom pattern
function addCustomPattern(type, value, callback) {
  try {
    if (!type || !value) return;
    
    chrome.storage.local.get(['customPatterns'], (result) => {
      const patterns = result.customPatterns || { domains: [], keywords: [] };
      
      if (!patterns[type].includes(value)) {
        patterns[type].push(value);
        chrome.storage.local.set({ customPatterns: patterns }, () => {
          // Notify background script to update patterns
          chrome.runtime.sendMessage({ action: 'updatePatterns', patterns });
          // Execute callback after storage is updated
          if (callback) callback();
        });
      } else {
        // If pattern already exists, still execute callback
        if (callback) callback();
      }
    });
  } catch (error) {
    console.error('Error in addCustomPattern:', error);
    // Execute callback even if there's an error
    if (callback) callback();
  }
}

// Function to remove a custom pattern
function removeCustomPattern(type, value) {
  try {
    if (!type || !value) return;
    
    chrome.storage.local.get(['customPatterns'], (result) => {
      const patterns = result.customPatterns || { domains: [], keywords: [] };
      patterns[type] = patterns[type].filter(item => item !== value);
      
      chrome.storage.local.set({ customPatterns: patterns }, () => {
        // Notify background script to update patterns
        chrome.runtime.sendMessage({ action: 'updatePatterns', patterns });
        // Immediately refresh the patterns list
        loadCustomPatterns();
      });
    });
  } catch (error) {
    console.error('Error in removeCustomPattern:', error);
  }
}

// Helper function to sanitize HTML
function sanitizeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
} 