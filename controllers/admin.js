const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');

const Pro = require('../models/pro');
const Doctype = require('../models/doctype');
const Document = require('../models/document');
const RequestedDoc = require('../models/requested-doc');
const helpers = require('../helpers');

//

exports.getRegisterPro = (req, res, next) => {
  res.render('admin/register-pro', {
    pageTitle: 'Inscription de professionnel',
    path: '/admin/register-pro',
    errorMessages: [],
    validationErrors: [],
    oldInput: {
      email: '',
      password: '',
      confirmPassword: '',
      company: '',
    },
  });
};

exports.postRegisterPro = async (req, res, next) => {
  const company = req.body.company;
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => {
      return err.msg;
    });
    return res.status(422).render('admin/register-pro', {
      pageTitle: 'Inscription de professionnel',
      path: '/admin/register-pro',
      errorMessages: errorMessages,
      validationErrors: errors.array(),
      oldInput: {
        email: email,
        password: password,
        confirmPassword: confirmPassword,
        company: req.body.company,
      },
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    const pro = new Pro({
      company: company,
      email: email,
      password: hashedPassword,
    });
    await pro.save();

    res.redirect('/');
  } catch (err) {
    return next(err);
  }
};

exports.getDoctypes = async (req, res, next) => {
  try {
    const doctypes = await Doctype.find();
    const documents = await Document.find();
    const requestedDocs = await RequestedDoc.find();
    helpers.sortByTitle(doctypes);
    res.render('admin/doctypes', {
      pageTitle: 'Les types de documents',
      path: '/admin/doctypes',
      doctypes: doctypes,
      documents: documents,
      requestedDocs: requestedDocs,
    });
  } catch (err) {
    err.message =
      'Un problème est survenu lors de la recherche des types de document sur le serveur.';
    next(err);
  }
};

exports.getAddDoctype = (req, res, next) => {
  res.render('admin/add-doctype', {
    pageTitle: 'Nouveau type de document',
    path: '/admin/doctypes',
    validationErrors: [],
    errorMessages: [],
    oldInput: {
      title: '',
      periodicity: 'none',
      isUnique: '1',
      hasIssuanceDate: '1',
      hasExpirationDate: '0',
    },
  });
};

exports.postAddDoctype = async (req, res, next) => {
  const title = req.body.title;
  const periodicity = req.body.periodicity;
  const isUnique = req.body.isUnique === '1';
  const hasIssuanceDate = req.body.hasIssuanceDate === '1';
  const hasExpirationDate = req.body.hasExpirationDate === '1';

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => {
      return err.msg;
    });

    return res.status(422).render('admin/add-doctype', {
      pageTitle: 'Nouveau Doctype',
      path: '/admin/doctypes',
      validationErrors: errors.array(),
      errorMessages: errorMessages,
      oldInput: {
        title: title,
        periodicity: periodicity,
        isUnique: req.body.isUnique,
        hasIssuanceDate: req.body.hasIssuanceDate,
        hasExpirationDate: req.body.hasExpirationDate,
      },
    });
  }

  try {
    const doctype = new Doctype({
      title: title,
      periodicity: periodicity,
      isUnique: isUnique,
      hasIssuanceDate: hasIssuanceDate,
      hasExpirationDate: hasExpirationDate,
    });
    await doctype.save();
    res.redirect('/admin/doctypes');
  } catch (err) {
    err.message =
      "Problème sur le serveur : L'ajout du type de document a échoué.";
    next(err);
  }
};

exports.getEditDoctypeTitle = async (req, res, next) => {
  const doctypeId = req.params.doctypeId;
  try {
    const doctype = await Doctype.findById(doctypeId);

    if (!doctype) {
      const error = new Error("Le type de document n'a pu être trouvé.");
      error.statusCode = 404;
      throw error;
    }

    res.render('admin/edit-doctype-title', {
      pageTitle: 'Modification de type de document',
      path: '/admin/doctypes',
      doctype: doctype,
      validationErrors: [],
      errorMessages: [],
      oldInput: {
        title: doctype.title,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.postEditDoctypeTitle = async (req, res, next) => {
  const doctypeId = req.params.doctypeId;
  const errors = validationResult(req);

  try {
    const doctype = await Doctype.findById(doctypeId);

    if (!errors.isEmpty()) {
      const errorsArray = errors.array();
      const errorMessages = errorsArray.map((err) => err.msg);

      return res.render('admin/edit-doctype-title', {
        pageTitle: 'Modification de type de document',
        path: '/admin/doctypes',
        doctype: doctype,
        validationErrors: errorsArray,
        errorMessages: errorMessages,
        oldInput: {
          title: req.body.title,
        },
      });
    }

    doctype.title = req.body.title;
    await doctype.save();

    res.redirect('/admin/doctypes');
  } catch (err) {
    next(err);
  }
};
