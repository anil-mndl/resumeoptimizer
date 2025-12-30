// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'init_optimizer') {
    openModal(request.selectionText);
  }
});

let modalOverlay = null;
let promptLookup = {}; // Map to store full prompt text by value

function createModal() {
  // Create overlay
  modalOverlay = document.createElement('div');
  modalOverlay.className = 'resume-optimizer-modal-overlay';

  // Close when clicking outside
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });

  // Create modal container
  const modal = document.createElement('div');
  modal.className = 'resume-optimizer-modal';

  // Header
  const header = document.createElement('div');
  header.className = 'resume-optimizer-modal-header';

  const title = document.createElement('h2');
  title.className = 'resume-optimizer-modal-title';
  title.textContent = 'Job Application Optimizer';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'resume-optimizer-close-btn';
  closeBtn.innerHTML = '&times;';
  closeBtn.addEventListener('click', closeModal);

  header.appendChild(title);
  header.appendChild(closeBtn);

  // Body
  const body = document.createElement('div');
  body.className = 'resume-optimizer-modal-body';

  // Prompt Select
  const promptGroup = document.createElement('div');
  promptGroup.className = 'resume-optimizer-form-group';

  const promptLabel = document.createElement('label');
  promptLabel.className = 'resume-optimizer-label';
  promptLabel.textContent = 'Select Prompt';

  const promptSelect = document.createElement('select');
  promptSelect.id = 'resume-optimizer-prompt-select';
  promptSelect.className = 'resume-optimizer-select';

  promptGroup.appendChild(promptLabel);
  promptGroup.appendChild(promptSelect);

  // Custom Prompt
  const customPromptGroup = document.createElement('div');
  customPromptGroup.className = 'resume-optimizer-form-group';

  const customPromptLabel = document.createElement('label');
  customPromptLabel.className = 'resume-optimizer-label';
  customPromptLabel.textContent = 'Or Create Custom Prompt';

  const customPromptInput = document.createElement('textarea');
  customPromptInput.id = 'resume-optimizer-custom-prompt';
  customPromptInput.className = 'resume-optimizer-textarea';
  customPromptInput.rows = 2;
  customPromptInput.style.minHeight = '60px';

  customPromptGroup.appendChild(customPromptLabel);
  customPromptGroup.appendChild(customPromptInput);

  // Text Area
  const textGroup = document.createElement('div');
  textGroup.className = 'resume-optimizer-form-group';

  const textLabel = document.createElement('label');
  textLabel.className = 'resume-optimizer-label';
  textLabel.textContent = 'Selected Text';

  const textArea = document.createElement('textarea');
  textArea.id = 'resume-optimizer-text-area';
  textArea.className = 'resume-optimizer-textarea';

  textGroup.appendChild(textLabel);
  textGroup.appendChild(textArea);

  // Resume Display (Hidden by default)
  const resumeGroup = document.createElement('div');
  resumeGroup.className = 'resume-optimizer-form-group';
  resumeGroup.id = 'resume-optimizer-resume-group';
  resumeGroup.style.display = 'none';

  const resumeLabel = document.createElement('label');
  resumeLabel.className = 'resume-optimizer-label';
  resumeLabel.textContent = 'Current Resume';

  const resumeArea = document.createElement('textarea');
  resumeArea.id = 'resume-optimizer-resume-area';
  resumeArea.className = 'resume-optimizer-textarea';
  resumeArea.readOnly = true;

  resumeGroup.appendChild(resumeLabel);
  resumeGroup.appendChild(resumeArea);

  // Response Display (Hidden by default until submit)
  const responseGroup = document.createElement('div');
  responseGroup.className = 'resume-optimizer-form-group';
  responseGroup.id = 'resume-optimizer-response-group';
  responseGroup.style.display = 'none';

  const responseLabel = document.createElement('label');
  responseLabel.className = 'resume-optimizer-label';
  responseLabel.textContent = 'Response';

  const responseArea = document.createElement('div');
  responseArea.id = 'resume-optimizer-response-area';
  responseArea.className = 'resume-optimizer-textarea';
  responseArea.style.backgroundColor = '#f4f4f4';
  responseArea.style.overflowY = 'auto';
  responseArea.style.whiteSpace = 'pre-wrap';
  responseArea.style.maxHeight = '300px';

  const updateResumeBtn = document.createElement('button');
  updateResumeBtn.id = 'resume-optimizer-update-resume-btn';
  updateResumeBtn.className = 'resume-optimizer-secondary-btn';
  updateResumeBtn.textContent = 'Update My Resume';
  updateResumeBtn.style.display = 'none';
  updateResumeBtn.style.marginTop = '10px';
  updateResumeBtn.addEventListener('click', handleUpdateResumeClick);

  responseGroup.appendChild(responseLabel);
  responseGroup.appendChild(responseArea);
  responseGroup.appendChild(updateResumeBtn);

  // Updated Resume Group (Hidden by default)
  const updatedResumeGroup = document.createElement('div');
  updatedResumeGroup.className = 'resume-optimizer-form-group';
  updatedResumeGroup.id = 'resume-optimizer-updated-resume-group';
  updatedResumeGroup.style.display = 'none';

  const updatedResumeLabel = document.createElement('label');
  updatedResumeLabel.className = 'resume-optimizer-label';
  updatedResumeLabel.textContent = 'Updated Resume';

  // Content area for Updated Resume (Display Mode - HTML)
  const updatedResumeDisplay = document.createElement('div');
  updatedResumeDisplay.id = 'resume-optimizer-updated-resume-display';
  updatedResumeDisplay.className = 'resume-optimizer-textarea';
  updatedResumeDisplay.style.backgroundColor = '#f4f4f4';
  updatedResumeDisplay.style.overflowY = 'auto';
  updatedResumeDisplay.style.display = 'block';
  updatedResumeDisplay.style.maxHeight = '400px';

  // Content area for Updated Resume (Edit Mode - Textarea)
  const updatedResumeEdit = document.createElement('textarea');
  updatedResumeEdit.id = 'resume-optimizer-updated-resume-edit';
  updatedResumeEdit.className = 'resume-optimizer-textarea';
  updatedResumeEdit.style.display = 'none';
  updatedResumeEdit.style.maxHeight = '400px';

  // Action Buttons container for Updated Resume
  const updatedResumeActions = document.createElement('div');
  updatedResumeActions.style.marginTop = '10px';
  updatedResumeActions.style.display = 'flex';
  updatedResumeActions.style.gap = '10px';

  const editResumeBtn = document.createElement('button');
  editResumeBtn.id = 'resume-optimizer-edit-resume-btn';
  editResumeBtn.className = 'resume-optimizer-secondary-btn';
  editResumeBtn.textContent = 'Edit';
  editResumeBtn.style.display = 'none'; // Hidden until generation complete
  editResumeBtn.addEventListener('click', handleEditResume);

  const doneEditingBtn = document.createElement('button');
  doneEditingBtn.id = 'resume-optimizer-done-editing-btn';
  doneEditingBtn.className = 'resume-optimizer-secondary-btn';
  doneEditingBtn.textContent = 'Done Editing';
  doneEditingBtn.style.display = 'none';
  doneEditingBtn.addEventListener('click', handleDoneEditing);

  const downloadPdfBtn = document.createElement('button');
  downloadPdfBtn.id = 'resume-optimizer-download-pdf-btn';
  downloadPdfBtn.className = 'resume-optimizer-secondary-btn';
  downloadPdfBtn.textContent = 'Download PDF';
  downloadPdfBtn.style.display = 'none'; // Hidden until generation complete
  downloadPdfBtn.addEventListener('click', handleDownloadPDF);

  updatedResumeActions.appendChild(editResumeBtn);
  updatedResumeActions.appendChild(doneEditingBtn);
  updatedResumeActions.appendChild(downloadPdfBtn);

  updatedResumeGroup.appendChild(updatedResumeLabel);
  updatedResumeGroup.appendChild(updatedResumeDisplay);
  updatedResumeGroup.appendChild(updatedResumeEdit);
  updatedResumeGroup.appendChild(updatedResumeActions);

  body.appendChild(promptGroup);
  body.appendChild(customPromptGroup);
  body.appendChild(textGroup);
  body.appendChild(resumeGroup);
  body.appendChild(responseGroup);
  body.appendChild(updatedResumeGroup);

  // Footer
  const footer = document.createElement('div');
  footer.className = 'resume-optimizer-modal-footer';

  const viewResumeBtn = document.createElement('button');
  viewResumeBtn.className = 'resume-optimizer-secondary-btn';
  viewResumeBtn.textContent = 'View Resume';
  viewResumeBtn.addEventListener('click', toggleResume);

  const submitBtn = document.createElement('button');
  submitBtn.className = 'resume-optimizer-submit-btn';
  submitBtn.textContent = 'Submit';
  submitBtn.addEventListener('click', handleSubmit);

  footer.appendChild(viewResumeBtn);
  footer.appendChild(submitBtn);

  // Assemble
  modal.appendChild(header);
  modal.appendChild(body);
  modal.appendChild(footer);
  modalOverlay.appendChild(modal);

  document.body.appendChild(modalOverlay);
}

