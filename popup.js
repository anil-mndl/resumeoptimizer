document.addEventListener('DOMContentLoaded', () => {
  const resumeText = document.getElementById('resumeText');
  const saveButton = document.getElementById('saveResume');
  const status = document.getElementById('status');

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
      status.textContent = 'Resume saved!';
      setTimeout(() => {
        status.textContent = '';
      }, 2000);
    });
  });
});
