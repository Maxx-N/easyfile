const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');

const User = require('../models/user');
const LoanFile = require('../models/loan-file');
const Doctype = require('../models/doctype');
const RequestedDoc = require('../models/requested-doc');
const Request = require('../models/request');
const helpers = require('../helpers');

//

exports.getLoanFiles = async (req, res, next) => {
  try {
    const pro = await req.pro.populate('loanFileIds');
    const loanFiles = [];

    for (let loanFileId of pro.loanFileIds) {
      let file = await LoanFile.findById(loanFileId).populate('userId');
      loanFiles.push(file);
    }

    res.render('pro/loan-files', {
      pageTitle: 'Dossiers de prêt',
      path: '/loan-files',
      loanFiles: loanFiles,
    });
  } catch (err) {
    return next(err);
  }
};

exports.getLoanFile = async (req, res, next) => {
  const loanFileId = req.params.loanFileId;

  try {
    const loanFile = await LoanFile.findById(loanFileId)
      .populate('userId')
      .populate({
        path: 'requestIds',
        populate: { path: 'requestedDocIds', populate: 'doctypeId' },
      });

    if (!loanFile) {
      const error = new Error("Le dossier de prêt n'a pu être trouvé.");
      error.statusCode = 404;
      throw error;
    }

    res.render('pro/loan-file', {
      pageTitle: 'Dossier de prêt',
      path: '/loan-files',
      loanFile: loanFile,
      makeGroupsOfRequestedDocs: helpers.makeGroupsOfRequestedDocs,
      displayRequestedDocAge: helpers.displayRequestedDocAge,
    });
  } catch (err) {
    next(err);
  }
};

exports.postDeleteLoanFile = async (req, res, next) => {
  const pro = req.pro;
  const loanFileId = req.params.loanFileId;
  try {
    const loanFile = await LoanFile.findById(loanFileId);
    if (!loanFile) {
      const error = new Error("Le dossier de prêt n'a pu être trouvé.");
      error.statusCode = 404;
      throw error;
    }

    const user = await User.findById(loanFile.userId);
    if (!user) {
      const error = new Error(
        "L'utilisateur correspondant à ce dossier de prêt n'a pu être trouvé."
      );
      error.statusCode = 404;
      throw error;
    }

    user.loanFileIds = user.loanFileIds.filter((fileId) => {
      return fileId.toString() !== loanFile._id.toString();
    });
    await user.save();

    pro.loanFileIds = pro.loanFileIds.filter((fileId) => {
      return fileId.toString() !== loanFile._id.toString();
    });
    await pro.save();

    for (let requestId of loanFile.requestIds) {
      const request = await Request.findById(requestId);
      for (let requestedDocId of request.requestedDocIds) {
        await RequestedDoc.deleteOne({ _id: requestedDocId });
      }
      await request.deleteOne({ _id: requestId });
    }

    await LoanFile.deleteOne({ _id: loanFile._id });

    res.redirect('/pro/loan-files');
  } catch (err) {
    next(err);
  }
};

exports.getEnterClientEmail = (req, res, next) => {
  res.render('pro/enter-client-email', {
    pageTitle: 'Dossiers de prêt',
    path: '/loan-files',
    oldInput: {
      email: '',
    },
    validationErrors: [],
    errorMessages: [],
  });
};

exports.postEnterClientEmail = async (req, res, next) => {
  const email = req.body.email;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => {
      return err.msg;
    });
    return res.render('pro/enter-client-email', {
      pageTitle: 'Dossiers de prêt',
      path: '/loan-files',
      oldInput: {
        email: email,
      },
      validationErrors: errors.array(),
      errorMessages: errorMessages,
    });
  }

  try {
    const user = await User.findOne({ email: email });

    if (user) {
      return res.redirect(`/pro/add-loan-file/${user._id}`);
    }

    return res.redirect(`/pro/add-client/${email}`);
  } catch (err) {
    next(err);
  }
};

exports.getAddClient = (req, res, next) => {
  const email = req.params.clientEmail;
  return res.render('pro/add-client', {
    pageTitle: 'Nouveau client',
    path: '/clients',
    email: email,
    oldInput: {
      password: '',
      confirmPassword: '',
    },
    errorMessages: [],
    validationErrors: [],
  });
};

exports.postAddClient = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => {
      return err.msg;
    });
    return res.render('pro/add-client', {
      pageTitle: 'Nouveau client',
      path: '/clients',
      email: email,
      oldInput: {
        password: password,
        confirmPassword: confirmPassword,
      },
      errorMessages: errorMessages,
      validationErrors: errors.array(),
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      email: email,
      password: hashedPassword,
    });
    await user.save((err) => {
      if (err) {
        err.message =
          "Un problème est survenu sur le serveur et l'utilisateur n'a pas pu être enregistré. Nous travaillons à résoudre le problème et vous prions de bien vouloir nous excuser.";
        throw err;
      }
    });

    res.redirect(`/pro/add-loan-file/${user._id}`);
  } catch (err) {
    next(err);
  }
};

exports.getAddLoanFile = async (req, res, next) => {
  const clientId = req.params.clientId;

  try {
    const user = await User.findById(clientId);
    if (!user) {
      const error = new Error("L'utilisateur n'a pas pu être trouvé.");
      error.statusCode = 404;
      throw error;
    }

    res.render('pro/add-loan-file', {
      pageTitle: 'Nouveau dossier de prêt',
      path: '/loan-files',
      user: user,
    });
  } catch (err) {
    next(err);
  }
};

