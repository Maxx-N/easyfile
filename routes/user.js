const express = require('express');
const { body } = require('express-validator');

const userController = require('../controllers/user');
const isAuth = require('../middleware/is-auth');
const Doctype = require('../models/doctype');

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
    body('title').custom(async (value, { req }) => {
      const doctype = await Doctype.findById(req.body.doctypeId);
      if (!doctype.isUnique) {
        if (!value) {
          return Promise.reject(
            'Merci de donner un titre à ce document : Un utilisateur peut en posséder plusieurs de ce type.'
          );
        }
        if (value.length < 4 || value.length > 80) {
          return Promise.reject(
            'Le titre doit contenir entre 4 et 80 caractères.'
          );
        }
      }
    }),
  ],
  userController.postAddDocument
);

module.exports = router;
