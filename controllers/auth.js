const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');

const User = require('../models/user');
const Pro = require('../models/pro');
const helpers = require('../helpers');

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
      isPro: '0',
    },
  });
};

exports.postSignup = async (req, res, next) => {
  const isClient = req.body.isPro !== '1';
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const company = req.body.company;
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
        isPro: req.body.isPro,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        company: req.body.company,
      },
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    if (isClient) {
      const user = new User({
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: hashedPassword,
      });
      await user.save();
      req.session.user = user;
      req.session.pro = null;
      return req.session.save((err) => {
        if (err) {
          throw err;
        }
        res.redirect('/documents');
      });
    }
    if (!isClient) {
      const pro = new Pro({
        company: company,
        email: email,
        password: hashedPassword,
      });
      await pro.save();
      req.session.pro = pro;
      req.session.user = null;
      return req.session.save((err) => {
        if (err) {
          throw err;
        }
        res.redirect('/pro/loan-files');
      });
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
      isPro: '0',
    },
    validationErrors: [],
  });
};

exports.postLogin = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const isClient = !req.body.isPro;

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
          isPro: isClient ? '0' : '1',
        },
        validationErrors: errorsArray,
      });
    }
    if (isClient) {
      req.session.user = user;
      req.session.pro = null;
    } else {
      req.session.pro = pro;
      req.session.user = null;
    }

    await req.session.save();
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

exports.getEditProfile = (req, res, next) => {
  if (req.user) {
    const user = req.user;
    return res.render('auth/edit-profile', {
      pageTitle: `Modification du profil - ${user.email}`,
      path: '/edit-profile',
      email: user.email,
      errorMessages: [],
      validationErrors: [],
      oldInput: {
        gender: user.gender,
        firstName: user.firstName,
        lastName: user.lastName,
        birthDate: user.birthDate
          ? helpers.dateToInputFormat(user.birthDate)
          : null,
        phoneNumber: user.phoneNumber,
        address: user.address,
      },
    });
  }

  if (req.pro) {
    const pro = req.pro;
    return res.render('auth/edit-pro-profile', {
      pageTitle: `Modification du profil - ${pro.email}`,
      path: '/edit-profile',
      errorMessages: [],
      oldInput: { company: pro.company },
      validationErrors: [],
    });
  }
};

exports.postEditProfile = async (req, res, next) => {
  const user = req.user;

  const gender = req.body.gender ? req.body.gender : null;
  const firstName = req.body.firstName ? req.body.firstName : null;
  const lastName = req.body.lastName ? req.body.lastName : null;
  const birthDate = req.body.birthDate ? new Date(req.body.birthDate) : null;
  const phoneNumber = req.body.phoneNumber ? req.body.phoneNumber : null;
  const address = req.body.address ? req.body.address : null;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => {
      return err.msg;
    });
    return res.render('auth/edit-profile', {
      pageTitle: `Modification du profil - ${user.email}`,
      path: '/edit-profile',
      email: user.email,
      errorMessages: errorMessages,
      validationErrors: errors.array(),
      oldInput: {
        gender: gender,
        firstName: firstName,
        lastName: lastName,
        birthDate: req.body.birthDate,
        phoneNumber: phoneNumber,
        address: address,
      },
    });
  }

  user.gender = gender;
  user.firstName = firstName;
  user.lastName = lastName;
  user.birthDate = birthDate;
  user.phoneNumber = phoneNumber;
  user.address = address;

  try {
    await user.save((err) => {
      if (err) {
        err.message =
          "Un problème est survenu et les modifications n'ont pu être enregistrées. Nous travaillons sur ce problème et vous prions de nous excuser.";
        throw err;
      }
    });

    res.redirect('/documents');
  } catch (err) {
    return next(err);
  }
};

exports.postEditProProfile = async (req, res, next) => {
  const pro = req.pro;

  const company = req.body.company ? req.body.company : null;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => {
      return err.msg;
    });
    return res.render('auth/edit-pro-profile', {
      pageTitle: `Modification du profil - ${pro.email}`,
      path: '/edit-profile',
      email: pro.email,
      errorMessages: errorMessages,
      validationErrors: errors.array(),
      oldInput: {
        company: company,
      },
    });
  }

  pro.company = company;

  try {
    await pro.save((err) => {
      if (err) {
        err.message =
          "Un problème est survenu et les modifications n'ont pu être enregistrées. Nous travaillons sur ce problème et vous prions de nous excuser.";
        throw err;
      }
    });

    res.redirect('/swap-folders');
  } catch (err) {
    return next(err);
  }
};

exports.getEditPassword = (req, res, next) => {
  res.render('auth/edit-password', {
    pageTitle: 'Modification du mot de passe',
    path: '/edit-profile',
    errorMessages: [],
    validationErrors: [],
    oldInput: {
      oldPassword: '',
      password: '',
      confirmPassword: '',
    },
  });
};

exports.postEditPassword = async (req, res, next) => {
  const oldPassword = req.body.oldPassword;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  const user = req.user;
  const pro = req.pro;

  try {
    if (pro || user) {
      let errorsArray = [];

      const doMatch = await bcrypt.compare(
        oldPassword,
        user ? user.password : pro.password
      );

      if (!doMatch) {
        errorsArray.push({
          param: 'oldPassword',
          msg: 'Mot de passe actuel incorrect.',
        });
      }

      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        errorsArray.push(...errors.array());
      }

      if (errorsArray.length > 0) {
        const errorMessages = errorsArray.map((err) => {
          return err.msg;
        });

        return res.render('auth/edit-password', {
          pageTitle: 'Modification du mot de passe',
          path: '/edit-profile',
          errorMessages: errorMessages,
          validationErrors: errorsArray,
          oldInput: {
            oldPassword: oldPassword,
            password: password,
            confirmPassword: confirmPassword,
          },
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      if (user) {
        user.password = hashedPassword;
        await user.save((err) => {
          if (err) {
            err.message =
              "Un problème est survenu et les modifications n'ont pu être enregistrées. Nous travaillons sur ce problème et vous prions de nous excuser.";
            throw err;
          }
        });
      } else {
        pro.password = hashedPassword;
        await pro.save((err) => {
          if (err) {
            err.message =
              "Un problème est survenu et les modifications n'ont pu être enregistrées. Nous travaillons sur ce problème et vous prions de nous excuser.";
            throw err;
          }
        });
      }

      res.redirect('/');
    }
  } catch (err) {
    return next(err);
  }
};
