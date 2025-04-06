let blockedUrls = [];
let deletionLog = [];
let sortStates = {
  domain: false,  // false for newest first (descending)
  keyword: false
};

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('History page loaded, retrieving data...');
  
  try {
    // Get data from session storage
    const historyDataString = sessionStorage.getItem('nsfwipe_history_data');
    console.log('Retrieved data string:', historyDataString);
    
    if (historyDataString) {
      const historyData = JSON.parse(historyDataString);
      console.log('Parsed history data:', historyData);
      
      blockedUrls = historyData.blockedUrls || [];
      deletionLog = historyData.deletionLog || [];
      
      console.log('Blocked URLs:', blockedUrls);
      console.log('Deletion Log:', deletionLog);
      
      // Clear the data from session storage
      sessionStorage.removeItem('nsfwipe_history_data');
      
      // Initialize the content
      initializeContent();
    } else {
      console.log('No history data found in session storage');
      // Fallback to chrome.storage if session storage is empty
      chrome.storage.local.get(['blockedUrls', 'deletionLog'], (result) => {
        console.log('Fallback: Retrieved data from chrome.storage:', result);
        blockedUrls = result.blockedUrls || [];
        deletionLog = result.deletionLog || [];
        initializeContent();
      });
    }
  } catch (error) {
    console.error('Error loading history data:', error);
    document.body.innerHTML = '<div class="error-message">Error loading history data. Please try again.</div>';
  }
});

// Initialize the content when data is received
function initializeContent() {
  try {
    console.log('Initializing content...');
    // Update stats first
    updateStats();
    
    // Then update history views
    updateHistoryViews();
    
    // Finally update deletion log
    const deletionLogContainer = document.getElementById('deletionLogContainer');
    if (deletionLogContainer) {
      deletionLogContainer.innerHTML = generateDeletionLogHTML(deletionLog);
    }
    
    // Set up event listeners
    setupEventListeners();
    console.log('Content initialization complete');
  } catch (error) {
    console.error('Error initializing content:', error);
  }
}

// Update statistics display
function updateStats() {
  const statsContainer = document.getElementById('statsContainer');
  if (!statsContainer) {
    console.error('Stats container not found');
    return;
  }

  const domainBlocks = blockedUrls.filter(site => site.type === 'domain').length;
  const keywordBlocks = blockedUrls.filter(site => site.type === 'keyword').length;

  statsContainer.innerHTML = `
    <strong>Total Sites Blocked:</strong> ${blockedUrls.length}<br>
    <strong>Domain-based Blocks:</strong> ${domainBlocks}<br>
    <strong>Keyword-based Blocks:</strong> ${keywordBlocks}
  `;
}

// Update history views
function updateHistoryViews() {
  try {
    const domainContainer = document.getElementById('domainHistoryContainer');
    const keywordContainer = document.getElementById('keywordHistoryContainer');

    if (!domainContainer || !keywordContainer) {
      console.error('History containers not found');
      return;
    }

    // Filter URLs by type
    const domainUrls = blockedUrls.filter(site => site.type === 'domain');
    const keywordUrls = blockedUrls.filter(site => site.type === 'keyword');

    // Sort URLs
    const sortedDomainUrls = sortUrls(domainUrls, sortStates.domain);
    const sortedKeywordUrls = sortUrls(keywordUrls, sortStates.keyword);

    // Update containers
    domainContainer.innerHTML = generateHistoryHTML(sortedDomainUrls);
    keywordContainer.innerHTML = generateHistoryHTML(sortedKeywordUrls);

    // Update sort buttons
    updateSortButtonState('domainSortToggle', sortStates.domain);
    updateSortButtonState('keywordSortToggle', sortStates.keyword);
  } catch (error) {
    console.error('Error updating history views:', error);
  }
}

// Sort URLs based on timestamp
function sortUrls(urls, ascending) {
  return [...urls].sort((a, b) => {
    try {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return ascending ? timeA - timeB : timeB - timeA;
    } catch (error) {
      console.error('Error sorting URLs:', error);
      return 0;
    }
  });
}

// Update sort button state
function updateSortButtonState(buttonId, ascending) {
  const button = document.getElementById(buttonId);
  if (!button) return;

  button.setAttribute('data-ascending', ascending.toString());
  const sortIcon = button.querySelector('.sort-icon');
  if (sortIcon) {
    sortIcon.textContent = ascending ? '⬆️' : '⬇️';
  }
}

// Generate HTML for history entries
function generateHistoryHTML(urls) {
  if (!urls || urls.length === 0) {
    return '<div class="empty-message">No history to display.</div>';
  }

  return urls.map(site => {
    try {
      const hostname = new URL(site.url).hostname;
      const timestamp = new Date(site.timestamp).toLocaleString();
      return `<div class="site">
        <div class="url">${site.url}</div>
        <div class="domain">${hostname}</div>
        <div class="timestamp">${timestamp}</div>
      </div>`;
    } catch (error) {
      console.error('Error generating history HTML:', error);
      return '';
    }
  }).join('');
}

