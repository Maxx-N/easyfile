const button = document.getElementById('unsubscribingButton');
console.log(document.getElementById('unsubscribingForm'));

button.addEventListener('click', () => {
  const form = document.getElementById('unsubscribingForm');

  if (
    confirm(
      `Êtes-vous sûr(e) de vouloir supprimer définitivement votre profil ? \nTous les documents et/ou dossiers d'échange liés seront perdus.`
    )
  ) {
    form.submit();
  }
});
