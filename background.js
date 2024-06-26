const token = 'your-token-here';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'formDetected') {
    const formData = message.formData;

    const fetchPromises = formData.map(form => {
      const fields = Object.keys(form.formFields).reduce((acc, field) => acc + `fields=${field}&`, '');
      console.log('Fields:', fields);

      // Send a request to the backend service to get the form data
      return fetch(`http://185.69.167.159:3000/autofill?${fields}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => response.json())
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
      chrome.storage.local.set({ formData: forms }, () => {
        console.log('Stored form data:', forms);
      });
    });
  } else if (message.type === 'formChanged') {
    // Retrieve the updated fields from storage
    chrome.storage.local.get(['updatedFields'], (result) => {
      const updatedFields = result.updatedFields;
      const body = {
        data: updatedFields
      };

      // Send the updated fields to the backend service
      fetch('https://run.mocky.io/v3/15aceca3-aaf0-4c3b-81c5-213f385d5d08', {
        method: 'POST',
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
  }
});
