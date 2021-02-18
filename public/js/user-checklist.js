const userDocuments = JSON.parse(
  document.getElementById('userDocuments').getAttribute('userDocuments')
);

const allDoctypes = JSON.parse(
  document.getElementById('allDoctypes').getAttribute('allDoctypes')
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

// HELPERS

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
