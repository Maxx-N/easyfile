const userDocuments = JSON.parse(
  document.getElementById('userDocuments').getAttribute('userDocuments')
);

const allDoctypes = JSON.parse(
  document.getElementById('allDoctypes').getAttribute('allDoctypes')
);

const checkContainers = [...document.getElementsByClassName('check-container')];

const requestedDocElements = [
  ...document.getElementsByClassName('user-requested-doc'),
];

for (let requestedDocElement of requestedDocElements) {
  const requestedDoc = getRequestedDoc(requestedDocElement);
  if (requestedDoc.documentIds.length > 0) {
    requestedDocElement.setAttribute('documentIds', requestedDoc.documentIds);
    showRequestedDocAsAdded(requestedDocElement);
    addListOfExistingTitles(requestedDocElement);
  }
}

function addListOfExistingTitles(requestedDocElement) {
  const requestedDoc = getRequestedDoc(requestedDocElement);

  const documentTitles = userDocuments
    .filter((doc) => {
      return requestedDoc.documentIds.includes(doc._id);
    })
    .sort((doc1, doc2) => {
      return getAgeOfADocument(doc1) - getAgeOfADocument(doc2);
    })
    .map((doc) => {
      return doc.title;
    });

  const ul = document.createElement('ul');
  ul.classList.add(
    'list-group',
    'd-flex',
    'flex-row',
    'justify-content-around',
    'align-items-center'
  );
  requestedDocElement.appendChild(ul);

  for (let title of documentTitles) {
    const li = document.createElement('li');
    li.classList.add('list-group-item');
    li.textContent = title;
    ul.appendChild(li);
  }
}

for (let checkContainer of checkContainers) {
  checkContainer.addEventListener('click', onCheckClick);
}

function onCheckClick() {
  const requestedDocElement = this.parentElement;
  const isSelected = requestedDocElement.getAttribute('isSelected') === 'true';
  const isAdded = requestedDocElement.getAttribute('isAdded') === 'true';

  if (isAdded) {
    unAdd(requestedDocElement);
  } else if (isSelected) {
    add(requestedDocElement);
  } else {
    const requestedDoc = JSON.parse(
      requestedDocElement.getAttribute('requestedDoc')
    );
    const requestedDoctype = requestedDoc.doctypeId;
    switch (requestedDoctype.isUnique) {
      case true:
        add(requestedDocElement);
        break;
      default:
        select(requestedDocElement);
    }
  }
}

function add(requestedDocElement) {
  const selectors = [
    ...requestedDocElement.querySelectorAll('.doc-selectors-container select'),
  ];

  const documentIds = [];

  if (selectors.length > 0) {
    for (let selector of selectors) {
      const selectedOption = [...selector.getElementsByTagName('option')].find(
        (option) => {
          return option.value === selector.value;
        }
      );
      documentIds.push(selectedOption.value);
    }
  } else {
    const requestedDoc = JSON.parse(
      requestedDocElement.getAttribute('requestedDoc')
    );
    const matchingDocId = userDocuments.find((doc) => {
      return doc.doctypeId === requestedDoc.doctypeId._id;
    })._id;
    documentIds.push(matchingDocId);
  }

  requestedDocElement.setAttribute('documentIds', documentIds);

  addDocumentsToRequestedDoc(requestedDocElement);
}

function addDocumentsToRequestedDoc(requestedDocElement) {
  const requestedDoc = getRequestedDoc(requestedDocElement);

  const data = {
    documentIds: requestedDocElement.getAttribute('documentIds'),
  };

  $.post(`/add-documents-to-requested-doc/${requestedDoc._id}`, data, () => {
    addListOfTitlesFromSelectors(requestedDocElement);
    showRequestedDocAsAdded(requestedDocElement);
  });
}

function showRequestedDocAsAdded(requestedDocElement) {
  unSelect(requestedDocElement);
  requestedDocElement.setAttribute('isAdded', 'true');
  const check = requestedDocElement.querySelector('.check-container');
  check.classList.add('check-success');
}

function addListOfTitlesFromSelectors(requestedDocElement) {
  const selectors = [
    ...requestedDocElement.querySelectorAll('.doc-selectors-container select'),
  ];

  if (selectors.length > 0) {
    const ul = document.createElement('ul');
    ul.classList.add(
      'list-group',
      'd-flex',
      'flex-row',
      'justify-content-around',
      'align-items-center'
    );
    requestedDocElement.appendChild(ul);

    for (let selector of selectors) {
      const selectedOption = [...selector.getElementsByTagName('option')].find(
        (option) => {
          return option.value === selector.value;
        }
      );
      const li = document.createElement('li');
      li.classList.add('list-group-item');
      li.textContent = selectedOption.textContent;
      ul.appendChild(li);
    }
  }
}

