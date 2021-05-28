const express = require('express');
const { body } = require('express-validator');

const adminController = require('../controllers/admin');
const Pro = require('../models/pro');

//

const router = express.Router();

router.get('/', (req, res, next) => {
  res.redirect('/admin/doctypes');
});

router.get('/register-pro', adminController.getRegisterPro);

router.post(
  '/register-pro',
  [
    body('company')
      .trim()
      .custom((value, { req }) => {
        if (value.length < 1 || value.length > 128) {
          return Promise.reject(
            "Le nom de l'entreprise doit contenir entre 1 et 128 caractères."
          );
        }
        return true;
      }),

    body('email')
      .normalizeEmail({ gmail_remove_dots: false })
      .isEmail()
      .withMessage('Merci de saisir un e-mail valide.')
      .custom((value, { req }) => {
        return Pro.findOne({ email: value }).then((proDoc) => {
          if (proDoc) {
            return Promise.reject(
              'Un professionnel avec cet e-mail est déjà inscrit.'
            );
          }
          return true;
        });
      }),
    body('password')
      .trim()
      .isStrongPassword()
      .withMessage(
        'Le mot de passe doit contenir au moins 8 caractères, dont : une minuscule, une majuscule, un chiffre et un symbole.'
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
  adminController.postRegisterPro
);

router.get('/doctypes', adminController.getDoctypes);

router.get('/add-doctype', adminController.getAddDoctype);

router.post(
  '/add-doctype',
  [
    body('title', 'Le titre doit contenir entre 4 et 80 caractères.')
      .trim()
      .isLength({ min: '4', max: '80' }),
  ],
  adminController.postAddDoctype
);

router.get('/doctypes/:doctypeId', adminController.getEditDoctypeTitle);

router.post(
  '/doctypes/:doctypeId',
  [
    body('title', 'Le titre doit contenir entre 4 et 80 caractères.')
      .trim()
      .isLength({ min: '4', max: '80' }),
  ],
  adminController.postEditDoctypeTitle
);

module.exports = router;
