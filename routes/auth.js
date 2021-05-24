const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user');
const Pro = require('../models/pro');
const isAuth = require('../middleware/is-auth');
const isClientAuth = require('../middleware/is-client-auth');
const isProAuth = require('../middleware/is-pro-auth');
const helpers = require('../helpers');

//

const router = express.Router();

router.get('/signup', authController.getSignup);

router.post(
  '/signup',
  [
    body('firstName')
      .trim()
      .custom((value, { req }) => {
        const isClient = req.body.isPro !== '1';
        if (isClient && (value.length < 2 || value.length > 16)) {
          return Promise.reject(
            'Votre prénom doit contenir entre 2 et 16 caractères.'
          );
        }
        return true;
      }),
    body('lastName')
      .trim()
      .custom((value, { req }) => {
        const isClient = req.body.isPro !== '1';
        if (isClient && (value.length < 2 || value.length > 32)) {
          return Promise.reject(
            'Votre nom doit contenir entre 2 et 32 caractères.'
          );
        }
        return true;
      }),
    body('company')
      .trim()
      .custom((value, { req }) => {
        const isPro = req.body.isPro === '1';
        if (isPro && (value.length < 2 || value.length > 32)) {
          return Promise.reject(
            'Le nom de votre entreprise doit contenir entre 2 et 32 caractères.'
          );
        }
        return true;
      }),
    body('email')
      .normalizeEmail({ gmail_remove_dots: false })
      .isEmail()
      .withMessage('Merci de saisir un e-mail valide.')
      .custom((value, { req }) => {
        const isClient = req.body.isPro !== '1';
        if (isClient) {
          return User.findOne({ email: value }).then((userDoc) => {
            if (userDoc) {
              return Promise.reject(
                'Un utilisateur avec cet e-mail est déjà inscrit.'
              );
            }
            return true;
          });
        }
        if (!isClient) {
          return Pro.findOne({ email: value }).then((proDoc) => {
            if (proDoc) {
              return 'Un professionnel avec cet e-mail est déjà inscrit.';
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

router.post('/unsubscribe', isAuth, authController.postUnsubscribe);

router.get('/edit-profile', authController.getEditProfile);

router.post(
  '/edit-profile',
  isClientAuth,
  [
    body('firstName', 'Votre prénom doit contenir entre 2 et 16 caractères.')
      .trim()
      .isLength({ min: 2, max: 16 }),
    body('lastName', 'Votre nom doit contenir entre 2 et 32 caractères.')
      .trim()
      .isLength({ min: 2, max: 32 }),
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

router.post(
  '/edit-pro-profile',
  isProAuth,
  [
    body(
      'company',
      'Le nom de votre entreprise doit contenir entre 2 et 32 caractères.'
    )
      .trim()
      .isLength({ min: 2, max: 32 }),
  ],
  authController.postEditProProfile
);

router.get('/edit-password', authController.getEditPassword);

router.post(
  '/edit-password',
  isAuth,
  [
    body('password')
      .trim()
      .isStrongPassword()
      .withMessage(
        'Votre nouveau mot de passe doit contenir au moins 8 caractères, dont : une minuscule, une majuscule, un chiffre et un symbole.'
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
  authController.postEditPassword
);

module.exports = router;
