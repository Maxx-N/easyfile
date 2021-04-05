const statusSelector = document.getElementById('selectStatus');

perform();

function perform() {
  adaptFormToTheStatus();
  addStatusListener();
}

function addStatusListener() {
  statusSelector.addEventListener('change', adaptFormToTheStatus);
}

function adaptFormToTheStatus(e) {
  const firstNameFormGroup = document.getElementById('firstNameFormGroup');
  const lastNameFormGroup = document.getElementById('lastNameFormGroup');
  const companyFormGroup = document.getElementById('companyFormGroup');

  const isPro = statusSelector.value === '1';
  if (isPro) {
    hide(firstNameFormGroup);
    hide(lastNameFormGroup);
    show(companyFormGroup);
  } else {
    show(firstNameFormGroup);
    show(lastNameFormGroup);
    hide(companyFormGroup);
  }
}

// Helpers

function hide(element) {
  element.classList.add('hidden');
}

function show(element) {
  element.classList.remove('hidden');
}
