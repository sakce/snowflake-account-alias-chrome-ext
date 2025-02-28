// This script runs on the Snowflake login page

// Function to replace account names with aliases
function replaceAccountNames() {
  // First, handle the main account buttons
  const mainAccountButtons = Array.from(document.querySelectorAll('div[role="button"]'));
  const otherAccountsIndex = mainAccountButtons.findIndex(btn => 
    btn.textContent.trim().toLowerCase().includes('other accounts')
  );
  
  // If we found the "Other accounts" button, remove it from our buttons array
  const accountButtons = otherAccountsIndex >= 0 
    ? mainAccountButtons.slice(0, otherAccountsIndex) 
    : mainAccountButtons;
  
  // Check if dropdown options are present
  const dropdownOptions = Array.from(document.querySelectorAll('div[role="option"]'));
  
  // Combine both account sources
  const allAccountElements = [...accountButtons, ...dropdownOptions];
  
  if (allAccountElements.length === 0) return;
  
  // Get aliases from storage
  chrome.storage.sync.get('accountAliases', function(data) {
    const accountAliases = data.accountAliases || {};
    
    allAccountElements.forEach(element => {
      // Try different selectors to find the account name element
      let accountNameElement = null;
      
      // For main list items
      if (element.hasAttribute('role') && element.getAttribute('role') === 'button') {
        accountNameElement = element.querySelector('span[id^="__js"]');
      }
      // For dropdown items
      else if (element.hasAttribute('role') && element.getAttribute('role') === 'option') {
        // First look for a div with class that contains "ba" (as seen in screenshot)
        accountNameElement = element.querySelector('div[class*="ba"]');
        if (!accountNameElement) {
          // If not found, look for other elements that might contain the account name
          const possibleElements = element.querySelectorAll('div');
          for (const el of possibleElements) {
            if (el.textContent.trim()) {
              accountNameElement = el;
              break;
            }
          }
        }
      }
      
      if (accountNameElement) {
        // If we've already stored the original name, use that
        // Otherwise use the current text as the original name
        const originalName = accountNameElement.getAttribute('data-original-name') || accountNameElement.textContent.trim();
        
        // Always store the original name as a data attribute for reference
        if (!accountNameElement.hasAttribute('data-original-name')) {
          accountNameElement.setAttribute('data-original-name', originalName);
        }
        
        // Check if we have an alias for this account
        if (accountAliases[originalName]) {
          // Replace the text content with the alias
          // Preserve any existing styling by keeping the same element
          accountNameElement.textContent = accountAliases[originalName];
          
          // Make sure we don't lose any original styling that might affect text appearance
          // We don't want to change font, color, etc. - just the text itself
        }
      }
    });
  });
}

// Handler for expanding the "Other accounts" dropdown
function expandOtherAccounts() {
  const otherAccountsButton = Array.from(document.querySelectorAll('div[role="button"]'))
    .find(btn => btn.textContent.trim().toLowerCase().includes('other accounts'));
  
  if (otherAccountsButton) {
    otherAccountsButton.click();
    return true;
  }
  return false;
}

// Function to collect all account names from the page
function getAllAccountNames() {
  const accounts = [];
  
  // Get main account buttons
  const mainAccountButtons = Array.from(document.querySelectorAll('div[role="button"]'));
  const otherAccountsIndex = mainAccountButtons.findIndex(btn => 
    btn.textContent.trim().toLowerCase().includes('other accounts')
  );
  
  // If we found the "Other accounts" button, remove it from our buttons array
  const accountButtons = otherAccountsIndex >= 0 
    ? mainAccountButtons.slice(0, otherAccountsIndex) 
    : mainAccountButtons;
  
  // Process main account buttons
  accountButtons.forEach(button => {
    const nameElement = button.querySelector('span[id^="__js"]');
    if (nameElement) {
      const originalName = nameElement.getAttribute('data-original-name') || nameElement.textContent.trim();
      accounts.push(originalName);
    }
  });
  
  // Process dropdown options if present
  const dropdownOptions = Array.from(document.querySelectorAll('div[role="option"]'));
  dropdownOptions.forEach(option => {
    // Try to find the element with the account name
    let nameElement = option.querySelector('div[class*="ba"]');
    if (!nameElement) {
      // If not found, look for other elements with text
      const possibleElements = option.querySelectorAll('div');
      for (const el of possibleElements) {
        if (el.textContent.trim()) {
          nameElement = el;
          break;
        }
      }
    }
    
    if (nameElement) {
      const originalName = nameElement.getAttribute('data-original-name') || nameElement.textContent.trim();
      // Only add if not already in the list
      if (!accounts.includes(originalName)) {
        accounts.push(originalName);
      }
    }
  });
  
  return accounts;
}

// Initial replacement when page loads
setTimeout(replaceAccountNames, 1000);

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "getAccounts") {
    // Collect account names from the page
    const accounts = getAllAccountNames();
    
    // Check if "Other accounts" button exists
    const otherAccountsButton = Array.from(document.querySelectorAll('div[role="button"]'))
      .find(btn => btn.textContent.trim().toLowerCase().includes('other accounts'));
    
    sendResponse({
      accounts: accounts,
      hasOtherAccounts: !!otherAccountsButton
    });
  } else if (request.action === "refreshAliases") {
    // Re-apply aliases after user updates them
    replaceAccountNames();
    sendResponse({success: true});
  } else if (request.action === "expandOtherAccounts") {
    // Expand the "Other accounts" dropdown
    const success = expandOtherAccounts();
    
    if (success) {
      // Wait a moment for the dropdown to appear, then apply aliases to the new items
      setTimeout(() => {
        replaceAccountNames();
      }, 300);
      
      sendResponse({success: true});
    } else {
      sendResponse({success: false, message: "Other accounts button not found"});
    }
  }
  return true;
});

// Monitor for DOM changes to handle dynamic content loading
const observer = new MutationObserver(function(mutations) {
  let shouldReplace = false;
  
  for (const mutation of mutations) {
    // Check if nodes were added
    if (mutation.addedNodes.length > 0) {
      // Check if any of the added nodes are relevant to our functionality
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) { // Element node
          // Check if it's a dropdown option or contains one
          if (node.hasAttribute && node.hasAttribute('role') && node.getAttribute('role') === 'option') {
            shouldReplace = true;
            break;
          }
          // Check if it contains dropdown options
          if (node.querySelectorAll) {
            const options = node.querySelectorAll('div[role="option"]');
            if (options.length > 0) {
              shouldReplace = true;
              break;
            }
          }
        }
      }
    }
    
    if (shouldReplace) {
      break;
    }
  }
  
  if (shouldReplace) {
    // Wait a moment for the DOM to stabilize before applying aliases
    setTimeout(replaceAccountNames, 100);
  }
});

// Start observing
observer.observe(document.body, { childList: true, subtree: true });
