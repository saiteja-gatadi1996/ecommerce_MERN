const express = require('express');
const Notification = require('../models/Notification');

const router = express.Router();

router.get('/', async (req, res) => {
  const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
  return res.json(notifications);
});

module.exports = router;
