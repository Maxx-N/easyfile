const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const MONGODB_URI = require('./private').MONGODB_URI;
const User = require('./models/user');

//

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/auth', authRoutes);

app.use(userRoutes);

app.use('/', async (req, res, next) => {
  res.redirect('/auth');
});

mongoose.connect(MONGODB_URI).then(() => {
  app.listen(3000);
});
