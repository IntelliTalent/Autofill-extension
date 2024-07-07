// popup.js

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
      chrome.storage.sync.get(['formData'], (result) => {
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
    chrome.storage.sync.get(['formData'], (result) => {
      if (result.formData) {
        formFilled = true;
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'fillForm', data: result.formData });
        });
      }
    });
  });

  updateButton.addEventListener('click', () => {
    chrome.storage.sync.get(['updatedFields'], (result) => {
      if (result.updatedFields) {
        chrome.storage.local.get(['token'], (tokenResult) => {
          const token = tokenResult.token;
          fetch('http://185.69.167.155:3000/api/v1/autofill', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
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
      showSignInForm();
    }
  });

  function showSignInForm() {
    autofillButton.style.display = 'none'; // Hide the autofill button

    const signInForm = document.createElement('form');
    signInForm.className = 'form-group';
    signInForm.innerHTML = `
      <input type="email" id="email" name="email" placeholder="Email" required>
      <input type="password" id="password" name="password" placeholder="Password" required>
      <input type="submit" value="Sign In">
    `;
    signInForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      fetch('http://185.69.167.155:3000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })
      .then(response => response.json())
      .then(data => {
        if (data.token) {
          chrome.storage.local.set({ token: data.token }, () => {
            statusDiv.innerText = 'Signed in successfully.';
            signInForm.remove();
            autofillButton.style.display = 'block'; // Show the autofill button again
          });
        } else {
          statusDiv.innerText = 'invalid email or password.';
        }
      })
      .catch(error => {
        console.error('Error during sign-in:', error);
        statusDiv.innerText = 'invalid email or password.';
      });
    });

    document.body.appendChild(signInForm);
  }
});
