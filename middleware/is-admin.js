module.exports = (req, res, next) => {
  if (
    !req.session.user ||
    req.session.user.email !== 'max.easyfile@gmail.com'
  ) {
    return res.redirect('/');
  }
  next();
};
