const express = require('express');
const {
  listProducts,
  getProduct,
  createProduct,
  seedProducts,
  getProductsByIds
} = require('../controllers/productController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', listProducts);
router.get('/batch', getProductsByIds);
router.get('/:id', getProduct);
router.post('/', requireAuth, requireAdmin, createProduct);
router.post('/seed', seedProducts);

module.exports = router;
