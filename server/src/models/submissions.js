import mongoose from 'mongoose';
import { encryptedFields } from './plugins/encrypted.js';

const { Schema, model } = mongoose;

export const PROVINCES = [
  'Gauteng', 'Limpopo', 'Mpumalanga', 'Eastern Cape', 'KwaZulu-Natal', 'North West', 'Free State', 'Western Cape', 'Northern Cape',
];
export const SUBMISSION_STATUSES = ['new', 'in-progress', 'done', 'spam'];

const contactMessageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    phone: { type: String, trim: true, maxlength: 40 },
    subject: { type: String, trim: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 5000 },
    status: { type: String, enum: SUBMISSION_STATUSES, default: 'new' },
    ip: String,
  },
  { timestamps: true },
);

const product = new Schema({ reference: String, description: String, price: Number }, { _id: false });

// Mirrors the legacy Contact Form 7 "enrollment form".
const enrolmentSchema = new Schema(
  {
    consultant: String,
    financedBy: String,
    gender: { type: String, enum: ['Male', 'Female', 'Other', ''] },
    title: String,
    firstNames: { type: String, required: true, trim: true },
    surname: { type: String, required: true, trim: true },
    idNumber: String, // encrypted
    dateOfBirth: Date,
    language: String,
    contactTime: { type: String, enum: ['Office Hours', 'After Hours', ''] },
    address: { unitNumber: String, street: String, city: String, town: String, province: String, postalCode: String },
    phones: { mobile: String, work: String, home: String },
    email: { type: String, required: true, trim: true, lowercase: true },
    bank: {
      accountName: String,
      bankName: String,
      accountNumber: String, // encrypted
      accountType: { type: String, enum: ['Savings', 'Cheque', 'Current', 'Other', ''] },
    },
    employment: {
      employerName: String,
      occupation: String,
      appointmentDate: String,
      appointmentType: { type: String, enum: ['Permanent', 'Contract', 'Self-employed', ''] },
      salaryPaid: { type: String, enum: ['Monthly', 'Weekly', 'Fortnightly', ''] },
      salaryDate: String,
      grossSalary: Number,
      netSalary: Number,
    },
    products: [product],
    totalAmount: Number,
    consent: { type: Boolean, required: true },
    status: { type: String, enum: SUBMISSION_STATUSES, default: 'new' },
    notes: String,
    ip: String,
  },
  { timestamps: true },
);
enrolmentSchema.plugin(encryptedFields, { fields: ['idNumber', 'bank.accountNumber'] });

export const ContactMessage = model('ContactMessage', contactMessageSchema);
export const Enrolment = model('Enrolment', enrolmentSchema);