function select(requestedDocElement) {
  const check = requestedDocElement.querySelector('.check-container');
  requestedDocElement.setAttribute('isSelected', 'true');
  check.classList.add('check-warning');
  createDivOfSelectors(requestedDocElement);
  addCross(requestedDocElement);
}

function addCross(requestedDocElement) {
  const crossContainer = document.createElement('span');
  crossContainer.classList.add('cross-container', 'pointer');

  const cross = document.createElement('i');
  cross.classList.add('fas', 'fa-times');

  crossContainer.appendChild(cross);
  requestedDocElement.prepend(crossContainer);

  crossContainer.addEventListener('click', () => {
    unSelect(requestedDocElement);
  });
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
      for (let i = 1; i <= requestedDoc.age; i++) {
        createADocSelector(selectorsContainer, i);
      }
    } else {
      createADocSelector(selectorsContainer, requestedDoc.age);
    }
  }
}

function createADocSelector(selectorsContainer, age) {
  const requestedDocElement = selectorsContainer.parentElement;
  const select = document.createElement('select');
  const requestedDoc = JSON.parse(
    requestedDocElement.getAttribute('requestedDoc')
  );
  const matchingDocs = findMatchingDocs(requestedDoc, age);

  for (let matchingDoc of matchingDocs) {
    const option = document.createElement('option');
    option.textContent = matchingDoc.title;
    option.value = matchingDoc._id;
    select.appendChild(option);
  }

  selectorsContainer.appendChild(select);
}

function unAdd(requestedDocElement) {
  const requestedDoc = getRequestedDoc(requestedDocElement);

  const data = {
    documentIds: requestedDocElement.getAttribute('documentIds'),
  };

  $.post(
    `/delete-documents-from-requested-doc/${requestedDoc._id}`,
    data,
    () => {
      const checkContainer = requestedDocElement.querySelector(
        '.check-container'
      );

      requestedDocElement.setAttribute('isAdded', 'false');

      requestedDocElement.removeAttribute('documentIds');
      checkContainer.classList.remove('check-success');

      const titleList = requestedDocElement.querySelector('.list-group');

      if (titleList) {
        titleList.remove();
      }
    }
  );
}

function unSelect(requestedDocElement) {
  const checkContainer = requestedDocElement.querySelector('.check-container');
  const selectorsContainer = requestedDocElement.querySelector(
    '.doc-selectors-container'
  );
  requestedDocElement.setAttribute('isSelected', 'false');

  if (selectorsContainer) {
    selectorsContainer.remove();
  }

  checkContainer.classList.remove('check-warning');

  const crossContainer = requestedDocElement.querySelector('.cross-container');
  if (crossContainer) {
    crossContainer.remove();
  }
}

// HELPERS

function getRequestedDoc(requestedDocElement) {
  return JSON.parse(requestedDocElement.getAttribute('requestedDoc'));
}

function findMatchingDocs(requestedDoc, age) {
  let matchingDocs;
  const requestedDoctype = requestedDoc.doctypeId;

  if (age) {
    if (requestedDoctype.periodicity === 'none') {
      matchingDocs = userDocuments.filter((doc) => {
        return (
          doc.doctypeId.toString() === requestedDoctype._id.toString() &&
          getAgeOfADocument(doc) < age
        );
      });
    } else {
      matchingDocs = userDocuments.filter((doc) => {
        return (
          doc.doctypeId.toString() === requestedDoctype._id.toString() &&
          getAgeOfADocument(doc) > 0 &&
          getAgeOfADocument(doc) === age
        );
      });
    }
  } else {
    matchingDocs = userDocuments.filter((doc) => {
      return doc.doctypeId.toString() === requestedDoctype._id.toString();
    });
  }

  return matchingDocs;
}

function getAgeOfADocument(doc) {
  const doctype = allDoctypes.find((dt) => {
    return dt._id.toString() === doc.doctypeId.toString();
  });
  let age;

  switch (doctype.periodicity) {
    case 'month':
      age = getMonthsBack(doc.month, doc.year);
      break;
    case 'year':
      const currentYear = new Date().getFullYear();
      age = currentYear - doc.year;
      break;
    default:
      age = calculateAgeInMonths(doc.issuanceDate);
  }

  return age;
}

function getMonthsBack(month, year) {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  if (year === currentYear) {
    return currentMonth - month;
  }

  const previousYears = currentYear - year;
  const addedMonths = 12 - month;
  const separatingYears = previousYears - 1;

  return currentMonth + addedMonths + separatingYears * 12;
}

function calculateAgeInMonths(stringDate) {
  const date = new Date(stringDate);
  const monthsBack = getMonthsBack(date.getMonth() + 1, date.getFullYear());
  const currentDay = new Date().getDate();
  const day = date.getDate();

  if (day > currentDay) {
    return monthsBack - 1;
  }

  return monthsBack;
}
