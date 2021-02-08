const firstColumn = document.getElementById('firstColumn');
const secondColumn = document.getElementById('secondColumn');
const selectors = document.getElementById('selectors');
const doctypeSelector = document.getElementById('doctypeSelector');

let docGroupId = 1;

doctypeSelector.value = '';

doctypeSelector.addEventListener('change', createDoctype);

// Ajout du type de document

function createDoctype() {
  const selectedOption = getSelectedOption();
  createListItem(selectedOption.textContent);
  // doctypeSelector.style.display = 'none';
  hide(doctypeSelector);
  createCancelButton();
  createAddButton();
  createAgeSelector(selectedOption);
  createTitleInput();
}

// Récupération d'options sélectionnées

function getSelectedOption() {
  const doctypeOptions = [
    ...document.querySelectorAll('#doctypeSelector > option'),
  ];
  return doctypeOptions.find((option) => {
    return doctypeSelector.value === option.value;
  });
}

function getSelectedAge() {
  const ageSelector = document.getElementById('ageSelector');
  const ageOptions = [...document.querySelectorAll('#ageSelector > option')];
  return ageOptions.find((option) => {
    return ageSelector.value === option.value;
  });
}

// Affichage du type sélectionné dans le DOM

function createListItem(content) {
  const infoList = document.getElementById('infoList');
  const div = document.createElement('div');
  div.textContent = content;
  div.classList.add('list-group-item');
  infoList.appendChild(div);
}

// Création de boutons dans le DOM

function createCancelButton() {
  const button = document.createElement('button');
  button.id = 'cancelDocButton';
  button.classList.add('btn', 'btn-danger');
  button.textContent = 'Annuler';
  firstColumn.prepend(button);
  button.addEventListener('click', clearDoc);
}

function createAddButton() {
  const button = document.createElement('button');
  button.id = 'addDocButton';
  button.classList.add('btn', 'btn-info');
  button.textContent = 'Ajouter à la requête';
  firstColumn.prepend(button);
  button.addEventListener('click', addDoc);
}

// Création du sélecteur d'ancienneté

function createAgeSelector(selectedOption) {
  const isUnique = selectedOption.getAttribute('isUnique') === 'true';
  const hasIssuanceDate =
    selectedOption.getAttribute('hasIssuanceDate') === 'true';
  const periodicity = selectedOption.getAttribute('periodicity');

  if (!isUnique && !(periodicity === 'none' && !hasIssuanceDate)) {
    const select = document.createElement('select');
    select.id = 'ageSelector';
    select.classList.add(
      'form-control',
      'text-center',
      'pointer',
      'margin-top-3-rem'
    );

    if (periodicity === 'month') {
      createMonthOption(select);
    }

    if (periodicity === 'year') {
      createYearOption(select);
    }

    if (periodicity === 'none' && hasIssuanceDate) {
      createMonthAgeOption(select);
    }

    selectors.appendChild(select);
  }
}

function createMonthOption(select) {
  for (let i = 1; i <= 12; i++) {
    const option = document.createElement('option');
    option.value = i;
    if (i === 1) {
      option.textContent = 'Mois dernier';
    } else {
      option.textContent = `${i} derniers mois`;
    }
    select.appendChild(option);
  }
}

function createYearOption(select) {
  for (let i = 1; i <= 10; i++) {
    const option = document.createElement('option');
    option.value = i;
    if (i === 1) {
      option.textContent = 'Année dernière';
    } else {
      option.textContent = `${i} dernières années`;
    }
    select.appendChild(option);
  }
}

function createMonthAgeOption(select) {
  const indifferent = document.createElement('option');
  indifferent.textContent = 'Indifférent';
  indifferent.value = '';
  select.appendChild(indifferent);
  for (let i = 1; i <= 12; i++) {
    const option = document.createElement('option');
    option.value = i;
    if (i === 1) {
      option.textContent = "Daté(e) de moins d'1 mois";
    } else {
      option.textContent = `Daté(e) de moins de ${i} mois`;
    }
    select.appendChild(option);
  }
}

