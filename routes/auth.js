const express = require('express');

const authController = require('../controllers/auth');

//

const router = express.Router();

router.get('', (req, res, next) => {
  res.redirect('/auth/login');
});

router.get('/signup', authController.getSignup);

router.get('/login', authController.getLogin);

module.exports = router;
