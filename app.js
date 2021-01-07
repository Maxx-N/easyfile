const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/auth');

//

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res, next) => {
  console.log(req.url);
  req.url += 'auth';
  next();
});

app.use('/auth', authRoutes);

app.listen(3000);
