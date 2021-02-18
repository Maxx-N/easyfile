const userDocuments = JSON.parse(
  document.getElementById('userDocuments').getAttribute('userDocuments')
);

const checkContainers = [...document.getElementsByClassName('check-container')];

for (let checkContainer of checkContainers) {
  checkContainer.addEventListener('click', onCheckClick);
}

function onCheckClick() {
  const requestedDocElement = this.parentElement;
  const isSelected = requestedDocElement.getAttribute('isSelected') === 'true';

  if (isSelected) {
    unselect(requestedDocElement);
  } else {
    requestedDocElement.setAttribute('isSelected', 'true');
    this.classList.add('check-success');
    createDivOfSelectors(requestedDocElement);
  }
}

function createDivOfSelectors(requestedDocElement) {
  const requestedDoc = JSON.parse(
    requestedDocElement.getAttribute('requestedDoc')
  );
  const requestedDoctype = requestedDoc.doctypeId;

  const selectorsContainer = document.createElement('div');
  selectorsContainer.classList.add('doc-selectors-container');
  requestedDocElement.appendChild(selectorsContainer);

  if (!requestedDoctype.isUnique) {
    if (requestedDoctype.periodicity !== 'none') {
      for (let i = 0; i < requestedDoc.age; i++) {
        createADocSelector(selectorsContainer);
      }
    } else {
      createADocSelector(selectorsContainer);
    }
  }
}

function createADocSelector(selectorsContainer) {
  const requestedDocElement = selectorsContainer.parentElement;
  const select = document.createElement('select');
  const requestedDoc = JSON.parse(
    requestedDocElement.getAttribute('requestedDoc')
  );
  const requestedDoctype = requestedDoc.doctypeId;
  const matchingDocs = userDocuments.filter((doc) => {
    return doc.doctypeId.toString() === requestedDoctype._id.toString();
  });

  for (let matchingDoc of matchingDocs) {
    const option = document.createElement('option');
    option.textContent = matchingDoc.title;
    select.appendChild(option);
  }

  selectorsContainer.appendChild(select);
}

function unselect(requestedDocElement) {
  const checkContainer = requestedDocElement.querySelector('.check-container');
  const selectors = [
    ...requestedDocElement.querySelectorAll('.doc-selectors-container'),
  ];

  requestedDocElement.setAttribute('isSelected', 'false');

  for (let selector of selectors) {
    selector.remove();
  }

  checkContainer.classList.remove('check-success');
}
