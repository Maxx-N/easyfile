const express = require('express');
const { body } = require('express-validator');

const userController = require('../controllers/user');
const isAuth = require('../middleware/is-auth');
const Doctype = require('../models/doctype');
const helpers = require('../helpers');

//

const router = express.Router();

router.get('/documents', isAuth, userController.getDocuments);

router.get('/documents/:documentId', isAuth, userController.getDocument);

router.get('/add-document', isAuth, userController.getEditDocument);

router.get(
  '/edit-document/:documentId',
  isAuth,
  userController.getEditDocument
);

router.post(
  '/edit-document',
  isAuth,
  [
    body('doctypeId')
      .not()
      .isEmpty()
      .withMessage("Merci d'ajouter un type de document.")
      .custom(async (value, { req }) => {
        if (req.body.doctypeId && !req.query.edit) {
          const doctype = await Doctype.findById(value);
          if (doctype.isUnique) {
            const userDoctypeIds = await helpers.getUserDoctypeIds(req.user);
            if (
              userDoctypeIds.some(
                (docId) => docId.toString() === value.toString()
              )
            ) {
              return Promise.reject(
                `Votre ${doctype.title.toLowerCase()} est un document unique que vous avez déjà mis en ligne. Pour le remplacer, vous pouvez le modifier directement.`
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
    body('issuanceDate').custom(async (value, { req }) => {
      if (req.body.doctypeId) {
        const doctype = await Doctype.findById(req.body.doctypeId);
        if (doctype.hasIssuanceDate) {
          if (!value) {
            return Promise.reject(
              `Votre ${doctype.title.toLowerCase()} doit avoir une date d'émission.`
            );
          } else {
            const issuanceDate = new Date(value);

            if (helpers.isFuture(issuanceDate)) {
              return Promise.reject(
                `Votre ${doctype.title.toLowerCase()} ne peut pas avoir été émis(e) dans le futur.`
              );
            }
          }
        }
      }
    }),
    body('expirationDate').custom(async (value, { req }) => {
      if (req.body.doctypeId) {
        const doctype = await Doctype.findById(req.body.doctypeId);
        if (doctype.hasExpirationDate) {
          if (!value) {
            return Promise.reject(
              `Votre ${doctype.title.toLowerCase()} doit avoir une date d'expiration.`
            );
          } else {
            const expirationDate = new Date(value);

            if (doctype.hasIssuanceDate && req.body.issuanceDate) {
              const issuanceDate = new Date(req.body.issuanceDate);

              if (expirationDate < issuanceDate) {
                return Promise.reject(
                  `La date d'expiration de votre ${doctype.title.toLowerCase()} ne peut pas être antérieure à sa date d'émission.`
                );
              }
            }

            if (helpers.isPast(expirationDate)) {
              return Promise.reject(
                `Si votre ${doctype.title.toLowerCase()} a déjà expiré, vous ne pouvez pas l'ajouter.`
              );
            }
          }
        }
      }
    }),
    body('month').custom(async (value, { req }) => {
      if (req.body.doctypeId) {
        const doctype = await Doctype.findById(req.body.doctypeId);
        if (doctype.periodicity === 'month') {
          if (!value) {
            return Promise.reject(
              `Votre ${doctype.title.toLowerCase()} est un document mensuel qui doit avoir un mois et une année.`
            );
          } else {
            const selectedYear = parseInt(value.split('-')[0]);
            const selectedMonth = parseInt(value.split('-')[1]);
            const currentYear = helpers.getCurrentDate().getFullYear();
            const currentMonth = helpers.getCurrentDate().getMonth() + 1;

            if (
              selectedYear > currentYear ||
              (selectedYear === currentYear && selectedMonth > currentMonth)
            ) {
              return Promise.reject(
                `Votre ${doctype.title.toLowerCase()} ne peut concerner un mois futur.`
              );
            }
          }
        }
      }
    }),
    body('year').custom(async (value, { req }) => {
      if (req.body.doctypeId) {
        const doctype = await Doctype.findById(req.body.doctypeId);
        if (doctype.periodicity === 'year') {
          if (!value) {
            return Promise.reject(
              `Votre ${doctype.title.toLowerCase()} est un document annuel qui doit avoir une année.`
            );
          } else {
            const selectedYear = parseInt(value);
            const currentYear = helpers.getCurrentDate().getFullYear();

            if (selectedYear > currentYear) {
              return Promise.reject(
                `Votre ${doctype.title.toLowerCase()} ne peut concerner une année future.`
              );
            }
          }
        }
      }
    }),
  ],
  userController.postEditDocument
);

router.post(
  '/delete-document/:documentId',
  isAuth,
  userController.postDeleteDocument
);

router.get('/swap-folders', isAuth, userController.getSwapFolders);

router.get('/swap-folders/:swapFolderId', isAuth, userController.getSwapFolder);

router.post(
  '/add-documents-to-swap-folders/:swapFolderId',
  isAuth,
  userController.postAddDocumentsToSwapFolder
);

router.post(
  '/delete-documents-from-swap-folders/:swapFolderId',
  isAuth,
  userController.postDeleteDocumentsFromSwapFolder
);

module.exports = router;
