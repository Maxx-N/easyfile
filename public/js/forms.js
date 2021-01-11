const select = document.getElementById('selectStatus');
const options = document.querySelectorAll('#selectStatus>option');
for (let option of options) {
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