function openModal(selectionText) {
  if (!modalOverlay) {
    createModal();
  }

  // Populate Text Area
  const textArea = document.getElementById('resume-optimizer-text-area');
  textArea.value = selectionText || '';

  // Clear Custom Prompt
  const customPromptInput = document.getElementById('resume-optimizer-custom-prompt');
  customPromptInput.value = '';

  // Hide Resume
  const resumeGroup = document.getElementById('resume-optimizer-resume-group');
  resumeGroup.style.display = 'none';

  // Hide/Clear Response
  const responseGroup = document.getElementById('resume-optimizer-response-group');
  responseGroup.style.display = 'none';
  const responseArea = document.getElementById('resume-optimizer-response-area');
  responseArea.textContent = '';

  // Populate Prompts
  const promptSelect = document.getElementById('resume-optimizer-prompt-select');
  promptSelect.innerHTML = '<option value="">-- Select a Prompt --</option>'; // Reset
  promptLookup = {}; // Reset lookup

  // Load In-Built Prompts
  if (typeof DEFAULT_PROMPTS !== 'undefined') {
    DEFAULT_PROMPTS.forEach((item, index) => {
      const id = `builtin_${index}`;
      promptLookup[id] = item.prompt;

      const option = document.createElement('option');
      option.value = id;
      option.textContent = `[in-built] ${item.description}`;
      promptSelect.appendChild(option);
    });
  }

  // Load User Prompts
  chrome.storage.local.get(['prompts'], (result) => {
    const prompts = result.prompts || [];
    prompts.forEach(prompt => {
      const id = prompt.id.toString(); // Ensure ID is string
      promptLookup[id] = prompt.text;

      let label = prompt.text;
      if (label.length > 30) {
        label = label.substring(0, 30) + '...';
      }

      const option = document.createElement('option');
      option.value = id;
      option.textContent = label;
      promptSelect.appendChild(option);
    });
  });

  modalOverlay.style.display = 'flex';
}

