const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user');
const Pro = require('../models/pro');
const isAuth = require('../middleware/is-auth');
const helpers = require('../helpers');

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
    body(
      'firstName',
      'Si vous indiquez un prénom, sa longueur doit être comprise en 2 et 50 caractères.'
    )
      .if(body('firstName').notEmpty())
      .trim()
      .isLength({ min: 2, max: 50 }),
    body(
      'lastName',
      'Si vous indiquez un nom, sa longueur doit être comprise en 2 et 50 caractères.'
    )
      .if(body('lastName').notEmpty())
      .trim()
      .isLength({ min: 2, max: 50 }),
    body('birthDate').custom((value, { req }) => {
      if (value) {
        const birthDate = new Date(value);
        if (helpers.calculateAge(birthDate) < 18) {
          return Promise.reject('Vous devez avoir 18 ans.');
        }
      }
      return true;
    }),
    body('phoneNumber')
      .if(body('phoneNumber').notEmpty())
      .trim()
      .isNumeric()
      .withMessage(
        'Votre numéro de téléphone ne peut comporter que des chiffres, sans espace.'
      )
      .isLength({ min: 6, max: 20 })
      .withMessage(
        'Si vous indiquez un numéro de téléphone, sa longueur doit être comprise en 6 et 20 chiffres.'
      ),
    body('address')
      .if(body('address').notEmpty())
      .trim()
      .isLength({ min: 10, max: 255 })
      .withMessage(
        'Si vous indiquez une adresse, sa longueur doit être comprise en 10 et 255 caractères.'
      ),
  ],
  authController.postEditProfile
);

module.exports = router;
