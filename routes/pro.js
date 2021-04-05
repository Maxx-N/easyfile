const express = require('express');
const { body } = require('express-validator');

//

const proController = require('../controllers/pro');
const isProAuth = require('../middleware/is-pro-auth');
const User = require('../models/user');

//

const router = express.Router();

router.get('/swap-folders', isProAuth, proController.getSwapFolders);

router.get(
  '/swap-folders/:swapFolderId',
  isProAuth,
  proController.getSwapFolder
);

router.post(
  '/delete-swap-folder/:swapFolderId',
  isProAuth,
  proController.postDeleteSwapFolder
);

router.get('/enter-client-email', isProAuth, proController.getEnterClientEmail);

router.post(
  '/enter-client-email',
  isProAuth,
  [
    body('email')
      .normalizeEmail({ gmail_remove_dots: false })
      .isEmail()
      .withMessage('Merci de saisir un e-mail valide.'),
  ],
  proController.postEnterClientEmail
);

router.get('/add-client/:clientEmail', isProAuth, proController.getAddClient);

router.post(
  '/add-client',
  isProAuth,
  [
    body('email')
      .normalizeEmail({ gmail_remove_dots: false })
      .isEmail()
      .withMessage('Merci de saisir un e-mail valide.')
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject(
              'Un utilisateur avec cet e-mail est déjà inscrit.'
            );
          }
          return true;
        });
      }),
    body('firstName', 'Le prénom doit contenir entre 2 et 16 caractères.')
      .trim()
      .isLength({ min: 2, max: 16 }),
    body('lastName', 'Le nom doit contenir entre 2 et 32 caractères.')
      .trim()
      .isLength({ min: 2, max: 32 }),
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
  proController.postAddClient
);

router.get(
  '/add-swap-folder/:clientId',
  isProAuth,
  proController.getAddSwapFolder
);

router.post('/add-swap-folder', isProAuth, proController.postAddSwapFolder);

router.get('/edit-request/:requestId', isProAuth, proController.getEditRequest);

router.post('/edit-request', isProAuth, proController.postEditRequest);

router.post(
  '/reset-request/:requestId',
  isProAuth,
  proController.postResetRequest
);

router.get('/documents/:documentId', isProAuth, proController.getDocument);

module.exports = router;
