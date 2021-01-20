const options = document.querySelectorAll('option');

for (let option of options) {
  const select = option.parentElement;
  if (select.getAttribute('lastChoice') === option.value) {
    option.setAttribute('selected', 'selected');
  } else {
    option.removeAttribute('selected');
  }
}

const checkboxes = document.querySelectorAll('input[type=checkbox]');

checkboxes.forEach((checkbox) => {
  if (checkbox.value === '1') {
    checkbox.checked = true;
  } else {
    checkbox.checked = false;
  }

  checkbox.addEventListener('click', () => {
    if (checkbox.checked) {
      checkbox.value = '1';
    } else {
      checkbox.value = '0';
    }
  });
});

// FORM TO ADD A DOCUMENT (display fields depending on the selected doctype)

const doctypeSelect = document.getElementById('doctypeId');
const doctypeOptions = [...document.querySelectorAll('#doctypeId > option')];

// Doctype helper
const doctypeHelper = document.getElementById('doctypeHelper');

// Field names
const title = document.getElementById('titleGroup');
const issuanceDate = document.getElementById('issuanceDateGroup');
const expirationDate = document.getElementById('expirationDateGroup');
const month = document.getElementById('monthGroup');
const year = document.getElementById('yearGroup');

let selectedDoctypeOption = doctypeOptions.find((option) => {
  return doctypeSelect.value === option.value;
});

if (!!selectedDoctypeOption.value) {
  changeFields();
} else {
  doctypeHelper.style.display = 'none';
  title.style.display = 'none';
  issuanceDate.style.display = 'none';
  expirationDate.style.display = 'none';
  month.style.display = 'none';
  year.style.display = 'none';
}

doctypeSelect.addEventListener('change', changeFields);

function changeFields() {
  selectedDoctypeOption = doctypeOptions.find((option) => {
    return doctypeSelect.value === option.value;
  });

  // Doctype properties
  const isUnique = selectedDoctypeOption.getAttribute('isUnique') === 'true';
  const isMonthly =
    selectedDoctypeOption.getAttribute('periodicity') === 'month';
  const isYearly = selectedDoctypeOption.getAttribute('periodicity') === 'year';
  const hasissuanceDate =
    selectedDoctypeOption.getAttribute('hasissuanceDate') === 'true';
  const hasExpirationDate =
    selectedDoctypeOption.getAttribute('hasExpirationDate') === 'true';

  if (isUnique) {
    title.style.display = 'none';
    doctypeHelper.style.display = 'block';
  } else {
    title.style.display = 'block';
    doctypeHelper.style.display = 'none';
  }
  if (hasissuanceDate) {
    issuanceDate.style.display = 'block';
  } else {
    issuanceDate.style.display = 'none';
  }
  if (hasExpirationDate) {
    expirationDate.style.display = 'block';
  } else {
    expirationDate.style.display = 'none';
  }
  if (isMonthly) {
    month.style.display = 'block';
  } else {
    month.style.display = 'none';
  }
  if (isYearly) {
    year.style.display = 'block';
  } else {
    year.style.display = 'none';
  }
}
