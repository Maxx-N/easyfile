const firstColumn = document.getElementById('firstColumn');
const secondColumn = document.getElementById('secondColumn');
const selectors = document.getElementById('selectors');
const doctypeSelector = document.getElementById('doctypeSelector');
const defaultInstruction =
  'Cliquez sur un élément pour l\'ajouter à un groupe de documents à fournir AU CHOIX (exemple : "Carte d\'identité" OU "Passeport"... ).';
let docGroupId = 1;
const existingDocuments = [
  ...document.getElementsByClassName('existing-document'),
];

const allDoctypes = JSON.parse(
  document.getElementById('allDoctypes').getAttribute('allDocTypes')
);

// Documents existants

hideOrShowRightColumn();

for (let existingDoc of existingDocuments) {
  addAgeOfExistingDoc(existingDoc);
  addTrash(existingDoc);
  addDoctypeAndTitleOfExistingDoc(existingDoc);
  linkToRelatedExistingDocs(existingDoc);
  hideDoctypeOptionIfUnique(existingDoc);
  existingDoc.addEventListener('click', linkDocs);
}

displayGroupedDocs();

giveAlternativeInstruction();

function hideDoctypeOptionIfUnique(existingDoc) {
  const doctypeId = existingDoc.getAttribute('doctypeId');
  const dt = allDoctypes.find((dt) => {
    return dt._id === doctypeId;
  });

  if (dt.isUnique) {
    const doctypeOptions = [
      ...document.querySelectorAll('#doctypeSelector > option'),
    ];
    const matchingOption = doctypeOptions.find((option) => {
      return option.value === doctypeId;
    });

    hide(matchingOption);
  }
}

function addAgeOfExistingDoc(existingDoc) {
  const doctypeId = existingDoc.getAttribute('doctypeId');
  const dt = allDoctypes.find((dt) => {
    return dt._id === doctypeId;
  });
  const ageBox = [...existingDoc.getElementsByTagName('td')][1];
  const age = existingDoc.getAttribute('age');
  ageBox.textContent = displayAge(age, dt);
}

function displayAge(age, doctype) {
  let displayedAge;

  if (age) {
    if (doctype.periodicity === 'month') {
      if (+age === 1) {
        displayedAge = 'Mois dernier';
      } else {
        displayedAge = `${age} derniers mois`;
      }
    }

    if (doctype.periodicity === 'year') {
      const currentYear = new Date().getFullYear();
      const numAge = +age;
      if (numAge === 0) {
        displayedAge = `Daté(e) de ${currentYear}`;
      } else if (numAge === 1) {
        displayedAge = `Daté(e) de ${currentYear - numAge}`;
      } else {
        displayedAge = `Daté(e)s de ${currentYear - numAge} à ${
          currentYear - 1
        } inclus`;
      }
    }

    if (doctype.periodicity === 'none' && doctype.hasIssuanceDate) {
      if (+age === 1) {
        displayedAge = "Daté(e) de moins d'1 mois";
      } else {
        displayedAge = `Daté(e) de moins de ${age} mois`;
      }
    }
  } else {
    displayedAge = '-';
  }

  return displayedAge;
}

function addDoctypeAndTitleOfExistingDoc(existingDoc) {
  const td = existingDoc.getElementsByTagName('td')[0];
  const title = existingDoc.getAttribute('title');

  if (title) {
    td.textContent += ` (${title})`;
    existingDoc.setAttribute('requestedDocTitle', title);
  }
}

function linkToRelatedExistingDocs(existingDoc) {
  const alternativeRequestedDocIds = JSON.parse(
    existingDoc.getAttribute('alternativeRequestedDocIds')
  );
  const groupId = existingDoc.getAttribute('docGroupId');
  if (alternativeRequestedDocIds.length > 0 && !groupId) {
    const relatedExistingDocs = existingDocuments.filter((doc) => {
      return alternativeRequestedDocIds.includes(doc.getAttribute('id'));
    });
    existingDoc.setAttribute('docGroupId', docGroupId);
    for (let doc of relatedExistingDocs) {
      doc.setAttribute('docGroupId', docGroupId);
    }
    docGroupId++;
  }
}

//

doctypeSelector.value = '';

doctypeSelector.addEventListener('change', createDoctype);

// Ajout du type de document

function createDoctype() {
  const selectedOption = getSelectedOption();
  createListItem(selectedOption.textContent);
  hide(doctypeSelector);
  createAddButton();
  createCancelButton();
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
  document.getElementsByClassName('top-btn-container')[0].appendChild(button);
  button.addEventListener('click', clearDoc);
}

function createAddButton() {
  const button = document.createElement('button');
  button.id = 'addDocButton';
  button.classList.add('btn', 'btn-info');
  button.textContent = 'Ajouter à la requête';
  document.getElementsByClassName('top-btn-container')[0].appendChild(button);
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

    if (periodicity === 'year') {
      createYearHelper(selectors);
    }
  }
}

