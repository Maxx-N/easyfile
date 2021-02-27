const documents = document.getElementsByClassName('document-item');

for (let doc of documents) {
  doc.addEventListener('click', onNavigateToDetail);
}

function onNavigateToDetail() {
  const isPro =
    document.getElementById('isPro').getAttribute('isPro') === 'true';

  window.location.href = `${isPro ? '/pro' : ''}/documents/${this.id}`;
}
