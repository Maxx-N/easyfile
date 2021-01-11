const { validationResult } = require('express-validator');

const Doctype = require('../models/doctype');

//

exports.getDoctypes = (req, res, next) => {
  res.render('admin/doctypes', {
    pageTitle: 'Doc Types',
    path: '/admin/doctypes',
  });
};

exports.getAddDoctype = (req, res, next) => {
  res.render('admin/add-doctype', {
    pageTitle: 'Nouveau Doctype',
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

exports.postDoctype = async (req, res, next) => {
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

    return res.render('admin/add-doctype', {
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
