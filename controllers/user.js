exports.getDocuments = (req, res, next) => {
  res.render('user/documents', {
    pageTitle: 'Mes documents',
    path: '/documents',
    user: req.user,
  });
};
