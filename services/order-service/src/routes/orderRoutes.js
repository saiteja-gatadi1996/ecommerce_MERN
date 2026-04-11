const express = require('express');
const { createOrder, listMyOrders } = require('../controllers/orderController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.post('/', createOrder);
router.get('/', listMyOrders);
router.get('/mine', listMyOrders);

module.exports = router;
