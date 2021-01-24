const fs = require('fs');

const { validationResult } = require('express-validator');

const Doctype = require('../models/doctype');
const Document = require('../models/document');
const helpers = require('../helpers');

//

exports.getDocuments = async (req, res, next) => {
  try {
    const documents = await Document.find({ userId: req.user._id }).populate(
      'doctypeId'
    );
    if (!documents) {
      const error = new Error('Aucun document trouvé');
      error.statusCode = 404;
      throw error;
    }
    res.render('user/documents', {
      pageTitle: 'Mes documents',
      path: '/documents',
      documents: documents,
      monthToString: helpers.monthToString,
      displayDate: helpers.displayDate,
      isPast: helpers.isPast,
      isPresent: helpers.isPresent,
    });
  } catch (err) {
    err.message =
      'Un problème est survenu lors de la récupération de vos documents. Merci de bien vouloir nous excuser et réessayer plus tard.';
    next(err);
  }
};

exports.getDocument = async (req, res, next) => {
  const documentId = req.param('documentId');
  try {
    const document = await Document.findById(documentId).populate(
      'doctypeId',
      'title'
    );

    if (!document) {
      const error = new Error(
        "Ce document n'a pas été trouvé. Merci de vérifier qu'il existe toujours."
      );
      error.statusCode = 404;
      throw error;
    }

    if (document.userId.toString() !== req.user._id.toString()) {
      const error = new Error(
        "Vous n'êtes pas autorisé à accéder au document demandé."
      );
      error.statusCode = 403;
      throw error;
    }

    res.render('user/document', {
      pageTitle: document.doctypeId.title,
      path: '/documents',
      document: document,
      displayDate: helpers.displayDate,
      monthToString: helpers.monthToString,
      isPresent: helpers.isPresent,
      isPast: helpers.isPast,
    });
  } catch (err) {
    next(err);
  }
};

exports.getAddDocument = async (req, res, next) => {
  try {
    const doctypes = await Doctype.find();
    res.render('user/add-document', {
      pageTitle: 'Nouveau document',
      path: '/documents',
      doctypes: doctypes,
      validationErrors: [],
      errorMessages: [],
      oldInput: {
        doctypeId: '',
        issuanceDate: '',
        expirationDate: '',
        month: '',
        year: '',
        title: '',
      },
    });
  } catch (err) {
    err.message =
      'Un problème est survenu lors de la récupération des types de documents. Merci de bien vouloir nous excuser et réessayer plus tard.';
    next(err);
  }
};

exports.postAddDocument = async (req, res, next) => {
  const doctypeId = req.body.doctypeId;
  const issuanceDate = req.body.issuanceDate
    ? new Date(req.body.issuanceDate)
    : null;
  const expirationDate = req.body.expirationDate
    ? new Date(req.body.expirationDate)
    : null;
  const month = req.body.month ? parseInt(req.body.month.split('-')[1]) : null;
  const title = req.body.title ? req.body.title : null;
  const file = req.file;

  const errors = validationResult(req);

  try {
    if (!errors.isEmpty() || !file) {
      const validationErrors = [];
      if (!errors.isEmpty()) {
        validationErrors.push(...errors.array());
      }
      if (file) {
        helpers.deleteFile(file.path);
      } else {
        validationErrors.push({
          msg: 'Vous devez sélectionner un fichier au format PDF.',
          param: 'file',
        });
      }

      const errorMessages = validationErrors.map((err) => err.msg);

      const doctypes = await Doctype.find();
      return res.status(422).render('user/add-document', {
        pageTitle: 'Nouveau document',
        path: '/documents',
        doctypes: doctypes,
        validationErrors: validationErrors,
        errorMessages: errorMessages,
        oldInput: {
          doctypeId: doctypeId,
          issuanceDate: req.body.issuanceDate,
          expirationDate: req.body.expirationDate,
          month: req.body.month,
          year: req.body.year,
          title: title,
        },
      });
    }

    const document = new Document({
      userId: req.user._id,
      doctypeId: doctypeId,
      fileUrl: file.path,
    });

    const doctype = await Doctype.findById(document.doctypeId);

    let year;
    if (doctype.periodicity === 'month') {
      year = req.body.month ? parseInt(req.body.month.split('-')[0]) : null;
    } else if (doctype.periodicity === 'year') {
      year = req.body.year ? parseInt(req.body.year) : null;
    }

    if (doctype.hasIssuanceDate) document.issuanceDate = issuanceDate;
    if (doctype.hasExpirationDate) document.expirationDate = expirationDate;
    if (doctype.periodicity === 'month') document.month = month;
    if (doctype.periodicity === 'month' || doctype.periodicity === 'year')
      document.year = year;
    if (!doctype.isUnique) document.title = title;

    await document.save();
    req.user.documentIds.push(document._id);
    await req.user.save();

    res.redirect('/documents');
  } catch (err) {
    err.message =
      "Le document n'a pas pu être ajouté en raison d'un problème sur le serveur. Merci de bien vouloir nous excuser et réessayer plus tard.";
    next(err);
  }
};