function closeModal() {
  if (modalOverlay) {
    modalOverlay.style.display = 'none';
  }
}

function handleSubmit() {
  const promptSelect = document.getElementById('resume-optimizer-prompt-select');
  const customPromptInput = document.getElementById('resume-optimizer-custom-prompt');
  const textArea = document.getElementById('resume-optimizer-text-area');
  const responseGroup = document.getElementById('resume-optimizer-response-group');
  const responseArea = document.getElementById('resume-optimizer-response-area');
  const submitBtn = document.querySelector('.resume-optimizer-submit-btn');

  let selectedPrompt = '';
  // Check custom prompt first, then dropdown
  if (customPromptInput.value.trim()) {
    selectedPrompt = customPromptInput.value.trim();
  } else if (promptSelect.value) {
    // Look up the full prompt text using the value
    selectedPrompt = promptLookup[promptSelect.value] || '';
  }

  if (!selectedPrompt) {
    alert('Please select a prompt or enter a custom one.');
    return;
  }

  const selectionText = textArea.value;

  // Show loading state
  responseGroup.style.display = 'flex';
  responseArea.textContent = 'Generating response...';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Processing...';

  chrome.storage.local.get(['resume'], (result) => {
    const resume = result.resume || '';

    // Clear response area for streaming
    responseArea.textContent = '';
    responseArea.style.whiteSpace = 'pre-wrap'; // Reset for streaming

    // Hide update button and updated resume area if re-submitting
    const updateResumeBtn = document.getElementById('resume-optimizer-update-resume-btn');
    if (updateResumeBtn) updateResumeBtn.style.display = 'none';
    const updatedResumeGroup = document.getElementById('resume-optimizer-updated-resume-group');
    if (updatedResumeGroup) updatedResumeGroup.style.display = 'none';

    chrome.runtime.sendMessage({
      action: 'generate_response',
      prompt: selectedPrompt,
      content: selectionText,
      resume: resume,
      outputTarget: 'response-area'
    });
  });
}

