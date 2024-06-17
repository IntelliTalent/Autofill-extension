document.addEventListener('DOMContentLoaded', () => {
    let formFilled = false;
  
    document.getElementById('approve').addEventListener('mouseover', () => {
      if (!formFilled) {
        chrome.storage.local.get(['formData'], (result) => {
          if (result.formData) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              chrome.tabs.sendMessage(tabs[0].id, { type: 'previewForm', data: result.formData });
            });
          }
        });
      }
    });
  
    document.getElementById('approve').addEventListener('mouseout', () => {
      if (!formFilled) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'removePreview' });
        });
      }
    });
  
    document.getElementById('approve').addEventListener('click', () => {
      chrome.storage.local.get(['formData'], (result) => {
        if (result.formData) {
          formFilled = true;
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { type: 'fillForm', data: result.formData });
          });
        }
      });
    });
  
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'autofillStatus') {
        document.getElementById('status').innerText = message.status;
      }
    });
  });
  