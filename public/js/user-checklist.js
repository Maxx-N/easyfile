const checkContainers = [...document.getElementsByClassName('check-container')];

for (let checkContainer of checkContainers) {
  checkContainer.addEventListener('click', onCheckClick);
}

function onCheckClick() {
  const requestedDocElement = this.parentElement;
  const requestedDoc = JSON.parse(
    requestedDocElement.getAttribute('requestedDoc')
  );
  const doctype = requestedDoc.doctypeId;

  if (doctype.isUnique) {
    // ou un seul doc de ce type possédé ?
    this.classList.toggle('check-success');
  } else {
    if (doctype.periodicity !== 'none') {
      for (let i = 0; i < requestedDoc.age; i++) {
        createADocSelector(requestedDocElement);
      }
    } else {
        createADocSelector(requestedDocElement);
    }
  }
}

function createADocSelector(requestedDocElement) {
  const select = document.createElement('select');
  const option1 = document.createElement('option');
  option1.textContent = 'Option 1';
  const option2 = document.createElement('option');
  option2.textContent = 'Option 2';
  select.appendChild(option1);
  select.appendChild(option2);
  requestedDocElement.appendChild(select);
}
