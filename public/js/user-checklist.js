const userDocuments = JSON.parse(
  document.getElementById('userDocuments').getAttribute('userDocuments')
);

const allDoctypes = JSON.parse(
  document.getElementById('allDoctypes').getAttribute('allDoctypes')
);

// const swapFolderDocumentsIds = getSwapFolderDocumentIds();

const checkContainers = [...document.getElementsByClassName('check-container')];

const requestedDocElements = [
  ...document.getElementsByClassName('user-requested-doc'),
];

// Documents déjà présents
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

  try {
    if (selectors.length > 0) {
      for (let selector of selectors) {
        const selectedOption = [
          ...selector.getElementsByTagName('option'),
        ].find((option) => {
          return option.value === selector.value;
        });
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
  } catch (error) {
    unSelect(requestedDocElement);
    alert('Ajout impossible.');
  }
}

function addDocumentsToRequestedDoc(requestedDocElement) {
  const requestedDoc = getRequestedDoc(requestedDocElement);

  const data = {
    documentIds: requestedDocElement.getAttribute('documentIds'),
  };

  const form = document.createElement('form');
  form.setAttribute(
    'action',
    `/add-documents-to-requested-doc/${requestedDoc._id}`
  );
  form.setAttribute('method', 'POST');

  const input = document.createElement('input');
  input.setAttribute('type', 'hidden');
  input.setAttribute('name', 'documentIds');
  input.setAttribute('value', data.documentIds);

  form.appendChild(input);
  document.getElementsByTagName('main')[0].appendChild(form);

  form.submit();
}

function showRequestedDocAsAdded(requestedDocElement) {
  unSelect(requestedDocElement);
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
        // const check = document.createElement('i');
        // title.textContent = '';
        // title.appendChild(check);
        // check.classList.add('fas', 'fa-check');

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
        title.textContent = 'Au choix :';
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
    if (requestedDoctype.periodicity !== 'none' && requestedDoc.age > 0) {
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

      // for (let id of data.documentIds) {
      //   swapFolderDocumentsIds.splice(swapFolderDocumentsIds.indexOf(id), 1);
      // }

      removeDocumentFromTheLeftColumn(requestedDoc);

      for (let requestedDocElement of requestedDocElements) {
        unSelect(requestedDocElement);
        if (hasUserTheRightDocuments(requestedDocElement)) {
          addCheckContainer(requestedDocElement);
        }
      }

      showAddedGroupsOfRequestedDocs();
    }
  );
}

function addCheckContainer(requestedDocElement) {
  const existingContainer = requestedDocElement.querySelector(
    '.check-container'
  );

  if (!existingContainer) {
    const checkContainer = document.createElement('span');
    requestedDocElement.appendChild(checkContainer);
    checkContainer.classList.add('check-container', 'pointer');
    const check = document.createElement('i');
    checkContainer.appendChild(check);
    check.classList.add('fas', 'fa-check');

    checkContainer.addEventListener('click', onCheckClick);
  }
}

function removeDocumentFromTheLeftColumn(requestedDoc) {
  const rows = [...document.getElementsByClassName('document-item')];
  const documentIds = requestedDoc.documentIds.map((d) => {
    return d._id;
  });
  for (let documentId of documentIds) {
    const rowToDelete = rows.find((row) => {
      return row.id === documentId;
    });
    rowToDelete.remove();
  }
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

  if (checkContainer) {
    checkContainer.classList.remove('check-warning');
  }

  const crossContainer = requestedDocElement.querySelector('.cross-container');
  if (crossContainer) {
    crossContainer.remove();
  }
}

// HELPERS

function getSwapFolderDocumentIds() {
  const documentElements = [
    ...document.getElementsByClassName('document-item'),
  ];
  return documentElements.map((doc) => {
    return doc.getAttribute('id');
  });
}

function isDocumentIdAlreadyPartOfSwapFolder(documentId) {
  return getSwapFolderDocumentIds().includes(documentId);
}

function getRequestedDoc(requestedDocElement) {
  return JSON.parse(requestedDocElement.getAttribute('requestedDoc'));
}