// Generate HTML for deletion logs
function generateDeletionLogHTML(logs) {
  if (!logs || logs.length === 0) return '<div class="empty-message">No deletion logs available.</div>';
  
  const domainLogs = logs.filter(log => log.type === 'domain');
  const keywordLogs = logs.filter(log => log.type === 'keyword');
  const otherLogs = logs.filter(log => !log.type);
  
  return '<div class="log-section">' +
    '<h4>Domain-based Blocks (' + domainLogs.length + ')</h4>' +
    '<div class="log-category">' +
    (domainLogs.length ? domainLogs.map(log => generateLogEntry(log)).join('') : 
      '<div class="empty-message">No domain-based blocks.</div>') +
    '</div>' +
    
    '<h4>Keyword-based Blocks (' + keywordLogs.length + ')</h4>' +
    '<div class="log-category">' +
    (keywordLogs.length ? keywordLogs.map(log => generateLogEntry(log)).join('') : 
      '<div class="empty-message">No keyword-based blocks.</div>') +
    '</div>' +
    
    '<h4>Manual Actions (' + otherLogs.length + ')</h4>' +
    '<div class="log-category">' +
    (otherLogs.length ? otherLogs.map(log => generateLogEntry(log)).join('') : 
      '<div class="empty-message">No manual actions.</div>') +
    '</div>' +
    '</div>';
}

// Generate HTML for a single log entry
function generateLogEntry(log) {
  return '<div class="log-entry ' + (log.type || 'manual') + '">' +
    '<div class="log-action">' + log.action + '</div>' +
    (log.url ? '<div class="log-url">' + log.url + '</div>' : '') +
    '<div class="log-time">' + new Date(log.timestamp).toLocaleString() + '</div>' +
    '</div>';
}

// Delete a single site from history
function deleteSite(url) {
  if (confirm('Remove this URL from history?')) {
    chrome.storage.local.get(['blockedUrls', 'deletionLog'], (result) => {
      const currentBlockedUrls = result.blockedUrls || [];
      const currentDeletionLog = result.deletionLog || [];
      
      currentDeletionLog.push({
        url: url,
        action: 'Manually deleted from history',
        timestamp: new Date().toISOString()
      });
      
      const updatedUrls = currentBlockedUrls.filter(site => site.url !== url);
      
      chrome.storage.local.set({ 
        blockedUrls: updatedUrls,
        deletionLog: currentDeletionLog
      }, () => {
        blockedUrls = updatedUrls;
        deletionLog = currentDeletionLog;
        filterHistory(
          document.getElementById('searchBox').value.toLowerCase(),
          document.getElementById('timeFilter').value
        );
        updateStats();
      });
    });
  }
}

// Clear all history
function clearHistory() {
  if (confirm('Are you sure you want to clear the blocked sites history?')) {
    chrome.storage.local.get(['blockedUrls', 'deletionLog'], (result) => {
      const currentDeletionLog = result.deletionLog || [];
      
      currentDeletionLog.push({
        action: 'Cleared entire history (' + blockedUrls.length + ' entries)',
        timestamp: new Date().toISOString()
      });
      
      chrome.storage.local.set({ 
        blockedUrls: [],
        deletionLog: currentDeletionLog
      }, () => {
        blockedUrls = [];
        deletionLog = currentDeletionLog;
        document.getElementById('historyContainer').innerHTML = 
          '<div class="empty-message">History cleared.</div>';
        updateStats();
      });
    });
  }
}

// Export history to CSV
function exportHistory() {
  const csv = [
    ['URL', 'Domain', 'Timestamp'],
    ...blockedUrls.map(site => [
      site.url,
      new URL(site.url).hostname,
      new Date(site.timestamp).toLocaleString()
    ])
  ].map(row => row.join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'blocked-history.csv';
  a.click();
  window.URL.revokeObjectURL(url);
}

// Update the filterHistory function
function filterHistory(searchTerm, timeFilter) {
  updateHistoryViews();
}

// Set up all event listeners
function setupEventListeners() {
  try {
    // Domain sort toggle
    const domainSortBtn = document.getElementById('domainSortToggle');
    if (domainSortBtn) {
      domainSortBtn.addEventListener('click', () => {
        sortStates.domain = !sortStates.domain;
        updateHistoryViews();
      });
    }

    // Keyword sort toggle
    const keywordSortBtn = document.getElementById('keywordSortToggle');
    if (keywordSortBtn) {
      keywordSortBtn.addEventListener('click', () => {
        sortStates.keyword = !sortStates.keyword;
        updateHistoryViews();
      });
    }

    // Export and clear buttons
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportHistory);
    }

    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', clearHistory);
    }

    // Delete site buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-site')) {
        deleteSite(e.target.dataset.url);
      }
    });
  } catch (error) {
    console.error('Error setting up event listeners:', error);
  }
} 