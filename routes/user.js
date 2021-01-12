const express = require('express');
const { body } = require('express-validator');

const userController = require('../controllers/user');
const isAuth = require('../middleware/is-auth');

//

const router = express.Router();

router.get('/documents', isAuth, userController.getDocuments);

router.get('/add-document', isAuth, userController.getAddDocument);

router.post(
  '/add-document',
  isAuth,
  [
    body('fileUrl').not().isEmpty().withMessage("Merci d'ajouter un fichier."),
    body('doctypeId')
      .not()
      .isEmpty()
      .withMessage("Merci d'ajouter un type de document."),
  ],
  userController.postAddDocument
);

module.exports = router;
