const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');

const User = require('../models/user');
const Pro = require('../models/pro');

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
  const isClient = req.body.isBank !== '1';
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
      req.session.user = user;
      return req.session.save((err) => {
        if (err) {
          throw err;
        }
        res.redirect('/documents');
      });
    }
    if (!isClient) {
      const pro = new Pro({ email: email, password: hashedPassword });
      await pro.save();
      req.session.pro = pro;
      res.redirect('/loan-files');
    }
  } catch (err) {
    return next(err);
  }
};

exports.getLogin = (req, res, next) => {
  res.render('auth/login', {
    pageTitle: 'Connexion',
    path: '/login',
    errorMessages: [],
    oldInput: {
      email: '',
      password: '',
      isBank: '0',
    },
    validationErrors: [],
  });
};

exports.postLogin = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const isClient = !req.body.isBank;

  try {
    const errorsArray = [];
    let user;
    let pro;

    if (isClient) {
      user = await User.findOne({ email: email });
      if (!user) {
        errorsArray.push({
          param: 'email',
          msg: 'Cet e-mail ne correspond à aucun utilisateur particulier.',
        });
      } else {
        const doMatch = await bcrypt.compare(password, user.password);
        if (!doMatch) {
          errorsArray.push({
            param: 'password',
            msg: 'Mot de passe invalide.',
          });
        }
      }
    } else {
      pro = await Pro.findOne({ email: email });
      if (!pro) {
        errorsArray.push({
          param: 'email',
          msg: 'Cet e-mail ne correspond à aucun professionnel.',
        });
      } else {
        const doMatch = await bcrypt.compare(password, pro.password);
        if (!doMatch) {
          errorsArray.push({
            param: 'password',
            msg: 'Mot de passe invalide.',
          });
        }
      }
    }

    if (errorsArray.length > 0) {
      const errorMessages = errorsArray.map((err) => {
        return err.msg;
      });
      return res.status(422).render('auth/login', {
        pageTitle: 'Connexion',
        path: '/login',
        errorMessages: errorMessages,
        oldInput: {
          email: email,
          password: password,
          isBank: isClient ? '0' : '1',
        },
        validationErrors: errorsArray,
      });
    }
    if (isClient) {
      req.session.user = user;
      await req.session.save();
    } else {
      req.session.pro = pro;
      await req.session.save();
    }
    return res.redirect('/');
  } catch (err) {
    err.message =
      "L'authentification a échoué. Nous vous remercions de bien vouloir nous excuser et vous invitons à réessayer plus tard.";
    return next(err);
  }
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      err.message = "Nous n'avons pas réussi à vous déconnecter";
      return next(err);
    }
    res.redirect('/');
  });
};
