const allDoctypes = JSON.parse(
  document.getElementById('allDoctypes').getAttribute('allDoctypes')
);

const userDocuments = JSON.parse(
  document.getElementById('userDocuments').getAttribute('userDocuments')
);

const requestedDocElements = [
  ...document.getElementsByClassName('user-requested-doc'),
];

for (let requestedDocElement of requestedDocElements) {
  const requestedDoc = getRequestedDoc(requestedDocElement);
  if (requestedDoc.documentIds.length > 0) {
    requestedDocElement.setAttribute(
      'documentIds',
      requestedDoc.documentIds.map((doc) => {
        return doc._id;
      })
    );
    showRequestedDocAsAdded(requestedDocElement);
    addListOfExistingTitles(requestedDocElement);
  }
}

showAddedGroupsOfRequestedDocs();

function getRequestedDoc(requestedDocElement) {
  return JSON.parse(requestedDocElement.getAttribute('requestedDoc'));
}

function showRequestedDocAsAdded(requestedDocElement) {
  requestedDocElement.setAttribute('isAdded', 'true');
  const check = requestedDocElement.querySelector('.check-container');
  check.classList.add('check-success');
}

function showAddedGroupsOfRequestedDocs() {
  const groups = [...document.getElementsByClassName('group')];
  for (let group of groups) {
    const title = group.querySelector('.choice');
    const items = [...group.getElementsByClassName('user-requested-doc')];

    if (title) {
      if (
        items.some((item) => {
          return item.getAttribute('isAdded') === 'true';
        })
      ) {
        title.classList.add('added-group-title');
      } else {
        title.classList.remove('added-group-title');
      }
    }
  }
}

function addListOfExistingTitles(requestedDocElement) {
  const requestedDoc = getRequestedDoc(requestedDocElement);

  const documentTitles = userDocuments
    .filter((doc) => {
      return requestedDoc.documentIds
        .map((doc) => {
          return doc._id;
        })
        .includes(doc._id);
    })
    .filter((doc) => {
      return doc.title;
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
