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

const deleteRequestButtons = [
  ...document.getElementsByClassName('delete-cross'),
];

for (let button of deleteRequestButtons) {
  button.addEventListener('click', () => {
    const form = button.parentElement;
    if (
      confirm(`Êtes-vous sûr(e) de vouloir supprimer la requête sélectionnée ?`)
    ) {
      form.submit();
    }
  });
}
