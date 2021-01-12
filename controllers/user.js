exports.getDocuments = (req, res, next) => {
  res.render('user/documents', {
    pageTitle: 'Mes documents',
    path: '/documents',
  });
};

exports.getAddDocument = (req, res, next) => {
  res.render('user/add-document', {
    pageTitle: 'Nouveau document',
    path: '/documents',
  });
};
