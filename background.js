// background.js - Activates the extension only on Snowflake domains

chrome.runtime.onInstalled.addListener(() => {
  // Use declarativeContent to activate the extension only on Snowflake sites
  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: {hostSuffix: 'snowflake.com'},
        }),
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: {hostSuffix: 'snowflakecomputing.com'},
        }),
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: {hostSuffix: 'app.snowflake.com'},
        })
      ],
      actions: [new chrome.declarativeContent.ShowAction()]
    }]);
  });
});
