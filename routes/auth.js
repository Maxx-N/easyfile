const express = require('express');

//

const router = express.Router();

router.get('', (req, res, next) => {
  res.render('auth/signup', { pageTitle: 'Inscription' });
});

module.exports = router;