function createYearHelper(selectors) {
  const div = document.createElement('div');
  div.setAttribute('id', 'yearHelper');

  const small1 = document.createElement('small');
  small1.classList.add('form-text', 'text-muted');
  small1.textContent =
    "ATTENTION : Il s'agit de l'année d'émission du document !";
  div.appendChild(small1);

  const small2 = document.createElement('small');
  small2.classList.add('form-text', 'text-muted');
  small2.textContent = `Exemple : Pour un avis d'imposition sur les revenus de ${
    new Date().getFullYear() - 1
  }, l'année est ${new Date().getFullYear()}.`;
  div.appendChild(small2);

  selectors.appendChild(div);
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
  const currentYear = new Date().getFullYear();
  for (let i = 0; i <= 9; i++) {
    const option = document.createElement('option');
    option.value = i;
    if (i === 0) {
      option.textContent = `Daté(e) de ${currentYear}`;
    } else if (i === 1) {
      option.textContent = `Daté(e) de ${currentYear - i}`;
    } else {
      option.textContent = `Daté(e)s de ${currentYear - i} à ${
        currentYear - 1
      } inclus`;
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

  const yearHelper = document.getElementById('yearHelper');
  if (yearHelper) {
    yearHelper.remove();
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
  if (selectedAge && selectedAge.value !== '') {
    tr.setAttribute('age', selectedAge.value);
  }

  addDoctypeData(tr);
  addSelectedAge(tr);
  addTrash(tr);
  docTable.prepend(tr);

  tr.addEventListener('click', linkDocs);
  giveAlternativeInstruction();
}

function addDoctypeData(row) {
  const doctypeTitle = getSelectedOption().textContent;
  const td = document.createElement('td');
  td.textContent = doctypeTitle;
  const title = document.getElementById('titleInput').value;
  if (title) {
    td.textContent += ` (${title})`;
    row.setAttribute('requestedDocTitle', title);
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
    giveAlternativeInstruction();
  }
}

function giveAlternativeInstruction() {
  const docs = [...document.getElementsByClassName('doc')];
  const alternativeInstruction = document.getElementById(
    'alternativeInstruction'
  );

  if (docs.length >= 2) {
    alternativeInstruction.classList.add('border-info');
    const selectedDoc = docs.find((doc) => {
      return doc.getAttribute('selected') === 'true';
    });

    if (selectedDoc) {
      alternativeInstruction.classList.add('bg-info', 'text-light');
      alternativeInstruction.textContent =
        'Cliquez sur le groupe dans lequel vous souhaitez déplacer ce document. Pour annuler la sélection, cliquez à nouveau dessus.';
    } else {
      alternativeInstruction.classList.remove('bg-info', 'text-light');
      alternativeInstruction.textContent = defaultInstruction;
    }
  } else {
    alternativeInstruction.textContent = '';
    alternativeInstruction.classList.remove('border-info');
  }
}

// Affichage groupé des documents

function displayGroupedDocs() {
  const docTable = document.getElementById('docTable');
  const docs = [...document.getElementsByClassName('doc')];

  const orderedDocs = docs.sort((doc1, doc2) => {
    const group1 = +doc1.getAttribute('docGroupId');
    const group2 = +doc2.getAttribute('docGroupId');
    return group1 - group2;
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

  myDoc.classList.remove(
    'top-of-group',
    'middle-of-group',
    'bottom-of-group',
    'group-item'
  );

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
    } else if (index === group.length - 1) {
      myDoc.classList.add('bottom-of-group');
    } else {
      myDoc.classList.add('middle-of-group');
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
  giveAlternativeInstruction();
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

// SOUMISSION DU FORMULAIRE

const submitBtn = document.getElementById('submitBtn');

submitBtn.addEventListener('click', onSubmitForm);

function onSubmitForm() {
  const docs = [...document.getElementsByClassName('doc')];
  if (docs && docs.length >= 0) {
    const form = document.getElementById('addRequestedDocForm');
    createHiddenInputs();
    form.submit();
  } else {
    alert("Merci d'ajouter au moins un document avant de valider la requête.");
  }
}

function createHiddenInputs() {
  const docs = [...document.getElementsByClassName('doc')];
  for (let doc of docs) {
    makeADocHiddenInput(doc);
  }
}

function makeADocHiddenInput(doc) {
  const age = doc.getAttribute('age');
  const title = doc.getAttribute('requestedDocTitle');
  const docGroupId = doc.getAttribute('docGroupId');
  const doctypeId = doc.getAttribute('doctypeId');
  const requestedDocId = doc.getAttribute('id');

  const valueObject = {
    age: age,
    title: title,
    docGroupId: docGroupId,
    doctypeId: doctypeId,
    requestedDocId: requestedDocId,
  };

  const input = document.createElement('input');
  input.setAttribute('type', 'hidden');
  input.setAttribute('name', 'requestedDocs');
  input.setAttribute('value', JSON.stringify(valueObject));

  const form = document.getElementById('addRequestedDocForm');
  form.appendChild(input);
}
