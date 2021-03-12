const path = require('path');
const fs = require('fs');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
// const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

// File storage imports
const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const proRoutes = require('./routes/pro');

const User = require('./models/user');
const Pro = require('./models/pro');
const isAdmin = require('./middleware/is-admin');

// Variables d'environnement
const MONGODB_URI = process.env.MONGODB_URI;
const SECRET_SESSION = process.env.SECRET_SESSION;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const PORT = process.env.PORT;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

//

const app = express();
const store = new MongoDBStore({ uri: MONGODB_URI, collection: 'sessions' });

app.set('view engine', 'ejs');
app.set('views', 'views');

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
  { flags: 'a' }
);

// app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }));

app.use(bodyParser.urlencoded({ extended: false }));

//// FILE STORAGE

const s3 = new aws.S3({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
});

const myBucket = 'swapfile';

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const fileStorage = multerS3({
  s3: s3,
  bucket: myBucket,
  acl: 'public-read',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  contentDisposition : 'inline',
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req, file, cb) {
    cb(null, Date.now().toString() + '-' + file.originalname);
  },
});

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
  app.listen(PORT || 3000, { useNewUrlParser: true });
});
