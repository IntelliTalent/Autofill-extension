let formFilled = false;
let initialFormData = {};

// Function to detect and parse forms
function detectAndParseForms() {
  const forms = document.querySelectorAll('form');
  let formData = [];

  forms.forEach((form, index) => {
    let formFields = {};
    const inputs = form.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
      const name = input.name || input.id;
      formFields[name] = input.value || '';
    });

    formData.push({ form, formFields });
  });

  console.log('Detected forms:', formData);
  return formData;
}

// Function to fill the forms with data
function fillForms(formData, data) {
  formFilled = true;
  initialFormData = data;
  console.log('Filling forms with data:', data);
  formData.forEach((formObj, idx) => {
    const { form, formFields } = formObj;
    for (const key in formFields) {
      if (data[idx]['formFields'][key] !== undefined) {
        const input = form.querySelector(`[name="${key}"], [id="${key}"]`);
        if (input) {
          input.value = data[idx]['formFields'][key];
        }
      }
    }
  });
}

// Function to preview the form data without saving it
function previewForm(formData, data) {
  if (!formFilled) {
    formData.forEach((formObj, idx) => {
      const { form, formFields } = formObj;
      for (const key in formFields) {
        if (data[idx]['formFields'][key] !== undefined) {
          const input = form.querySelector(`[name="${key}"], [id="${key}"]`);
          if (input) {
            input.setAttribute('data-original-value', input.value);
            input.value = data[idx]['formFields'][key];
          }
        }
      }
    });
  }
}

// Function to remove the preview
function removePreview(formData) {
  if (!formFilled) {
    formData.forEach((formObj) => {
      const { form, formFields } = formObj;
      for (const key in formFields) {
        const input = form.querySelector(`[name="${key}"], [id="${key}"]`);
        if (input && input.hasAttribute('data-original-value')) {
          input.value = input.getAttribute('data-original-value');
          input.removeAttribute('data-original-value');
        }
      }
    });
  }
}

// Function to handle form submission
function handleFormSubmit(event) {
  event.preventDefault(); // Prevent default form submission
  const form = event.target;
  const formData = new FormData(form);
  let submittedData = {};

  formData.forEach((value, key) => {
    submittedData[key] = value;
  });

  chrome.storage.local.get(['formData'], (result) => {
    const initialData = result.formData;
    let changed = false;
    let updatedFields = {};

    initialData.forEach((formObj, idx) => {
      for (const key in formObj.formFields) {
        if (submittedData[key] && submittedData[key] !== formObj.formFields[key]) {
          changed = true;
          updatedFields[key] = submittedData[key];
        }
      }
    });

    if (changed) {
      chrome.storage.local.set({ updatedFields }, () => {
        chrome.runtime.sendMessage({ type: 'formChanged' }, () => {
          form.submit(); // Manually submit the form after processing
        });
      });
    } else {
      form.submit(); // Manually submit the form if no changes are detected
    }
  });
}

// Attach submit event listeners to forms
function attachFormSubmitListeners() {
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', handleFormSubmit);
  });
}

// Detect forms and send the field names to the background script
const formData = detectAndParseForms();
if (formData.length > 0) {
  chrome.runtime.sendMessage({ type: 'formDetected', formData });
  attachFormSubmitListeners();
}

// Listen for data from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'fillForm') {
    console.log('Received data:', message.data);
    fillForms(formData, message.data);
  } else if (message.type === 'previewForm') {
    console.log('Preview data:', message.data);
    previewForm(formData, message.data);
  } else if (message.type === 'removePreview') {
    removePreview(formData);
  }
});
