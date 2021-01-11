const express = require('express');

const adminController = require('../controllers/admin');

//

const router = express.Router();

router.get('/doctypes', adminController.getDoctypes);

module.exports = router;
