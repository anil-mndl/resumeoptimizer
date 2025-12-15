// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'init_optimizer') {
    openModal(request.selectionText);
  }
});

let modalOverlay = null;

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
  title.textContent = 'Resume Optimizer';

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

  body.appendChild(promptGroup);
  body.appendChild(textGroup);

  // Footer
  const footer = document.createElement('div');
  footer.className = 'resume-optimizer-modal-footer';

  const submitBtn = document.createElement('button');
  submitBtn.className = 'resume-optimizer-submit-btn';
  submitBtn.textContent = 'Submit';
  submitBtn.addEventListener('click', handleSubmit);

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

  // Populate Prompts
  const promptSelect = document.getElementById('resume-optimizer-prompt-select');
  promptSelect.innerHTML = '<option value="">-- Select a Prompt --</option>'; // Reset

  chrome.storage.local.get(['prompts'], (result) => {
    const prompts = result.prompts || [];
    prompts.forEach(prompt => {
      const option = document.createElement('option');
      option.value = prompt.id; // Using ID as value
      option.textContent = prompt.text;
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
  // For now, just close the modal
  closeModal();
}
