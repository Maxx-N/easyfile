exports.getSignup = (req, res, next) => {
  res.render('auth/signup', { pageTitle: 'Inscription' });
};

exports.getLogin = (req, res, next) => {
  res.render('auth/login', { pageTitle: 'Connexion' });
};
