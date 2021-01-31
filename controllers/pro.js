const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');

const User = require('../models/user');
const LoanFile = require('../models/loan-file');
const Doctype = require('../models/doctype');
const doctype = require('../models/doctype');

//

exports.getLoanFiles = async (req, res, next) => {
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
};

exports.getLoanFile = async (req, res, next) => {
  const loanFileId = req.params.loanFileId;

  try {
    const loanFile = await LoanFile.findById(loanFileId).populate('userId');

    if (!loanFile) {
      const error = new Error("Le dossier de prêt n'a pu être trouvé.");
      error.statusCode = 404;
      throw error;
    }

    res.render('pro/loan-file', {
      pageTitle: 'Dossier de prêt',
      path: '/loan-files',
      loanFile: loanFile,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteLoanFile = async (req, res, next) => {
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

    await LoanFile.deleteOne({ _id: loanFile._id });

    user.loanFileIds = user.loanFileIds.filter((fileId) => {
      return fileId.toString() !== loanFile._id.toString();
    });
    await user.save();

    pro.loanFileIds = pro.loanFileIds.filter((fileId) => {
      return fileId.toString() !== loanFile._id.toString();
    });
    await pro.save();

    res.redirect('/loan-files');
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
      return res.redirect(`/add-loan-file/${user._id}`);
    }

    return res.redirect(`/add-client/${email}`);
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

    res.redirect(`/add-loan-file/${user._id}`);
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

    // Mise à jour du User

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

    res.redirect(`/add-request/${loanFile._id}`);
  } catch (err) {
    next(err);
  }
};

exports.getAddRequest = async (req, res, next) => {
  try {
    const doctypes = await Doctype.find();
    if (!doctype) {
      const error = new Error('Aucun type de document trouvé.');
      error.statusCode = 404;
      throw err;
    }
    res.render('pro/add-request', {
      pageTitle: 'Création de requête',
      path: '/loan-files',
      doctypes: doctypes,
    });
  } catch (err) {
    next(err);
  }
};

exports.postAddRequest = (req, res, next) => {
};
