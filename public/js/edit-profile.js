const button = document.getElementById('unsubscribingButton');

button.addEventListener('click', () => {
  const form = document.getElementById('unsubscribingForm');

  if (
    confirm(
      `Êtes-vous sûr(e) de vouloir supprimer définitivement votre compte ? \nTous les documents et/ou dossiers d'échange liés seront perdus.`
    )
  ) {
    form.submit();
  }
});
