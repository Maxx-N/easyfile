const express = require('express');

//

const router = express.Router();

router.get('', (req, res, next) => {
  res.redirect('/auth/login');
});

router.get('/signup', (req, res, next) => {
  res.render('auth/signup', { pageTitle: 'Inscription' });
});

router.get('/login', (req, res, next) => {
  res.render('auth/login', { pageTitle: 'Connexion' });
});

module.exports = router;
