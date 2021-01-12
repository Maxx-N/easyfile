const Doctype = require('../models/doctype');
const Document = require('../models/document');

//

exports.getDocuments = (req, res, next) => {
  res.render('user/documents', {
    pageTitle: 'Mes documents',
    path: '/documents',
  });
};

exports.getAddDocument = async (req, res, next) => {
  try {
    const doctypes = await Doctype.find();
    res.render('user/add-document', {
      pageTitle: 'Nouveau document',
      path: '/documents',
      doctypes: doctypes,
    });
  } catch (err) {
    err.message =
      'Un problème est survenu lors de la récupération des types de documents. Merci de bien vouloir nous excuser et réessayer plus tard.';
    next(err);
  }
};

exports.postAddDocument = async (req, res, next) => {
  const doctypeId = req.body.doctypeId;
  const fileUrl = req.body.fileUrl;
  const issuanceDate = req.body.issuanceDate
    ? new Date(req.body.issuanceDate)
    : null;
  const expirationDate = req.body.expirationDate
    ? new Date(req.body.expirationDate)
    : null;
  const month = req.body.month ? parseInt(req.body.month.split('-')[1]) : null;
  const title = req.body.title ? req.body.title : null;

  console.log(fileUrl);
  console.log(issuanceDate);
  console.log(expirationDate);
  console.log(month);
  console.log(title);

  let year;
  if (req.body.month) {
    year = parseInt(req.body.month.split('-')[0]);
  } else if (req.body.year) {
    year = parseInt(req.body.year);
  }

  const document = new Document({
    userId: req.user._id,
    doctypeId: doctypeId,
    fileUrl: fileUrl,
    issuanceDate: issuanceDate,
    expirationDate: expirationDate,
    month: month,
    year: year,
    title: title,
  });

  try {
    await document.save();
    res.redirect('/documents');
  } catch (err) {
    err.message =
      "Le document n'a pas pu être ajouté en raison d'un problème sur le serveur. Merci de bien vouloir nous excuser et réessayer plus tard.";
    next(err);
  }
};
