const express = require('express');

const adminController = require('../controllers/admin');

//

const router = express.Router();

router.get('/doctypes', adminController.getDoctypes);

router.get('/add-doctype', adminController.getAddDoctype);

module.exports = router;
