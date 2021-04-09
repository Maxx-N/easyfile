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

addAlertToAllRequestedDocsWithDocumentsThatAreNotValidsAnymore();

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
        const addedDocs = items.filter((item) => {
          return item.getAttribute('isAdded') === 'true';
        });
        for (let doc of getOtherDocumentElements(items, addedDocs)) {
          doc.classList.add('unnecessary-to-add');
        }
        for (let doc of addedDocs) {
          doc.classList.remove('unnecessary-to-add');
        }
      } else {
        title.classList.remove('added-group-title');
        for (let item of items) {
          item.classList.remove('unnecessary-to-add');
        }
      }
    }
  }
}

function getOtherDocumentElements(allDocsOfTheGroup, docs) {
  return allDocsOfTheGroup.filter((d) => {
    return !docs.includes(d);
  });
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

function isPast(dateString) {
  const today = new Date(new Date().setUTCHours(0, 0, 0, 0));
  const date = new Date(dateString);
  return date < today;
}

function areDocumentsStillValid(requestedDocElement) {
  const requestedDoc = getRequestedDoc(requestedDocElement);
  const requestedDoctype = allDoctypes.find((dt) => {
    return dt._id.toString() === requestedDoc.doctypeId._id.toString();
  });
  const requestedDocDocuments = requestedDoc.documentIds;

  let answer;

  if (requestedDoc.age !== null && requestedDoc.age !== undefined) {
    switch (requestedDoctype.periodicity) {
      case 'month':
        answer = true;
        for (let i = requestedDoc.age; i > 0; i--) {
          if (
            !requestedDocDocuments.some((doc) => {
              return getMonthsBack(doc.month, doc.year) === i;
            })
          ) {
            answer = false;
            break;
          }
        }
        break;
      case 'year':
        answer = true;
        const currentYear = new Date().getFullYear();
        if (requestedDoc.age > 0) {
          for (let i = requestedDoc.age; i > 0; i--) {
            if (
              !requestedDocDocuments.some((doc) => {
                return currentYear - doc.year === i;
              })
            ) {
              answer = false;
              break;
            }
          }
        } else {
          answer = requestedDocDocuments.some((doc) => {
            return currentYear - doc.year === requestedDoc.age;
          });
        }
        break;
      default:
        if (
          requestedDocDocuments.some((doc) => {
            return calculateAgeInMonths(doc.issuanceDate) < requestedDoc.age;
          })
        ) {
          answer = true;
        }
    }
  } else {
    if (
      requestedDocDocuments.some((doc) => {
        return doc.expirationDate ? !isPast(doc.expirationDate) : true;
      })
    ) {
      answer = true;
    }
  }

  if (!answer) {
    answer = false;
  }

  return answer;
}

function addAlertToAllRequestedDocsWithDocumentsThatAreNotValidsAnymore() {
  const completedRequestedDocElements = requestedDocElements.filter((d) => {
    return d.getAttribute('isAdded') === 'true';
  });

  for (let requestedDocEl of completedRequestedDocElements) {
    if (!areDocumentsStillValid(requestedDocEl)) {
      addAlertToRequestedDocElement(requestedDocEl);
    }
  }
}

function addAlertToRequestedDocElement(requestedDocElement) {
  const div = document.createElement('div');
  requestedDocElement.appendChild(div);
  div.classList.add('text-muted', 'date-alert');

  const i = document.createElement('i');
  div.appendChild(i);
  i.classList.add('fas', 'fa-exclamation-triangle');

  const span = document.createElement('span');
  div.appendChild(span);
  span.textContent = " Date(s) dépassée(s) depuis l'ajout";
}
