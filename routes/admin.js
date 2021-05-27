const express = require('express');
const { body } = require('express-validator');

const adminController = require('../controllers/admin');

//

const router = express.Router();

router.get('/', (req, res, next) => {
  res.redirect('/admin/doctypes');
});

router.get('/doctypes', adminController.getDoctypes);

router.get('/add-doctype', adminController.getAddDoctype);

router.post(
  '/add-doctype',
  [
    body('title', 'Le titre doit contenir entre 4 et 80 caractères.')
      .trim()
      .isLength({ min: '4', max: '80' }),
  ],
  adminController.postAddDoctype
);

router.get('/doctypes/:doctypeId', adminController.getEditDoctypeTitle);

router.post(
  '/doctypes/:doctypeId',
  [
    body('title', 'Le titre doit contenir entre 4 et 80 caractères.')
      .trim()
      .isLength({ min: '4', max: '80' }),
  ],
  adminController.postEditDoctypeTitle
);

module.exports = router;
