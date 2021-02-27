const swapFolders = document.getElementsByClassName('swap-folder-item');

for (let sf of swapFolders) {
  sf.addEventListener('click', onNavigateToDetail);
}

function onNavigateToDetail() {
  const isPro =
    document.getElementById('isPro').getAttribute('isPro') === 'true';

  window.location.href = `${isPro ? '/pro' : ''}/swap-folders/${this.id}`;
}
