const express = require('express');

const proController = require('../controllers/pro');
const isProAuth = require('../middleware/is-pro-auth');

//

const router = express.Router();

router.get('/loan-files', isProAuth ,proController.getLoanFiles);

module.exports = router;
