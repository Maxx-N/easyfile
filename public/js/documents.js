const documents = document.getElementsByClassName('document-item');

for (let doc of documents) {
  doc.addEventListener('click', onNavigateToDetail);
}

function onNavigateToDetail() {
  window.location.href = `/documents/${this.id}`;
}
