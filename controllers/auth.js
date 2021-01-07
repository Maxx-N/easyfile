exports.getSignup = (req, res, next) => {
  res.render('auth/signup', { pageTitle: 'Inscription', path: '/signup' });
};

exports.getLogin = (req, res, next) => {
  res.render('auth/login', { pageTitle: 'Connexion', path: '/login' });
};
