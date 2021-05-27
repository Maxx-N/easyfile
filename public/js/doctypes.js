const doctypes = document.getElementsByClassName('doctype-item');

for (const dt of doctypes) {
  dt.addEventListener('click', onNavigateToDetail);
}

function onNavigateToDetail() {
  window.location.href = `/admin/doctypes/${this.id}`;
}