function handleUpdateResumeClick() {
  const updateResumeBtn = document.getElementById('resume-optimizer-update-resume-btn');
  const updatedResumeGroup = document.getElementById('resume-optimizer-updated-resume-group');
  const responseArea = document.getElementById('resume-optimizer-response-area');
  const resumeArea = document.getElementById('resume-optimizer-resume-area');
  const updatedResumeDisplay = document.getElementById('resume-optimizer-updated-resume-display');
  const updatedResumeEdit = document.getElementById('resume-optimizer-updated-resume-edit');

  if (updateResumeBtn) updateResumeBtn.style.display = 'none';
  if (updatedResumeGroup) updatedResumeGroup.style.display = 'flex';

  // Prepare UI for streaming
  if (updatedResumeDisplay) {
    updatedResumeDisplay.textContent = 'Generating updated resume...';
    updatedResumeDisplay.style.whiteSpace = 'pre-wrap';
    updatedResumeDisplay.style.display = 'block';
  }
  if (updatedResumeEdit) {
    updatedResumeEdit.value = '';
    updatedResumeEdit.style.display = 'none';
  }

  // Hide action buttons during generation
  document.getElementById('resume-optimizer-edit-resume-btn').style.display = 'none';
  document.getElementById('resume-optimizer-done-editing-btn').style.display = 'none';
  document.getElementById('resume-optimizer-download-pdf-btn').style.display = 'none';

  const suggestions = responseArea ? responseArea.innerText : '';
  const currentResume = resumeArea ? resumeArea.value : '';

  const prompt = `Here is my current resume:\n${currentResume}\n\nHere are the suggestions for improvement:\n${suggestions}\n\nPlease rewrite the resume applying these suggestions. Return ONLY the updated resume content in Markdown format.`;

  chrome.runtime.sendMessage({
    action: 'generate_response',
    prompt: prompt,
    content: "Resume Update Request", // Placeholder
    resume: currentResume,
    outputTarget: 'updated-resume-area'
  });
}

function handleEditResume() {
  const displayDiv = document.getElementById('resume-optimizer-updated-resume-display');
  const editTextarea = document.getElementById('resume-optimizer-updated-resume-edit');
  const editBtn = document.getElementById('resume-optimizer-edit-resume-btn');
  const doneBtn = document.getElementById('resume-optimizer-done-editing-btn');

  if (displayDiv && editTextarea) {
    displayDiv.style.display = 'none';
    editTextarea.style.display = 'block';

    if (editBtn) editBtn.style.display = 'none';
    if (doneBtn) doneBtn.style.display = 'inline-block';
  }
}

function handleDoneEditing() {
  const displayDiv = document.getElementById('resume-optimizer-updated-resume-display');
  const editTextarea = document.getElementById('resume-optimizer-updated-resume-edit');
  const editBtn = document.getElementById('resume-optimizer-edit-resume-btn');
  const doneBtn = document.getElementById('resume-optimizer-done-editing-btn');

  if (displayDiv && editTextarea) {
    const rawMarkdown = editTextarea.value;
    try {
      const parsedHtml = marked.parse(rawMarkdown);
      const cleanHtml = DOMPurify.sanitize(parsedHtml);
      displayDiv.innerHTML = cleanHtml;
    } catch (e) {
      console.error("Error processing markdown:", e);
      displayDiv.textContent = rawMarkdown;
    }

    displayDiv.style.whiteSpace = 'normal';
    displayDiv.style.display = 'block';
    editTextarea.style.display = 'none';

    if (editBtn) editBtn.style.display = 'inline-block';
    if (doneBtn) doneBtn.style.display = 'none';
  }
}

function handleDownloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const editTextarea = document.getElementById('resume-optimizer-updated-resume-edit');
  const content = editTextarea ? editTextarea.value : '';

  const splitText = doc.splitTextToSize(content, 180);
  doc.text(splitText, 10, 10);
  doc.save("updated_resume.pdf");
}