exports.postAddLoanFile = async (req, res, next) => {
  const choice = req.body.choiceOfAction;
  const pro = req.pro;

  try {
    const user = await User.findById(req.body.userId);
    if (!user) {
      const error = new Error('Aucun utilisateur trouvé.');
      error.statusCode = 404;
      throw error;
    }

    const loanFile = new LoanFile({
      userId: user._id,
      proId: req.pro._id,
      status: 'pending',
    });
    await loanFile.save();
    user.loanFileIds.push(loanFile._id);
    await user.save();

    pro.loanFileIds.push(loanFile._id);
    await pro.save();

    if (choice === 'backHome') {
      return res.redirect('/');
    }

    await loanFile.populate('userId').execPopulate();

    res.redirect(`/pro/add-request/${loanFile._id}`);
  } catch (err) {
    next(err);
  }
};

exports.getAddRequest = async (req, res, next) => {
  try {
    const doctypes = await Doctype.find();
    if (!doctypes) {
      const error = new Error('Aucun type de document trouvé.');
      error.statusCode = 404;
      throw err;
    }
    res.render('pro/add-request', {
      pageTitle: 'Création de requête',
      path: '/loan-files',
      doctypes: doctypes,
      loanFileId: req.params.loanFileId,
    });
  } catch (err) {
    next(err);
  }
};

exports.postAddRequest = async (req, res, next) => {
  const loanFileId = req.body.loanFileId;
  const request = new Request({
    loanFileId: loanFileId,
    isAccepted: false,
  });

  try {
    const loanFile = await LoanFile.findById(loanFileId);
    loanFile.requestIds.push(request._id);
    await loanFile.save();
  } catch (err) {
    err.message =
      'Un problème est survenu lors de la récupération du dossier de prêt. Nous travaillons à le réparer.';
    return next(err);
  }

  const docInputs = req.body.requestedDocs;
  const docArrays = [];

  if (typeof docInputs === 'string') {
    docArrays.push(docInputs.split('///'));
  } else {
    for (let doc of docInputs) {
      docArrays.push(doc.split('///'));
    }
  }

  let docObjects = [];
  for (let doc of docArrays) {
    const doctypeId = doc[0];
    let title;
    let age;
    let docGroupId;

    if (doc[1] === '0') {
      title = null;
    } else {
      title = doc[1];
    }

    if (doc[2] === '0') {
      age = null;
    } else {
      age = +doc[2];
    }

    if (doc[3] === '0') {
      docGroupId = null;
    } else {
      docGroupId = +doc[3];
    }

    docObjects.push({
      doctypeId: doctypeId,
      title: title,
      age: age,
      docGroupId: docGroupId,
    });
  }

  const repeatedGroupIds = docObjects.map((obj) => {
    return obj.docGroupId;
  });
  const groupIds = [];
  for (const id of repeatedGroupIds) {
    if (!groupIds.includes(id)) {
      groupIds.push(id);
    }
  }

  for (let groupId of groupIds) {
    const group = docObjects.filter((obj) => {
      return obj.docGroupId === groupId;
    });
    const requestedDocs = [];
    for (let doc of group) {
      const requestedDoc = new RequestedDoc({
        requestId: request._id,
        title: doc.title,
        age: doc.age,
        doctypeId: doc.doctypeId,
      });
      requestedDocs.push(requestedDoc);
    }

    for (let requestedDoc of requestedDocs) {
      let siblingDocIds;
      if (groupId) {
        siblingDocIds = requestedDocs
          .filter((d) => {
            return d !== requestedDoc;
          })
          .map((d) => {
            return d._id;
          });
      } else {
        siblingDocIds = [];
      }
      requestedDoc.alternativeRequestedDocIds = siblingDocIds;

      try {
        await requestedDoc.save();
        request.requestedDocIds.push(requestedDoc._id);
      } catch (err) {
        err.message =
          'Un problème est survenu lors de la sauvegarde des documents requis. Nous travaillons à le réparer.';
        return next(err);
      }
    }
  }

  try {
    await request.save();
    res.redirect(`/pro/loan-files/${loanFileId}`);
  } catch (err) {
    if (!err.message) {
      err.message =
        'Un problème est survenu lors de la sauvegarde de votre requête. Nous travaillons à le réparer.';
    }
    next(err);
  }
};

exports.postDeleteRequest = async (req, res, next) => {
  const requestId = req.params.requestId;

  try {
    const request = await Request.findById(requestId);
    if (!request) {
      const error = new Error('Requête non trouvée.');
      error.statusCode = 404;
      throw error;
    }

    const loanFile = await LoanFile.findById(request.loanFileId);
    if (!loanFile) {
      const error = new Error('Dossier de prêt non trouvé.');
      error.statusCode = 404;
      throw error;
    }

    await RequestedDoc.deleteMany({ requestId: request._id });
    await Request.deleteOne({ _id: requestId });

    loanFile.requestIds = loanFile.requestIds.filter((id) => {
      return id.toString() !== requestId.toString();
    });
    await loanFile.save();

    res.redirect(`/pro/loan-files/${loanFile._id}`);
  } catch (err) {
    if (!err.message) {
      err.message =
        'Un problème est survenu lors de la suppression de votre requête. Nous travaillons à le réparer.';
    }
    return next(err);
  }
};
