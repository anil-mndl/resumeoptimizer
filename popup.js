document.addEventListener('DOMContentLoaded', () => {
  const resumeText = document.getElementById('resumeText');
  const saveButton = document.getElementById('saveResume');
  const status = document.getElementById('status');

  const promptsList = document.getElementById('promptsList');
  const newPromptText = document.getElementById('newPromptText');
  const addPromptBtn = document.getElementById('addPromptBtn');

  // Load saved resume
  chrome.storage.local.get(['resume'], (result) => {
    if (result.resume) {
      resumeText.value = result.resume;
    }
  });

  // Save resume
  saveButton.addEventListener('click', () => {
    const resume = resumeText.value;
    chrome.storage.local.set({ resume: resume }, () => {
      showStatus('Resume saved!');
    });
  });

  function showStatus(message) {
    status.textContent = message;
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
  }

  // --- Prompts Logic ---

  // Load prompts
  loadPrompts();

  function loadPrompts() {
    chrome.storage.local.get(['prompts'], (result) => {
      const prompts = result.prompts || [];
      renderPrompts(prompts);
    });
  }

  function renderPrompts(prompts) {
    promptsList.innerHTML = '';
    prompts.forEach((prompt, index) => {
      const li = document.createElement('li');

      const contentDiv = document.createElement('div');
      contentDiv.className = 'prompt-content';
      contentDiv.textContent = prompt.text;

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'edit-btn';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => startEditing(index, prompt.text));

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', () => deletePrompt(index));

      actionsDiv.appendChild(editBtn);
      actionsDiv.appendChild(deleteBtn);

      li.appendChild(contentDiv);
      li.appendChild(actionsDiv);
      promptsList.appendChild(li);
    });
  }

  addPromptBtn.addEventListener('click', () => {
    const text = newPromptText.value.trim();
    if (text) {
      chrome.storage.local.get(['prompts'], (result) => {
        const prompts = result.prompts || [];
        // Structure: { id: timestamp, text: string }
        // For simplicity using index for modification, but storing object is fine.
        // Actually, let's store object { id: Date.now(), text: text }
        prompts.push({ id: Date.now(), text: text });
        chrome.storage.local.set({ prompts: prompts }, () => {
          newPromptText.value = '';
          renderPrompts(prompts);
        });
      });
    }
  });

  function deletePrompt(index) {
    chrome.storage.local.get(['prompts'], (result) => {
      const prompts = result.prompts || [];
      prompts.splice(index, 1);
      chrome.storage.local.set({ prompts: prompts }, () => {
        renderPrompts(prompts);
      });
    });
  }

  function startEditing(index, currentText) {
    // Re-render the specific item for editing
    // This is a bit lazy, simpler to just replace the innerHTML of the li or find it.
    // Let's reload everything but mark one as editing?
    // Or just DOM manipulation on the spot.

    // Finding the specific LI again is messy if we just have index.
    // Let's rely on renderPrompts but pass an editIndex maybe?
    // No, let's do DOM manipulation on the `promptsList.children[index]`.

    const li = promptsList.children[index];
    li.innerHTML = ''; // Clear it

    const input = document.createElement('textarea');
    input.className = 'edit-input';
    input.value = currentText;

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'actions';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'save-btn';
    saveBtn.textContent = 'Save';
    saveBtn.style.backgroundColor = '#27ae60';
    saveBtn.addEventListener('click', () => saveEdit(index, input.value));

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'cancel-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => loadPrompts()); // Re-render to cancel

    actionsDiv.appendChild(saveBtn);
    actionsDiv.appendChild(cancelBtn);

    li.appendChild(input);
    li.appendChild(actionsDiv);
    input.focus();
  }

  function saveEdit(index, newText) {
    if (!newText.trim()) return;

    chrome.storage.local.get(['prompts'], (result) => {
      const prompts = result.prompts || [];
      if (prompts[index]) {
        prompts[index].text = newText.trim();
        chrome.storage.local.set({ prompts: prompts }, () => {
          renderPrompts(prompts);
        });
      }
    });
  }

});
