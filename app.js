const express = require('express');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/auth');

//

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', authRoutes);

app.listen(3000);
