const button = document.getElementById('deletingButton');

button.addEventListener('click', () => {
  const form = document.getElementById('deletingForm');
  const clientEmail = form.getAttribute('clientEmail');

  if (confirm(`Êtes-vous sûr(e) de vouloir supprimer le dossier de prêt de votre client ${clientEmail} ?`)) {
    form.submit();
  }
});