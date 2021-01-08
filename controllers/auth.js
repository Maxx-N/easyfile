const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');

const User = require('../models/user');

//

exports.getSignup = (req, res, next) => {
  res.render('auth/signup', {
    pageTitle: 'Inscription',
    path: '/signup',
    errorMessages: [],
    validationErrors: [],
    oldInput: {
      email: '',
      password: '',
      confirmPassword: '',
      isBank: '0',
    },
  });
};

exports.postSignup = async (req, res, next) => {
  const isClient = req.body.isBank === '0';
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => {
      return err.msg;
    });
    return res.status(422).render('auth/signup', {
      pageTitle: 'Inscription',
      path: '/signup',
      errorMessages: errorMessages,
      validationErrors: errors.array(),
      oldInput: {
        email: email,
        password: password,
        confirmPassword: confirmPassword,
        isBank: req.body.isBank,
      },
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    if (isClient) {
      const user = new User({
        email: email,
        password: hashedPassword,
      });
      await user.save();
      return res.redirect('/documents');
    }
  } catch (err) {
    console.log(err.message);
  }
  res.redirect('/auth/signup');
};

exports.getLogin = (req, res, next) => {
  res.render('auth/login', { pageTitle: 'Connexion', path: '/login' });
};
