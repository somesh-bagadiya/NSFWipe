// Cross-browser compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Built-in NSFW patterns dataset
const defaultPatterns = {
  domains: [
    // Adult content sites - core set
    /pornhub\.com/i,
    /xvideos\.com/i,
    /xhamster\.com/i,
    /onlyfans\.com/i,
    /chaturbate\.com/i,
    /youporn\.com/i,
    /redtube\.com/i,
    /xnxx\.com/i,
    /brazzers\.(com|net|org)/i,  // Match multiple TLDs
    /pornktub\.com/i,
    // Image hosting with NSFW content
    /rule34\.xxx/i
  ],
  keywords: [
    // Essential adult terms
    /porn/i,
    /hentai/i,
    /xxx/i,
    /sex/i,
    /nude/i,
    /naked/i,
    /nsfw/i,
    /escort/i,
    /stripper/i,
    /brazzers/i,
    /pornktub/i,
    /playboy/i,
    /playgirl/i,
    /hustler/i,
    /dildo/i,
    /vibrator/i,
    /sexshop/i,
    // Basic content descriptors
    /webcam.*adult/i,
    /adult.*video/i,
    /adult.*content/i,
    // Additional patterns for better matching
    /brazzers.*porn/i,
    /brazzers.*xxx/i,
    /brazzers.*video/i,
    /brazzers.*hd/i
  ]
};

// Current patterns including custom ones
let nsfwPatterns = { ...defaultPatterns };

// Load custom patterns
browserAPI.storage.local.get(['customPatterns'], (result) => {
  const customPatterns = result.customPatterns || { domains: [], keywords: [] };
  updatePatternsFromCustom(customPatterns);
});

// Listen for pattern updates from popup
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updatePatterns') {
    updatePatternsFromCustom(message.patterns);
  }
});

// Function to update patterns with custom ones
function updatePatternsFromCustom(customPatterns) {
  nsfwPatterns = {
    domains: [
      ...defaultPatterns.domains,
      ...customPatterns.domains.map(d => new RegExp(escapeRegExp(d), 'i'))
    ],
    keywords: [
      ...defaultPatterns.keywords,
      ...customPatterns.keywords.map(k => new RegExp(escapeRegExp(k), 'i'))
    ]
  };
}

// Helper function to escape regex special characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Function to check if a URL is NSFW
function isNSFW(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const fullUrl = url.toLowerCase();
    const decodedUrl = decodeURIComponent(fullUrl);
    const title = urlObj.hash || ''; // Include hash for better matching
    
    // Check against domain patterns
    const domainMatch = nsfwPatterns.domains.find(pattern => pattern.test(hostname));
    if (domainMatch) {
      return { isNsfw: true, type: 'domain', pattern: hostname };
    }
    
    // Special handling for search engines and common sites
    if (hostname.includes('google.com') || hostname.includes('bing.com') || hostname.includes('yahoo.com')) {
      const searchParams = urlObj.searchParams;
      const query = searchParams.get('q') || searchParams.get('p') || searchParams.get('text') || '';
      const keywordMatch = nsfwPatterns.keywords.find(keyword => keyword.test(query));
      if (keywordMatch) {
        return { isNsfw: true, type: 'keyword', pattern: keywordMatch.source };
      }
    }
    
    // Check title/query parameters for NSFW content
    const queryString = urlObj.search.toLowerCase() + title.toLowerCase();
    const queryMatch = nsfwPatterns.keywords.find(keyword => 
      keyword.test(queryString) || keyword.test(decodedUrl)
    );
    if (queryMatch) {
      return { isNsfw: true, type: 'keyword', pattern: queryMatch.source };
    }
    
    // Check path segments for NSFW content
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);
    for (const segment of pathSegments) {
      const decodedSegment = decodeURIComponent(segment.toLowerCase());
      const pathMatch = nsfwPatterns.keywords.find(keyword => keyword.test(decodedSegment));
      if (pathMatch) {
        return { isNsfw: true, type: 'keyword', pattern: pathMatch.source };
      }
    }
    
    return { isNsfw: false };
  } catch (e) {
    console.error('Error checking URL:', e);
    return { isNsfw: false };
  }
}

// Function to clean up search suggestions
function cleanupSearchSuggestions() {
  browserAPI.history.search({text: '', maxResults: 1000}, function(items) {
    items.forEach(item => {
      if (isNSFW(item.url).isNsfw) {
        browserAPI.history.deleteUrl({ url: item.url });
      }
    });
  });
}

// Listen for extension installation
browserAPI.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('First installation - starting history scan');
    await performInitialHistoryScan();
  }
});