// Création de l'input titre

function createTitleInput() {
  const div = document.createElement('div');
  div.id = 'titleGroup';
  div.classList.add('form-group', 'margin-top-3-rem');

  const input = document.createElement('input');
  input.id = 'titleInput';
  input.classList.add('form-control', 'text-center');
  input.setAttribute('placeholder', 'Précision (optionnelle)');
  input.setAttribute('maxLength', '32');

  div.appendChild(input);

  selectors.appendChild(div);
}

// Réinitialisation

function clearDoc() {
  removeItems();
  reinitializeDoctypeSelector();
  removeAgeSelector();
  removeAddDocButton();
  removeCancelDocButton();
  removeTitleGroup();
}

function removeItems() {
  const items = document.getElementsByClassName('list-group-item');
  for (let item of items) {
    item.remove();
  }
}

function reinitializeDoctypeSelector() {
  show(doctypeSelector);
  doctypeSelector.value = '';
}

function removeAgeSelector() {
  const ageSelector = document.getElementById('ageSelector');
  if (ageSelector) {
    ageSelector.remove();
  }
}

function removeAddDocButton() {
  const addDocButton = document.getElementById('addDocButton');
  if (addDocButton) {
    addDocButton.remove();
  }
}

function removeCancelDocButton() {
  const cancelDocButton = document.getElementById('cancelDocButton');
  if (cancelDocButton) {
    cancelDocButton.remove();
  }
}

function removeTitleGroup() {
  const titleGroup = document.getElementById('titleGroup');
  titleGroup.remove();
}

// Ajout de document(s) requis

function addDoc() {
  const docTable = document.getElementById('docTable');
  addRow(docTable);
  hideSelectedDoctypeOption();
  clearDoc();
  hideOrShowRightColumn();
}

function addRow(docTable) {
  const tr = document.createElement('tr');
  tr.classList.add('table-light', 'doc', 'pointer');

  const selectedOption = getSelectedOption();
  tr.setAttribute('doctypeId', selectedOption.value);

  const selectedAge = getSelectedAge();
  if (selectedAge) {
    tr.setAttribute('age', selectedAge.value);
  }

  addDoctypeData(tr);
  addSelectedAge(tr);
  addTrash(tr);
  docTable.prepend(tr);

  tr.addEventListener('click', linkDocs);
}

function addDoctypeData(row) {
  const doctypeTitle = getSelectedOption().textContent;
  const td = document.createElement('td');
  td.textContent = doctypeTitle;
  const title = document.getElementById('titleInput').value;
  if (title) {
    td.textContent += ` (${title})`;
  }
  row.appendChild(td);
  displayGroupedDocs();
}

function addSelectedAge(row) {
  const selectedAgeOption = getSelectedAge();
  let selectedAge;
  if (selectedAgeOption && selectedAgeOption.value) {
    selectedAge = selectedAgeOption.textContent;
  } else {
    selectedAge = '-';
  }
  const td = document.createElement('td');
  td.textContent = selectedAge;
  row.appendChild(td);
}

function hideSelectedDoctypeOption() {
  const selectedOption = getSelectedOption();
  const isUnique = selectedOption.getAttribute('isUnique') === 'true';
  if (isUnique) {
    hide(selectedOption);
  }
}

// Ajout du logo poubelle

function addTrash(row) {
  const td = document.createElement('td');
  td.classList.add('width1rem', 'pointer', 'trash-container', 'trash');

  const i = document.createElement('i');
  i.classList.add('fas', 'fa-trash', 'trash');

  td.addEventListener('click', removeFromRightColumn);

  td.appendChild(i);
  row.appendChild(td);
}

// Liaison de documents

