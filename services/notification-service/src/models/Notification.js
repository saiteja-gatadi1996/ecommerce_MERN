const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    eventType: { type: String, required: true },
    recipient: { type: String, default: '' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    payload: { type: Object, default: {} }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
