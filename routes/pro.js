const express = require('express');
const { body } = require('express-validator');

//

const proController = require('../controllers/pro');
const isProAuth = require('../middleware/is-pro-auth');

//

const router = express.Router();

router.get('/loan-files', isProAuth, proController.getLoanFiles);

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

router.get('/edit-client/:clientEmail', isProAuth, proController.getEditClient);

router.post(
  '/edit-client',
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
  proController.postEditClient
);

router.get(
  '/edit-loan-file/:clientId',
  isProAuth,
  proController.getEditLoanFile
);

router.post('/edit-loan-file', isProAuth, proController.postEditLoanFile);

router.get('/edit-request/:loanFileId', isProAuth, proController.getEditRequest);

module.exports = router;
