const checkContainers = document.getElementsByClassName('check-container');

for (let checkContainer of checkContainers) {
  checkContainer.addEventListener('click', () => {
    checkContainer.classList.toggle('check-success');
  });
}
