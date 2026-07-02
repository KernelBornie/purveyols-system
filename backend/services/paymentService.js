const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Cashbook = require('../models/Cashbook');
const Ledger = require('../models/Ledger');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

class PaymentEngine {
  static async processPayment({ amount, currency = 'ZMW', sourceModule, sourceId, description, recipient, approvedBy, metadata = {} }, initiator) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const transactionId = `TXN-${Date.now()}-${uuidv4().slice(0, 6)}`;
      const cashbook = await Cashbook.findOne({}).session(session);
      if (!cashbook || cashbook.balance < amount) throw new Error('Insufficient funds');
      cashbook.balance -= amount;
      cashbook.transactions.push({
        transactionId,
        amount: -amount,
        type: 'debit',
        description,
        timestamp: new Date(),
        relatedModule: sourceModule,
        relatedId: sourceId
      });
      await cashbook.save({ session });

      await Ledger.create([{
        account: '5000',
        transactionId,
        amount,
        type: 'debit',
        description,
        module: sourceModule,
        relatedId: sourceId,
        timestamp: new Date()
      }, {
        account: '1000',
        transactionId,
        amount,
        type: 'credit',
        description,
        module: sourceModule,
        relatedId: sourceId,
        timestamp: new Date()
      }], { session });

      await Transaction.create([{
        transactionId,
        amount,
        currency,
        module: sourceModule,
        relatedId: sourceId,
        status: 'completed',
        initiatedBy: initiator,
        approvedBy,
        description,
        metadata,
        createdAt: new Date()
      }], { session });

      await Notification.create([{
        userId: recipient,
        title: 'Payment Received',
        message: `Payment of ${amount} ${currency} for ${description}`,
        read: false,
        link: `/${sourceModule.toLowerCase()}/${sourceId}`
      }], { session });

      await AuditLog.create([{
        action: 'payment',
        module: sourceModule,
        relatedId: sourceId,
        user: initiator,
        details: `Payment processed with ID ${transactionId}`,
        timestamp: new Date()
      }], { session });

      const ModuleModel = mongoose.model(sourceModule);
      await ModuleModel.findByIdAndUpdate(sourceId, { paymentStatus: 'paid', transactionId }, { session });

      await session.commitTransaction();
      return transactionId;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

module.exports = PaymentEngine;
