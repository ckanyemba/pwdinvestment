import mongoose from 'mongoose';
import { encryptedFields } from './plugins/encrypted.js';

const { Schema, model } = mongoose;

// Rebuild of the legacy AppGini CRM (pmdinvestment.co.za/app): clients, employees, appointments.
const file = new Schema({ url: String, publicId: String, name: String, resourceType: String }, { _id: false });

const employeeSchema = new Schema(
  {
    employeeId: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    post: { type: String, trim: true }, // job title
    cell: { type: String, required: true, trim: true, unique: true },
    email: { type: String, trim: true, lowercase: true },
    resAddress: String,
    started: Date,
    image: file,
    contract: file,
    comment: String,
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const CLIENT_STATUSES = ['Active', 'Pending', 'Cancelled', 'Completed'];

const clientSchema = new Schema(
  {
    projectName: String,
    financeHouse: String,
    dateSigned: Date,
    consultant: { type: Schema.Types.ObjectId, ref: 'Employee' },
    telemarketer: { type: Schema.Types.ObjectId, ref: 'Employee' },
    enrolmentNumber: String,
    clientName: { type: String, required: true, trim: true },
    idNumber: { type: String, required: true }, // encrypted; unique via idNumberHash
    cell: String,
    businessPhone: String,
    emailAddress: { type: String, trim: true, lowercase: true },
    area: String,
    bank: String,
    branch: String,
    branchCode: String,
    tradingAccount: String,
    accountHolder: String,
    accountNumber: String, // encrypted
    accountType: String,
    debitAmount: Number,
    debitDate: Date,
    depositPaid: Number,
    verified: { type: Boolean, default: false },
    status: { type: String, enum: CLIENT_STATUSES, default: 'Pending' },
    dateCancelled: Date,
    contract: file,
    comment: String,
    enrolment: { type: Schema.Types.ObjectId, ref: 'Enrolment' },
  },
  { timestamps: true },
);
clientSchema.plugin(encryptedFields, { fields: ['idNumber', 'accountNumber'], unique: ['idNumber'] });
clientSchema.index({ clientName: 'text', projectName: 'text', enrolmentNumber: 'text' });

const appointmentSchema = new Schema(
  {
    telemarketer: { type: Schema.Types.ObjectId, ref: 'Employee' },
    salesRep: { type: Schema.Types.ObjectId, ref: 'Employee' },
    projectName: String,
    date: { type: Date, required: true },
    time: String, // HH:mm
    clientName: { type: String, required: true, trim: true },
    occupation: String,
    department: String,
    incomeBracket: String,
    workNumber: String,
    cellNumber: String,
    email: { type: String, trim: true, lowercase: true },
    meetingPlace: String,
    seen: { type: Boolean, default: false },
    signed: { type: Boolean, default: false },
    sale: { type: Boolean, default: false },
    notAvailable: { type: Boolean, default: false },
    comments: String,
    client: { type: Schema.Types.ObjectId, ref: 'Client' },
  },
  { timestamps: true },
);
appointmentSchema.index({ date: -1 });

export const Employee = model('Employee', employeeSchema);
export const Client = model('Client', clientSchema);
export const Appointment = model('Appointment', appointmentSchema);