function linkDocs(e) {
  const isTrashedClicked =
    [...e.target.classList].some((c) => {
      return c === 'trash';
    }) ||
    [...e.target.parentNode.classList].some((c) => {
      return c === 'trash';
    });

  if (!isTrashedClicked) {
    const docs = [...document.getElementsByClassName('doc')];

    if (this.getAttribute('selected') === 'true') {
      this.setAttribute('selected', 'false');
    } else {
      const selectedDoc = docs.find((doc) => {
        return doc.getAttribute('selected') === 'true';
      });

      if (selectedDoc) {
        const thisId = this.getAttribute('docGroupId');

        if (thisId) {
          if (thisId !== selectedDoc.getAttribute('docGroupId')) {
            selectedDoc.setAttribute('docGroupId', thisId);
          }
        } else {
          this.setAttribute('docGroupId', docGroupId);
          selectedDoc.setAttribute('docGroupId', docGroupId);
          docGroupId++;
        }
        selectedDoc.setAttribute('selected', 'false');
        displayGroupedDocs();
      } else {
        this.setAttribute('selected', 'true');
      }
    }
  }
}

// Affichage groupé des documents

function displayGroupedDocs() {
  const docTable = document.getElementById('docTable');
  const docs = [...document.getElementsByClassName('doc')];

  const orderedDocs = docs.sort((doc1, doc2) => {
    const group1 = +doc1.getAttribute('docGroupId');
    const group2 = +doc2.getAttribute('docGroupId');
    return group2 - group1;
  });
  for (let doc of docs) {
    doc.remove();
  }
  for (let orderedDoc of orderedDocs) {
    docTable.appendChild(orderedDoc);
  }
  for (let orderedDoc of orderedDocs) {
    addCorrectClass(orderedDoc);
  }
}

// Ajout de la bonne classe pour un document dans le tableau

function addCorrectClass(myDoc) {
  const docs = [...document.getElementsByClassName('doc')];
  const hasGroup =
    myDoc.getAttribute('docGroupId') &&
    docs.some((doc) => {
      return (
        doc !== myDoc &&
        doc.getAttribute('docGroupId') === myDoc.getAttribute('docGroupId')
      );
    });

  myDoc.classList.remove('top-of-group', 'bottom-of-group', 'group-item');

  if (hasGroup) {
    myDoc.classList.add('group-item');
    const group = docs.filter((doc) => {
      return (
        doc.getAttribute('docGroupId') === myDoc.getAttribute('docGroupId')
      );
    });
    const index = group.indexOf(myDoc);
    if (index === 0) {
      myDoc.classList.add('top-of-group');
    }
    if (index === group.length - 1) {
      myDoc.classList.add('bottom-of-group');
    }
  }
}

// Retrait de la colonne de droite

function removeFromRightColumn(e) {
  const tableRow = this.parentNode;
  const doctypeId = tableRow.getAttribute('doctypeId');
  const option = getOptionByDoctypeId(doctypeId);
  // option.style.display = 'block';
  show(option);
  tableRow.remove();
  hideOrShowRightColumn();
  displayGroupedDocs();
}

// Récupérer une option à partir du doctypeId correspondant

function getOptionByDoctypeId(doctypeId) {
  const doctypeOptions = [
    ...document.querySelectorAll('#doctypeSelector > option'),
  ];

  return doctypeOptions.find((dto) => {
    return dto.value === doctypeId;
  });
}

// Cacher ou montrer un élément du DOM

function hide(el) {
  if (!el.classList.contains('hidden')) {
    el.classList.add('hidden');
  }
}

function show(el) {
  if (el.classList.contains('hidden')) {
    el.classList.remove('hidden');
  }
}

function hideOrShowRightColumn() {
  const docRows = [...document.querySelectorAll('#docTable > tr')];
  if (docRows.length > 0) {
    secondColumn.classList.remove('invisible');
  } else {
    secondColumn.classList.add('invisible');
  }
}
