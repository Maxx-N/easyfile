const select = document.getElementById('selectStatus');
const options = document.querySelectorAll('#selectStatus>option');
for (let option of options) {
  if (select.getAttribute('lastChoice') === option.value) {
    option.setAttribute('selected', 'selected');
  } else {
    option.removeAttribute('selected');
  }
}

const checkbox = document.getElementById('statusCheckbox');

if (checkbox.value === '1') {
  checkbox.checked = true;
} else {
  checkbox.checked = false;
}
