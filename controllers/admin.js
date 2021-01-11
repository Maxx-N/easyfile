exports.getDoctypes = (req, res, next) => {
  res.render('admin/doctypes', {
    pageTitle: 'Doc Types',
    path: '/admin/doctypes',
  });
};

exports.getAddDoctype = (req, res, next) => {
  res.render('admin/add-doctype', {
    pageTitle: 'Nouveau Doctype',
    path: '/admin/doctypes',
  });
};
