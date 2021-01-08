exports.getDocuments = (req, res, next) => {
  console.log('USER CONTROLLER : ', req.user.email);
  res.render('user/documents', {
    pageTitle: 'Mes documents',
    path: '/documents',
    user: req.user,
  });
};
