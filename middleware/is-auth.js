module.exports = (req, res, next) => {
  if (!req.session.user && !req.session.pro) {
    return res.redirect('/');
  }
  next();
};
