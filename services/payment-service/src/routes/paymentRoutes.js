const express = require('express');
const { processPayment, listPayments } = require('../controllers/paymentController');

const router = express.Router();

router.post('/process', processPayment);
router.get('/', listPayments);

module.exports = router;
