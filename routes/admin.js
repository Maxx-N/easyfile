const express = require('express');

const adminController = require('../controllers/admin');

//

const router = express.Router();

router.get('/', (req, res, next) => {
  res.redirect('/admin/doctypes');
});

router.get('/doctypes', adminController.getDoctypes);

router.get('/add-doctype', adminController.getAddDoctype);

router.post('/add-doctype', adminController.postDoctype);

module.exports = router;
