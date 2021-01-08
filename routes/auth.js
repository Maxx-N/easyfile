const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user');

//

const router = express.Router();

router.get('', (req, res, next) => {
  res.redirect('/auth/login');
});

router.get('/signup', authController.getSignup);

router.post(
  '/signup',
  [
    body('email')
      .normalizeEmail()
      .isEmail()
      .withMessage('Merci de saisir un e-mail valide.')
      .custom((value) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject();
          }
        });
      })
      .withMessage('Un utilisateur avec cet e-mail est déjà inscrit.'),
    body('password')
      .trim()
      .isStrongPassword()
      .withMessage(
        'Votre mot de passe doit contenir au moins 8 caractères, dont : une minuscule, une majuscule, un chiffre et un symbole.'
      ),
    body('confirmPassword')
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          return false;
        }
        return true;
      })
      .withMessage('Les mots de passe saisis doivent être identiques.'),
  ],
  authController.postSignup
);

router.get('/login', authController.getLogin);

router.post(
  '/login',
  [body('email').normalizeEmail(), body('password').trim()],
  authController.postLogin
);

module.exports = router;
