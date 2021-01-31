const firstColumn = document.getElementById('firstColumn');
const selectors = document.getElementById('selectors');
const doctypeSelector = document.getElementById('doctypeId');

doctypeSelector.value = '';

doctypeSelector.addEventListener('change', createDoctype);

// Ajout du type de document

function createDoctype() {
  const selectedOption = getSelectedOption();
  createListItem(selectedOption.textContent);
  doctypeSelector.style.display = 'none';
  createCancelButton();
  createAddButton();
  createAgeSelector(selectedOption);
}

// Helpers

function getSelectedOption() {
  const doctypeOptions = [...document.querySelectorAll('#doctypeId > option')];
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

function createListItem(content) {
  const infoList = document.getElementById('infoList');
  const div = document.createElement('div');
  div.textContent = content;
  div.classList.add('list-group-item');
  infoList.appendChild(div);
}

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

// Sélecteur d'ancienneté

function createAgeSelector(selectedOption) {
  const isUnique = selectedOption.getAttribute('isUnique') === 'true';
  const hasIssuanceDate =
    selectedOption.getAttribute('hasIssuanceDate') === 'true';
  const periodicity = selectedOption.getAttribute('periodicity');

  if (!isUnique) {
    const select = document.createElement('select');
    select.id = 'ageSelector';
    select.classList.add('form-control', 'text-center', 'pointer');

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

// Réinitialisation

function clearDoc() {
  removeItems();
  reinitializeDoctypeSelector();
  removeAgeSelector();
  removeAddDocButton();
  removeCancelDocButton();
}

function removeItems() {
  const items = document.getElementsByClassName('list-group-item');
  for (let item of items) {
    item.remove();
  }
}

function reinitializeDoctypeSelector() {
  doctypeSelector.style.display = 'block';
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

// Ajout de document(s) requis

function addDoc() {
  const docTable = document.getElementById('docTable');
  addRow(docTable);
  removeSelectedDoctypeOption();
  clearDoc();
}

function addRow(docTable) {
  const tr = document.createElement('tr');
  tr.classList.add('table-light');
  addDoctypeData(tr);
  addSelectedAge(tr);
  docTable.prepend(tr);
}

function addDoctypeData(row) {
  const doctypeTitle = getSelectedOption().textContent;
  const td = document.createElement('td');
  td.textContent = doctypeTitle;
  row.appendChild(td);
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

function removeSelectedDoctypeOption() {
  const selectedOption = getSelectedOption();
  selectedOption.remove();
}
