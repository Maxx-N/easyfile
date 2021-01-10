const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const MONGODB_URI = require('./private').MONGODB_URI;
const SECRET_SESSION = require('./private').SECRET_SESSION;
const User = require('./models/user');

//

const app = express();
const store = new MongoDBStore({ uri: MONGODB_URI, collection: 'sessions' });

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: SECRET_SESSION,
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

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

app.use('/auth', authRoutes);
app.use(userRoutes);

app.use('/', (req, res, next) => {
  res.redirect('/auth');
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
  });
});

mongoose.connect(MONGODB_URI).then(() => {
  app.listen(3000, { useNewUrlParser: true });
});
