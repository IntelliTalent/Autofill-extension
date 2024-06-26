document.addEventListener('DOMContentLoaded', () => {
  let formFilled = false;

  const autofillButton = document.getElementById('autofillButton');
  const statusDiv = document.getElementById('status');
  const updateButton = document.getElementById('update');

  autofillButton.addEventListener('mouseover', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'startDetection' });
    });
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

  autofillButton.addEventListener('mouseout', () => {
    if (!formFilled) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'removePreview' });
      });
    }
  });

  autofillButton.addEventListener('click', () => {
    chrome.storage.local.get(['formData'], (result) => {
      if (result.formData) {
        formFilled = true;
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'fillForm', data: result.formData });
        });
      }
    });
  });

  updateButton.addEventListener('click', () => {
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
          statusDiv.innerText = 'Form fields updated successfully.';
        })
        .catch(error => {
          console.error('Error updating form fields:', error);
          statusDiv.innerText = 'Error updating form fields.';
        });
      }
    });
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'autofillStatus') {
      statusDiv.innerText = message.status;
    } else if (message.type === 'formChanged') {
      updateButton.style.display = 'block';
    } else if (message.type === 'showSignIn') {
      showSignInButton();
    }
  });

  function showSignInButton() {
    autofillButton.style.display = 'none'; // Hide the autofill button

    const signInButton = document.createElement('button');
    signInButton.innerText = 'Sign In';
    signInButton.style.width = '100%';
    signInButton.style.padding = '10px';
    signInButton.style.margin = '10px 0';
    signInButton.style.backgroundColor = '#4CAF50';
    signInButton.style.color = 'white';
    signInButton.style.border = 'none';
    signInButton.style.cursor = 'pointer';

    signInButton.addEventListener('click', () => {
      window.location.href = 'https://your-login-page-url';
    });

    document.body.appendChild(signInButton);
  }
});