// Perform initial history scan
async function performInitialHistoryScan() {
  try {
    // Get all history items
    const historyItems = await browserAPI.history.search({
      text: '',
      startTime: 0,
      maxResults: 100000
    });

    console.log(`Scanning ${historyItems.length} history items`);
    
    let removedCount = 0;
    const removedUrls = [];
    const timestamp = new Date().toISOString();

    // Process each history item
    for (const item of historyItems) {
      const nsfwResult = isNSFW(item.url);
      if (nsfwResult.isNsfw) {
        // Remove from history
        await browserAPI.history.deleteUrl({ url: item.url });
        removedUrls.push({
          url: item.url,
          type: nsfwResult.type,
          pattern: nsfwResult.pattern,
          timestamp: timestamp
        });
        removedCount++;
      }
    }

    // Update our logs
    await updateDeletionLogs(removedUrls, removedCount);
    
    console.log(`Initial scan complete. Removed ${removedCount} items.`);
  } catch (error) {
    console.error('Error during initial history scan:', error);
  }
}

// Monitor history changes and remove NSFW entries
browserAPI.history.onVisited.addListener((historyItem) => {
  console.log('History item visited:', historyItem.url);
  const nsfwResult = isNSFW(historyItem.url);
  console.log('NSFW check result:', nsfwResult);
  
  if (nsfwResult.isNsfw) {
    console.log('NSFW content detected, removing from history');
    // Remove the NSFW history entry
    browserAPI.history.deleteUrl({ url: historyItem.url });
    
    // Store in private list with pattern type
    browserAPI.storage.local.get(['blockedUrls'], (result) => {
      console.log('Current blocked URLs:', result.blockedUrls);
      const blockedUrls = result.blockedUrls || [];
      const newEntry = {
        url: historyItem.url,
        timestamp: new Date().toISOString(),
        type: nsfwResult.type,
        pattern: nsfwResult.pattern
      };
      console.log('Adding new blocked URL:', newEntry);
      
      blockedUrls.push(newEntry);
      // Keep only last 100 entries to prevent storage bloat
      if (blockedUrls.length > 100) {
        blockedUrls.splice(0, blockedUrls.length - 100);
      }
      browserAPI.storage.local.set({ blockedUrls }, () => {
        if (browserAPI.runtime.lastError) {
          console.error('Error saving blocked URLs:', browserAPI.runtime.lastError);
        } else {
          console.log('Successfully saved blocked URLs');
        }
      });
    });
    
    // Add to deletion log with pattern type
    browserAPI.storage.local.get(['deletionLog'], (data) => {
      console.log('Current deletion log:', data.deletionLog);
      const deletionLog = data.deletionLog || [];
      const logEntry = {
        url: historyItem.url,
        action: `Automatically blocked (${nsfwResult.type} pattern: ${nsfwResult.pattern})`,
        timestamp: new Date().toISOString(),
        type: nsfwResult.type
      };
      console.log('Adding new log entry:', logEntry);
      
      deletionLog.push(logEntry);
      browserAPI.storage.local.set({ deletionLog }, () => {
        if (browserAPI.runtime.lastError) {
          console.error('Error saving deletion log:', browserAPI.runtime.lastError);
        } else {
          console.log('Successfully saved deletion log');
        }
      });
    });
    
    // Clean up related search suggestions
    cleanupSearchSuggestions();
  }
});

// Remove NSFW entries from omnibox suggestions
browserAPI.history.onVisitRemoved.addListener((removed) => {
  if (removed.allHistory) {
    return; // Don't interfere with clearing all history
  }
  
  removed.urls.forEach(url => {
    if (isNSFW(url).isNsfw) {
      // Additional cleanup for suggestions
      browserAPI.history.deleteUrl({ url: url });
    }
  });
});

// Update deletion logs
async function updateDeletionLogs(removedUrls, totalCount) {
  try {
    // Get current logs
    const result = await browserAPI.storage.local.get(['blockedUrls', 'deletionLog']);
    const currentBlockedUrls = result.blockedUrls || [];
    const currentDeletionLog = result.deletionLog || [];

    // Add removed URLs to blocked URLs
    const updatedBlockedUrls = [...currentBlockedUrls, ...removedUrls];

    // Add summary to deletion log
    const logEntry = {
      action: `Initial scan removed ${totalCount} NSFW items`,
      timestamp: new Date().toISOString(),
      type: 'system'
    };

    // Update storage
    await browserAPI.storage.local.set({
      blockedUrls: updatedBlockedUrls,
      deletionLog: [...currentDeletionLog, logEntry]
    });
  } catch (error) {
    console.error('Error updating deletion logs:', error);
  }
} 