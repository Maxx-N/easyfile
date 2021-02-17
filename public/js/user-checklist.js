const userDocuments = JSON.parse(
  document.getElementById('userDocuments').getAttribute('userDocuments')
);

const checkContainers = [...document.getElementsByClassName('check-container')];

for (let checkContainer of checkContainers) {
  checkContainer.addEventListener('click', onCheckClick);
}

function onCheckClick() {
  const requestedDocElement = this.parentElement;
  const requestedDoc = JSON.parse(
    requestedDocElement.getAttribute('requestedDoc')
  );
  const requestedDoctype = requestedDoc.doctypeId;
  const isSelected = requestedDocElement.getAttribute('isSelected') === 'true';

  if (isSelected) {
    unselect(requestedDocElement);
  } else {
    requestedDocElement.setAttribute('isSelected', 'true');
    this.classList.add('check-success');
    if (!requestedDoctype.isUnique) {
      if (requestedDoctype.periodicity !== 'none') {
        for (let i = 0; i < requestedDoc.age; i++) {
          createADocSelector(requestedDocElement);
        }
      } else {
        createADocSelector(requestedDocElement);
      }
    }
  }
}

function createADocSelector(requestedDocElement) {
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

  requestedDocElement.appendChild(select);

  //   const option1 = document.createElement('option');
  //   option1.textContent = 'Option 1';
  //   const option2 = document.createElement('option');
  //   option2.textContent = 'Option 2';
  //   select.appendChild(option1);
  //   select.appendChild(option2);
  //   requestedDocElement.appendChild(select);
}

function unselect(requestedDocElement) {
  const checkContainer = requestedDocElement.querySelector('.check-container');
  const selectors = [...requestedDocElement.querySelectorAll('select')];

  requestedDocElement.setAttribute('isSelected', 'false');

  for (let selector of selectors) {
    selector.remove();
  }

  checkContainer.classList.remove('check-success');
}
