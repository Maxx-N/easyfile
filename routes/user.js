const express = require('express');

const userController = require('../controllers/user');

//

const router = express.Router();

router.get('/documents', userController.getDocuments);

module.exports = router;
