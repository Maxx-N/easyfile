const express = require('express');
const { body } = require('express-validator');

const userController = require('../controllers/user');
const isAuth = require('../middleware/is-auth');
const Doctype = require('../models/doctype');
const helpers = require('../helpers');

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
      .withMessage("Merci d'ajouter un type de document.")
      .custom(async (value, { req }) => {
        if (req.body.doctypeId) {
          const doctype = await Doctype.findById(value);
          if (doctype.isUnique) {
            const userDoctypeIds = await helpers.getUserDoctypeIds(req.user);
            if (
              userDoctypeIds.some(
                (docId) => docId.toString() === value.toString()
              )
            ) {
              console.log('NAN !');
              return Promise.reject(
                `Vous possédez déjà un document de type \"${doctype.title}\"`
              );
            }
          }
        }
      }),
    body('title')
      .trim()
      .custom(async (value, { req }) => {
        if (req.body.doctypeId) {
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
        }
      }),
  ],
  userController.postAddDocument
);

module.exports = router;
