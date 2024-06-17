// background.js
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im1vaGFtZWRuYWJpbGFjLmNvbSIsImlkIjoiMzc...';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'formDetected') {
    const formData = message.formData;

    const fetchPromises = formData.map(form => {
      const fields = Object.keys(form.formFields).reduce((acc, field) => acc + `fields=${field}&`, '');
      console.log('Fields:', fields);

      // Send a request to the backend service to get the form data
      return fetch(`https://run.mocky.io/v3/15aceca3-aaf0-4c3b-81c5-213f385d5d08`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
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
      chrome.tabs.sendMessage(sender.tab.id, { type: 'fillForm', data: forms });
    });
  }
});
