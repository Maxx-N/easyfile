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
              return Promise.reject(
                `Votre ${doctype.title.toLowerCase()} est déjà en ligne.`
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
                `Merci de donner un titre à votre ${doctype.title.toLowerCase()} : Vous pouvez en posséder plusieurs.`
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
    body('issuanceDate')
      .custom(async (value, { req }) => {
        if (req.body.doctypeId) {
          const doctype = await Doctype.findById(req.body.doctypeId);
          if (doctype.hasIssuanceDate && !value) {
            return Promise.reject(
              `Votre ${doctype.title.toLowerCase()} doit avoir une date d'émission.`
            );
          }
        }
      })
      .custom(async (value, { req }) => {
        if (req.body.doctypeId) {
          const doctype = await Doctype.findById(req.body.doctypeId);
          if (doctype.hasIssuanceDate && value) {
            const issuanceDate = new Date(value);

            if (helpers.isFuture(issuanceDate)) {
              return Promise.reject(
                `Votre ${doctype.title.toLowerCase()} ne peut pas avoir été émis(e) dans le futur...`
              );
            }
          }
        }
      }),
  ],
  userController.postAddDocument
);

module.exports = router;
