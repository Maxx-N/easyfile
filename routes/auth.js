const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user');
const Pro = require('../models/pro');
const isAuth = require('../middleware/is-auth');

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
      .normalizeEmail({ gmail_remove_dots: false })
      .isEmail()
      .withMessage('Merci de saisir un e-mail valide.')
      .custom((value, { req }) => {
        const isClient = req.body.isBank !== '1';
        if (isClient) {
          return User.findOne({ email: value }).then((userDoc) => {
            if (userDoc) {
              return Promise.reject(
                'Un utilisateur avec cet e-mail est déjà inscrit.'
              );
            }
          });
        }
        if (!isClient) {
          return Pro.findOne({ email: value }).then((proDoc) => {
            if (proDoc) {
              return Promise.reject(
                'Un professionnel avec cet e-mail est déjà inscrit.'
              );
            }
          });
        }
      }),
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
  [
    body('email').normalizeEmail({ gmail_remove_dots: false }),
    body('password').trim(),
  ],
  authController.postLogin
);

router.post('/logout', authController.postLogout);

router.get('/edit-profile', authController.getEditProfile);

router.post(
  '/edit-profile',
  isAuth,
  [
    body('firstName')
      .trim()
      .custom((value, { req }) => {
        if (value) {
          if (value.length < 2 || value.length > 50) {
            return Promise.reject(
              'Si vous indiquez un prénom, sa longueur doit être comprise en 2 et 50 caractères.'
            );
          }
        }
        return true;
      }),
    body('lastName')
      .trim()
      .custom((value, { req }) => {
        if (value) {
          if (value.length < 2 || value.length > 50) {
            return Promise.reject(
              'Si vous indiquez un nom, sa longueur doit être comprise en 2 et 50 caractères.'
            );
          }
        }
        return true;
      }),
  ],
  authController.postEditProfile
);

module.exports = router;
