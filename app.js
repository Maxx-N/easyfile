const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const multer = require('multer');

const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const proRoutes = require('./routes/pro');

const MONGODB_URI = require('./private').MONGODB_URI;
const SECRET_SESSION = require('./private').SECRET_SESSION;
const ADMIN_EMAIL = require('./private').ADMIN_EMAIL;
const User = require('./models/user');
const Pro = require('./models/pro');
const isAdmin = require('./middleware/is-admin');

//

const app = express();
const store = new MongoDBStore({ uri: MONGODB_URI, collection: 'sessions' });

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'files');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now().toString() + '-' + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single('file')
);

app.use(express.static(path.join(__dirname, 'public')));
app.use('/files', express.static(path.join(__dirname, 'files')));

app.use(
  session({
    secret: SECRET_SESSION,
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

app.use((req, res, next) => {
  res.locals.isAuthenticated = !!req.session.user;
  res.locals.isProAuthenticated = !!req.session.pro;
  res.locals.user = req.session.user;
  res.locals.pro = req.session.pro;
  res.locals.isAdmin =
    !!req.session.user && req.session.user.email === ADMIN_EMAIL;
  next();
});

app.use(async (req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  try {
    const user = await User.findById(req.session.user._id);
    if (!user) {
      return next();
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
});

app.use(async (req, res, next) => {
  if (!req.session.pro) {
    return next();
  }
  try {
    const pro = await Pro.findById(req.session.pro._id);
    if (!pro) {
      return next();
    }
    req.pro = pro;
    next();
  } catch (err) {
    next(err);
  }
});

app.use('/admin', isAdmin, adminRoutes);
app.use(authRoutes);

app.use(userRoutes);
app.use('/pro', proRoutes);

app.use('/', (req, res, next) => {
  if (!!req.session.user) {
    return res.redirect('/documents');
  } else if (!!req.session.pro) {
    return res.redirect('/pro/swap-folders');
  }
  res.redirect('/login');
});

app.use((err, req, res, next) => {
  if (!err.statusCode) {
    err.statusCode = 500;
  }
  if (!err.message) {
    err.message =
      'Le serveur a rencontré un problème. Nous travaillons à le résoudre et vous prions de nous excuser pour ce désagrément.';
  }
  res.status(err.statusCode).render('error-page', {
    pageTitle: `Erreur ${err.statusCode}`,
    path: '/error',
    errorStatus: err.statusCode,
    errorMessage: err.message,
    isAdmin: req.locals && !!req.locals.isAdmin ? req.locals.isAdmin : false,
    isAuthenticated:
      req.locals && !!req.locals.isAuthenticated
        ? req.locals.isAuthenticated
        : false,
    isProAuthenticated:
      req.locals && !!req.locals.isProAuthenticated
        ? req.locals.isProAuthenticated
        : false,
  });
});

mongoose.connect(MONGODB_URI).then(() => {
  app.listen(3000, { useNewUrlParser: true });
});
