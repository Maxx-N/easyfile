module.exports = (req, res, next) => {
    if (!req.session.pro) {
      return res.redirect('/');
    }
    next();
  };