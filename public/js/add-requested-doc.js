const addDocButton = document.getElementById('addDocButton');
const requestedDocs = document.getElementById('requestedDocs');
const doctypeSelector = document.getElementById('doctypeId');
const doctypeOptions = [...document.querySelectorAll('#doctypeId > option')];

doctypeSelector.value = '';

addDocButton.addEventListener('click', addRequestedDoc);
doctypeSelector.addEventListener('change', addDoctype);

function addRequestedDoc() {}

function addDoctype() {
  const selectedOption = getSelectedOption();
  const doctypeTitle = selectedOption.textContent;
  const p = document.createElement('p');
  p.textContent = doctypeTitle;
  requestedDocs.appendChild(p);
  selectedOption.remove();
  doctypeSelector.value = '';
}

// Helpers

function getSelectedOption() {
  return doctypeOptions.find((option) => {
    return doctypeSelector.value === option.value;
  });
}
