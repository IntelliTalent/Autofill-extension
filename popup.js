document.addEventListener('DOMContentLoaded', () => {
    let formFilled = false;

    document.getElementById('startDetection').addEventListener('click', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'startDetection' });
      });
    });

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
  
    document.getElementById('update').addEventListener('click', () => {
      chrome.storage.local.get(['updatedFields'], (result) => {
        if (result.updatedFields) {
          fetch('https://your-backend-endpoint', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer your-token-here`
            },
            body: JSON.stringify({ data: result.updatedFields })
          })
          .then(response => response.json())
          .then(data => {
            console.log('Update response:', data);
            document.getElementById('status').innerText = 'Form fields updated successfully.';
          })
          .catch(error => {
            console.error('Error updating form fields:', error);
            document.getElementById('status').innerText = 'Error updating form fields.';
          });
        }
      });
    });
  
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'autofillStatus') {
        document.getElementById('status').innerText = message.status;
      } else if (message.type === 'formChanged') {
        document.getElementById('update').style.display = 'block';
      }
    });
  });
  