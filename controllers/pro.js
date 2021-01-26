exports.getLoanFiles = (req, res, next) => {
  res.render('pro/loan-files', {
    pageTitle: 'Dossiers de prêt',
    path: '/loan-files',
  });
};
