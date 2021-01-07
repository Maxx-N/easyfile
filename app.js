const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

//

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/auth', authRoutes);

app.use(userRoutes);

app.use('/', (req, res, next) => {
  res.redirect('/auth');
});

app.listen(3000);
