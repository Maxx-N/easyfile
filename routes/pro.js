const express = require('express');
const { body } = require('express-validator');

//

const proController = require('../controllers/pro');
const isProAuth = require('../middleware/is-pro-auth');

//

const router = express.Router();

router.get('/swap-folders', isProAuth, proController.getSwapFolders);

router.get('/swap-folders/:swapFolderId', isProAuth, proController.getSwapFolder);

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

router.get('/add-swap-folder/:clientId', isProAuth, proController.getAddSwapFolder);

router.post('/add-swap-folder', isProAuth, proController.postAddSwapFolder);

router.get('/edit-request/:requestId', isProAuth, proController.getEditRequest);

router.post('/edit-request', isProAuth, proController.postEditRequest);

router.post('/reset-request/:requestId', isProAuth, proController.postResetRequest)

module.exports = router;
