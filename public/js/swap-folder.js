// SUPPRESSION DU SWAP FOLDER

const button = document.getElementById('deletingButton');

button.addEventListener('click', () => {
  const form = document.getElementById('deletingForm');
  const clientEmail = form.getAttribute('clientEmail');

  if (
    confirm(
      `Êtes-vous sûr(e) de vouloir supprimer le dossier de prêt de votre client ${clientEmail} ?`
    )
  ) {
    form.submit();
  }
});

// REINITIALISATION DE LA REQUEST

const resettingButton = document.getElementById('resettingButton');
resettingButton.addEventListener('click', () => {
  const form = document.getElementById('resettingForm');

  if (
    confirm(
      `Êtes-vous sûr(e) de vouloir supprimer toutes les pièces que vous avez requises ?`
    )
  ) {
    form.submit();
  }
});
