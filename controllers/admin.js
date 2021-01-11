exports.getDoctypes = (req, res, next) => {
  res.render('admin/doctypes', {
    pageTitle: 'Doc Types',
    path: '/admin/doctypes',
  });
};
