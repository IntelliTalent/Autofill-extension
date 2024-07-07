// popup.js

document.addEventListener('DOMContentLoaded', () => {
  let formFilled = false;

  const autofillButton = document.getElementById('autofillButton');
  const statusDiv = document.getElementById('status');

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

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'autofillStatus') {
      statusDiv.innerText = message.status;
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
      <div class="password-container">
        <input type="password" id="password" name="password" placeholder="Password" required>
        <span class="toggle-password">👁️</span>
      </div>
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
          statusDiv.innerText = 'Sign-in failed.';
        }
      })
      .catch(error => {
        console.error('Error during sign-in:', error);
        statusDiv.innerText = 'Sign-in failed.';
      });
    });

    document.body.appendChild(signInForm);

    // Toggle password visibility
    const togglePassword = signInForm.querySelector('.toggle-password');
    const passwordInput = document.getElementById('password');

    togglePassword.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      togglePassword.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
    });
  }
});
