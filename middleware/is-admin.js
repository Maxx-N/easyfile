const ADMIN_EMAIL = require('../private').ADMIN_EMAIL;

module.exports = (req, res, next) => {
  if (!req.session.user || req.session.user.email !== ADMIN_EMAIL) {
    return res.redirect('/');
  }
  next();
};
