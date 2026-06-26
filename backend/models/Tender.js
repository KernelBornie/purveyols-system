const mongoose = require('mongoose');

const TenderItemSchema = new mongoose.Schema({
  section: { type: String, default: 'General' },
  itemNumber: { type: String },
  description: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  unit: { type: String, default: 'Lot' },
  unitPrice: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
});

const KeyPersonnelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  qualifications: { type: String },
  experience: { type: String },
  yearsWithFirm: { type: Number },
});

const PastPerformanceSchema = new mongoose.Schema({
  projectName: { type: String, required: true },
  client: { type: String, required: true },
  value: { type: Number },
  yearCompleted: { type: Number },
  description: { type: String },
  isReference: { type: Boolean, default: false },
  completionCertificate: { type: String },
});

const DocumentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['sf1442', 'price_proposal', 'technical', 'safety_plan', 'certificate', 'bank_statement', 'profile', 'other'],
    default: 'other'
  },
  url: { type: String },
  uploadedAt: { type: Date, default: Date.now },
});

const TenderSchema = new mongoose.Schema({
  // ─── Basic Info ──────────────────────────────────────────────
  title: { type: String, required: true },
  referenceNumber: { type: String, required: true, unique: true },
  solicitationNumber: { type: String },
  projectName: { type: String },
  location: { type: String },

  // ─── Client Info ─────────────────────────────────────────────
  client: { type: String, required: true },
  clientAddress: { type: String },
  clientEmail: { type: String },
  clientPhone: { type: String },
  clientContact: { type: String },

  // ─── Type ────────────────────────────────────────────────────
  type: {
    type: String,
    enum: ['solicitation', 'rfq', 'tender', 'proposal', 'bid'],
    default: 'tender'
  },

  // ─── Dates ──────────────────────────────────────────────────
  issueDate: { type: Date },
  dueDate: { type: Date },
  siteVisitDate: { type: Date },
  awardDate: { type: Date },

  // ─── US Embassy / SF 1442 Specific ──────────────────────────
  isSF1442: { type: Boolean, default: false },
  contractingOffice: { type: String },
  facilityCode: { type: String },
  isBondRequired: { type: Boolean, default: false },
  bondDays: { type: Number, default: 10 },
  acceptanceDays: { type: Number, default: 30 },

  // ─── Sections / Scope of Work ──────────────────────────────
  sections: [{
    name: { type: String, required: true },
    description: { type: String },
    items: [TenderItemSchema],
    pageNumber: { type: Number },
  }],

  description: { type: String },

  // ─── Price Proposal ─────────────────────────────────────────
  priceProposal: {
    subtotal: { type: Number, default: 0 },
    percentageAdjustment: { type: Number, default: 0 },
    contingencies: { type: Number, default: 0 },
    vat: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    currency: { type: String, default: 'ZMW' },
    exchangeRate: { type: Number, default: 1 },
    amounts: { type: Map, of: Number },
  },

  // ─── Volume I: Price Proposal ──────────────────────────────
  volumeI: {
    sf1442Received: { type: Boolean, default: false },
    priceBreakdown: { type: String },
  },

  // ─── Volume II: Business Management / Technical ────────────
  volumeII: {
    performanceSchedule: { type: String },
    keyPersonnel: [KeyPersonnelSchema],
    managementInformation: {
      bidderInfo: { type: String },
      samRegistration: { type: String },
      certifications: { type: String },
      litigationStatus: { type: String },
      politicalAffiliation: { type: String },
      equipmentSchedule: { type: String },
      companyProfile: { type: String },
    },
    financialCapability: {
      bankStatements: [String],
    },
    pastPerformance: [PastPerformanceSchema],
    preliminarySafetyPlan: { type: String },
  },

  // ─── Documents ──────────────────────────────────────────────
  documents: [DocumentSchema],

  // ─── Status ──────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'awarded', 'rejected', 'not_awarded'],
    default: 'draft'
  },

  // ─── Tracking ───────────────────────────────────────────────
  notes: { type: String },
  awardAmount: { type: Number },
  awardee: { type: String },

  // ─── Audit ────────────────────────────────────────────────────
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedAt: { type: Date },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Auto-generate reference number
TenderSchema.pre('save', function(next) {
  if (!this.referenceNumber) {
    const prefix = this.type === 'solicitation' ? 'SOL' : this.type === 'rfq' ? 'RFQ' : 'TND';
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.referenceNumber = `${prefix}-${y}${m}${d}-${rand}`;
  }
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Tender', TenderSchema);