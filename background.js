// background.js

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'formDetected') {
    chrome.storage.local.get(['token'], (result) => {
      const token = result.token;
      
      if (!token) {
        chrome.runtime.sendMessage({ type: 'showSignIn' });
        return;
      }

      const formData = message.formData;

      const fetchPromises = formData.map(form => {
        const fields = Object.keys(form.formFields).reduce((acc, field) => acc + `fields=${field}&`, '');
        console.log('Fields:', fields);

        // Send a request to the backend service to get the form data
        return fetch(`http://185.69.167.155:3000/api/v1/autofill?${fields}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
        .then(response => {
          if (response.status === 401) {
            chrome.runtime.sendMessage({ type: 'showSignIn' });
            throw new Error('Unauthorized');
          }
          return response.json();
        })
        .then(data => {
          console.log('Data:', data);
          return { form, formFields: data.formFields };
        })
        .catch(error => {
          console.error('Error:', error);
          return { form, formFields: {} };
        });
      });

      // Wait for all fetch calls to complete
      Promise.all(fetchPromises).then(forms => {
        // Store the fetched data in chrome storage for later use
        chrome.storage.sync.set({ formData: forms }, () => {
          console.log('Stored form data:', forms);
        });
      });
    });
  } else if (message.type === 'formChanged') {
    // Retrieve the updated fields from storage
    chrome.storage.sync.get(['updatedFields'], (result) => {
      chrome.storage.local.get(['token'], (tokenResult) => {
        const updatedFields = result.updatedFields;
        const token = tokenResult.token;
        const body = {
          data: updatedFields
        };

        console.log('data', body);

        // Send the updated fields to the backend service
        fetch('http://185.69.167.155:3000/api/v1/autofill', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(body)
        })
        .then(response => response.json())
        .then(data => {
          console.log('Updated successfully:', data);
        })
        .catch(error => {
          console.error('Error updating fields:', error);
        });
      });
    });
  }
});
