const express = require('express');

const adminController = require('../controllers/admin');
const isAdmin = require('../middleware/is-admin');

//

const router = express.Router();

router.get('/doctypes', isAdmin, adminController.getDoctypes);

router.get('/add-doctype', isAdmin, adminController.getAddDoctype);

module.exports = router;
