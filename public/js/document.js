const button = document.getElementById('deletingButton');

button.addEventListener('click', () => {
  const form = document.getElementById('deletingForm');
  const doctypeName = form.getAttribute('doctypeName');

  if (confirm(`Êtes-vous sûr(e) de vouloir supprimer votre ${doctypeName.toLowerCase()} ?`)) {
    form.submit();
  }
});
