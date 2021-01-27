const { validationResult } = require('express-validator');

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
      // const loanFile = new LoanFile({
      //   userId: user._id,
      //   proId: req.pro._id,
      //   status: 'pending',
      // });
      // await loanFile.save();
      // user.loanFileIds.push(loanFile._id);
      // await user.save();
      // await loanFile.populate('userId', '-documentIds -loanFileIds').execPopulate();

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
