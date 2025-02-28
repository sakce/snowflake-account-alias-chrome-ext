document.addEventListener('DOMContentLoaded', function() {
  const accountsContainer = document.getElementById('accounts-container');
  const saveButton = document.getElementById('save-button');
  const statusDiv = document.getElementById('status');
  
  let currentAccounts = [];
  let currentAliases = {};
  let expanded = false;
  
  // Get current tab
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    
    // Check if we're on Snowflake
    if (currentTab.url.includes('snowflake.com')) {
      // Get account names from the page
      chrome.tabs.sendMessage(currentTab.id, {action: "getAccounts"}, function(response) {
        if (response && response.accounts && response.accounts.length > 0) {
          currentAccounts = response.accounts;
          
          // Get existing aliases
          chrome.storage.sync.get('accountAliases', function(data) {
            currentAliases = data.accountAliases || {};
            
            // Clear container
            accountsContainer.innerHTML = '';
            
            // If "Other accounts" dropdown is available, show a button to expand it
            if (response.hasOtherAccounts) {
              const expandButton = document.createElement('button');
              expandButton.className = 'action-button';
              expandButton.textContent = 'Show More Accounts';
              expandButton.addEventListener('click', function() {
                // Disable button while waiting for response
                expandButton.disabled = true;
                expandButton.textContent = 'Loading...';
                
                chrome.tabs.sendMessage(currentTab.id, {action: "expandOtherAccounts"}, function(expandResponse) {
                  if (expandResponse && expandResponse.success) {
                    // Wait a moment for the dropdown to appear and be processed
                    setTimeout(() => {
                      // Re-fetch all accounts
                      chrome.tabs.sendMessage(currentTab.id, {action: "getAccounts"}, function(newResponse) {
                        if (newResponse && newResponse.accounts) {
                          currentAccounts = newResponse.accounts;
                          expanded = true;
                          
                          // Update button to show it's done
                          expandButton.textContent = '✓ Additional Accounts Loaded';
                          expandButton.style.backgroundColor = '#34a853';
                          
                          // Re-render account list
                          renderAccountList();
                        }
                      });
                    }, 500);
                  } else {
                    // If expansion failed, re-enable button
                    expandButton.disabled = false;
                    expandButton.textContent = 'Show More Accounts';
                  }
                });
              });
              
              accountsContainer.appendChild(expandButton);
            }
            
            // Render the account list
            renderAccountList();
          });
        }
      });
    }
  });
  
  // Function to render the account list
  function renderAccountList() {
    // Remove all account items (but keep the expand button if it exists)
    const expandButton = accountsContainer.querySelector('.action-button');
    const fragment = document.createDocumentFragment();
    
    if (expandButton) {
      fragment.appendChild(expandButton);
    }
    
    // Make sure save button is visible
    saveButton.style.display = 'block';
    
    // Create UI for each account
    currentAccounts.forEach(account => {
      const accountItem = document.createElement('div');
      accountItem.className = 'account-item';
      
      const originalName = document.createElement('div');
      originalName.className = 'account-name';
      // Display the account ID (this is the key for aliases)
      originalName.textContent = account;
      accountItem.appendChild(originalName);
      
      const aliasInput = document.createElement('input');
      aliasInput.type = 'text';
      aliasInput.placeholder = 'Enter friendly name';
      aliasInput.value = currentAliases[account] || '';
      aliasInput.dataset.account = account;
      accountItem.appendChild(aliasInput);
      
      // Add a note if this account has been aliased
      if (currentAliases[account]) {
        const aliasNote = document.createElement('div');
        aliasNote.className = 'alias-note';
        aliasNote.textContent = 'Currently displayed as: ' + currentAliases[account];
        accountItem.appendChild(aliasNote);
      }
      
      fragment.appendChild(accountItem);
    });
    
    // Replace content
    accountsContainer.innerHTML = '';
    accountsContainer.appendChild(fragment);
  }
  
  // Save button handler
  saveButton.addEventListener('click', function() {
    const aliasInputs = document.querySelectorAll('input[data-account]');
    const newAliases = {};
    
    aliasInputs.forEach(input => {
      const account = input.dataset.account;
      const alias = input.value.trim();
      
      if (alias) {
        newAliases[account] = alias;
      }
    });
    
    // Save aliases to storage
    chrome.storage.sync.set({accountAliases: newAliases}, function() {
      // Notify content script to refresh aliases
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "refreshAliases"}, function(response) {
          statusDiv.textContent = 'Aliases saved and applied!';
          
          // Update current aliases
          currentAliases = newAliases;
          
          // Re-render to show the "Currently displayed as" notes
          renderAccountList();
          
          setTimeout(() => {
            statusDiv.textContent = '';
          }, 2000);
        });
      });
    });
  });
});