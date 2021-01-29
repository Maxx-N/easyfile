const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');

const User = require('../models/user');
const LoanFile = require('../models/loan-file');

//

exports.getLoanFiles = (req, res, next) => {
  res.render('pro/loan-files', {
    pageTitle: 'Dossiers de prêt',
    path: '/loan-files',
  });
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
      return res.render('pro/edit-loan-file', {
        pageTitle: 'Nouveau dossier de prêt',
        path: '/loan-files',
        user: user,
      });
    }

    if (!user) {
      return res.render('pro/edit-client', {
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
    }

    res.render('pro/enter-client-email', {
      pageTitle: 'Dossiers de prêt',
      path: '/loan-files',
      oldInput: {
        email: '',
      },
      validationErrors: [],
      errorMessages: [],
    });
  } catch (err) {
    next(err);
  }
};

exports.postEditClient = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => {
      return err.msg;
    });
    return res.render('pro/edit-client', {
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

    res.render('pro/edit-loan-file', {
      pageTitle: 'Nouveau dossier de prêt',
      path: '/loan-files',
      user: user,
    });
  } catch (err) {
    next(err);
  }
};

exports.postEditLoanFile = async (req, res, next) => {
  const choice = req.body.choiceOfAction;

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

    if (choice === 'backHome') {
      return res.redirect('/');
    }

    await loanFile.populate('userId').execPopulate();

    res.render('pro/edit-request', {
      pageTitle: 'Création de requête',
      path: '/loan-files',
    });
  } catch (err) {
    next(err);
  }
};
