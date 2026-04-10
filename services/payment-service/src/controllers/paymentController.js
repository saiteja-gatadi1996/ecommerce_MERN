const Payment = require('../models/Payment');
const { publishEvent } = require('@repo/event-bus');

async function processPayment(req, res) {
  try {
    const { orderId, userId, amount, paymentMethod } = req.body;

    const payment = await Payment.create({
      orderId,
      userId,
      amount,
      paymentMethod,
      status: 'pending'
    });

    setTimeout(async () => {
      try {
        payment.status = 'paid';
        payment.transactionId = `txn_${Date.now()}`;
        await payment.save();

        await publishEvent(req.app.locals.channel, 'payment.paid', {
          paymentId: payment._id.toString(),
          orderId,
          userId,
          amount,
          transactionId: payment.transactionId
        });

        console.log(`[payment-service] payment.paid emitted for order ${orderId}`);
      } catch (error) {
        console.error('Async payment processing failed', error);

        await publishEvent(req.app.locals.channel, 'payment.failed', {
          paymentId: payment._id.toString(),
          orderId,
          userId,
          amount
        });
      }
    }, 1200);

    return res.status(202).json({
      message: 'Payment initiated',
      paymentId: payment._id,
      status: payment.status
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function listPayments(req, res) {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    return res.json(payments);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = { processPayment, listPayments };