// Listen for stream updates
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const target = request.outputTarget || 'response-area';

  if (request.action === 'stream_update') {
    if (target === 'response-area') {
      const responseArea = document.getElementById('resume-optimizer-response-area');
      if (responseArea) {
        responseArea.textContent += request.chunk;
        // Auto-scroll to bottom
        responseArea.scrollTop = responseArea.scrollHeight;
      }
    } else if (target === 'updated-resume-area') {
      const displayDiv = document.getElementById('resume-optimizer-updated-resume-display');
      const editTextarea = document.getElementById('resume-optimizer-updated-resume-edit');

      // If this is the first chunk, clear the "Generating..." message
      if (displayDiv && displayDiv.textContent === 'Generating updated resume...') {
        displayDiv.textContent = '';
      }

      if (displayDiv) {
        displayDiv.textContent += request.chunk;
        displayDiv.scrollTop = displayDiv.scrollHeight;
      }
      if (editTextarea) {
        editTextarea.value += request.chunk;
      }
    }
  } else if (request.action === 'stream_end') {
    if (target === 'response-area') {
      const responseArea = document.getElementById('resume-optimizer-response-area');
      const submitBtn = document.querySelector('.resume-optimizer-submit-btn');
      const updateResumeBtn = document.getElementById('resume-optimizer-update-resume-btn');

      if (responseArea) {
        const rawMarkdown = responseArea.textContent;
        try {
          const parsedHtml = marked.parse(rawMarkdown);
          const cleanHtml = DOMPurify.sanitize(parsedHtml);
          responseArea.innerHTML = cleanHtml;
          responseArea.style.whiteSpace = 'normal'; // Allow Markdown to handle spacing
        } catch (e) {
          console.error("Error processing markdown:", e);
          responseArea.textContent += "\n(Error processing Markdown)";
        }
      }

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
      }

      if (updateResumeBtn) {
        // Enforce visibility
        updateResumeBtn.style.setProperty('display', 'block', 'important');
        updateResumeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      // Ensure container is visible
      const responseGroup = document.getElementById('resume-optimizer-response-group');
      if (responseGroup && responseGroup.style.display === 'none') {
        responseGroup.style.display = 'flex';
      }

    } else if (target === 'updated-resume-area') {
      const displayDiv = document.getElementById('resume-optimizer-updated-resume-display');
      const editBtn = document.getElementById('resume-optimizer-edit-resume-btn');
      const downloadBtn = document.getElementById('resume-optimizer-download-pdf-btn');

      if (displayDiv) {
        const rawMarkdown = displayDiv.textContent;
        try {
          const parsedHtml = marked.parse(rawMarkdown);
          const cleanHtml = DOMPurify.sanitize(parsedHtml);
          displayDiv.innerHTML = cleanHtml;
          displayDiv.style.whiteSpace = 'normal';
        } catch (e) {
          console.error("Error processing markdown:", e);
        }
      }

      if (editBtn) editBtn.style.display = 'inline-block';
      if (downloadBtn) downloadBtn.style.display = 'inline-block';
    }
  } else if (request.action === 'stream_error') {
    if (target === 'response-area') {
      const responseArea = document.getElementById('resume-optimizer-response-area');
      const submitBtn = document.querySelector('.resume-optimizer-submit-btn');
      const updateResumeBtn = document.getElementById('resume-optimizer-update-resume-btn');

      if (responseArea) {
        responseArea.textContent = 'Error: ' + request.error;
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
      }
      // Even on error, show the button to allow user to proceed or retry if partial content is useful
      if (updateResumeBtn) {
         updateResumeBtn.style.setProperty('display', 'block', 'important');
      }
    } else if (target === 'updated-resume-area') {
      const displayDiv = document.getElementById('resume-optimizer-updated-resume-display');
      if (displayDiv) {
        displayDiv.textContent = 'Error: ' + request.error;
      }
    }
  }
});

function toggleResume() {
  const resumeGroup = document.getElementById('resume-optimizer-resume-group');
  const resumeArea = document.getElementById('resume-optimizer-resume-area');

  if (resumeGroup.style.display === 'none') {
    resumeGroup.style.display = 'flex';
    chrome.storage.local.get(['resume'], (result) => {
      resumeArea.value = result.resume || 'No resume saved.';
    });
  } else {
    resumeGroup.style.display = 'none';
  }
}