function findMatchingDocs(requestedDoc, age) {
  let matchingDocs;
  const requestedDoctype = requestedDoc.doctypeId;

  if (age !== null && age !== undefined) {
    if (requestedDoctype.periodicity === 'none') {
      matchingDocs = userDocuments.filter((doc) => {
        return (
          doc.doctypeId.toString() === requestedDoctype._id.toString() &&
          getAgeOfADocument(doc) < age &&
          !isDocumentIdAlreadyPartOfSwapFolder(doc._id)
        );
      });
    } else {
      if (age > 0) {
        matchingDocs = userDocuments.filter((doc) => {
          return (
            doc.doctypeId.toString() === requestedDoctype._id.toString() &&
            getAgeOfADocument(doc) > 0 &&
            getAgeOfADocument(doc) === age &&
            !isDocumentIdAlreadyPartOfSwapFolder(doc._id)
          );
        });
      } else {
        matchingDocs = userDocuments.filter((doc) => {
          return (
            doc.doctypeId.toString() === requestedDoctype._id.toString() &&
            getAgeOfADocument(doc) === age &&
            !isDocumentIdAlreadyPartOfSwapFolder(doc._id)
          );
        });
      }
    }
  } else {
    matchingDocs = userDocuments.filter((doc) => {
      return (
        doc.doctypeId.toString() === requestedDoctype._id.toString() &&
        !isDocumentIdAlreadyPartOfSwapFolder(doc._id)
      );
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

////////

function hasUserTheRightDocuments(requestedDocElement) {
  const requestedDoc = getRequestedDoc(requestedDocElement);
  const swapFolderDocuments = userDocuments.filter((doc) => {
    return getSwapFolderDocumentIds().includes(doc._id);
  });

  const requestedDoctype = allDoctypes.find((dt) => {
    return dt._id.toString() === requestedDoc.doctypeId._id.toString();
  });

  let answer;

  if (requestedDoc.age !== null && requestedDoc.age !== undefined) {
    switch (requestedDoctype.periodicity) {
      case 'month':
        answer = true;
        for (let i = requestedDoc.age; i > 0; i--) {
          if (
            !userDocuments.some((doc) => {
              return (
                doc.doctypeId.toString() === requestedDoctype._id.toString() &&
                getMonthsBack(doc.month, doc.year) === i &&
                isDocumentStillAvailableInThisSwapFolder(
                  doc,
                  requestedDoc,
                  swapFolderDocuments
                )
              );
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
              !userDocuments.some((doc) => {
                return (
                  doc.doctypeId.toString() ===
                    requestedDoctype._id.toString() &&
                  currentYear - doc.year === i &&
                  isDocumentStillAvailableInThisSwapFolder(
                    doc,
                    requestedDoc,
                    swapFolderDocuments
                  )
                );
              })
            ) {
              answer = false;
              break;
            }
          }
        } else {
          answer = userDocuments.some((doc) => {
            return (
              doc.doctypeId.toString() === requestedDoctype._id.toString() &&
              currentYear - doc.year === requestedDoc.age &&
              isDocumentStillAvailableInThisSwapFolder(
                doc,
                requestedDoc,
                swapFolderDocuments
              )
            );
          });
        }
        break;
      default:
        if (
          userDocuments.some((doc) => {
            return (
              doc.doctypeId.toString() === requestedDoctype._id.toString() &&
              calculateAgeInMonths(doc.issuanceDate) < requestedDoc.age &&
              isDocumentStillAvailableInThisSwapFolder(
                doc,
                requestedDoc,
                swapFolderDocuments
              )
            );
          })
        ) {
          answer = true;
        }
    }
  } else {
    if (
      userDocuments.some((doc) => {
        return (
          doc.doctypeId.toString() === requestedDoctype._id.toString() &&
          (doc.expirationDate ? !isPast(doc.expirationDate) : true) &&
          isDocumentStillAvailableInThisSwapFolder(
            doc,
            requestedDoc,
            swapFolderDocuments
          )
        );
      })
    ) {
      answer = true;
    }
  }

  return answer;
}

function isDocumentStillAvailableInThisSwapFolder(
  document,
  requestedDoc,
  swapFolderDocuments
) {
  const isDocumentUnavailable =
    swapFolderDocuments
      .map((doc) => {
        return doc._id.toString();
      })
      .includes(document._id.toString()) &&
    !requestedDoc.documentIds
      .map((docId) => {
        return docId.toString();
      })
      .includes(document._id.toString());

  return !isDocumentUnavailable;
}

function isPast(date) {
  const today = new Date(new Date().setUTCHours(0, 0, 0, 0));
  return date < today;
}
