import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { ContactMessage, Enrolment, PROVINCES } from '../models/submissions.js';
import { verifyRecaptcha } from '../lib/recaptcha.js';
import { escapeHtml, notify, sendMail } from '../lib/mailer.js';
import { mask } from '../lib/crypto.js';
import { asyncHandler } from '../middleware/errors.js';
import { env } from '../config/env.js';

const router = Router();

const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.NODE_ENV === 'test' ? 1000 : 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many submissions, please try again later.' },
});

const str = (max = 200) => z.string().trim().max(max).optional().default('');
const money = z.union([z.number(), z.string().trim()]).optional().transform((v) => {
  if (v === undefined || v === '') return undefined;
  const n = Number(String(v).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : undefined;
});

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: str(40),
  subject: str(200),
  message: z.string().trim().min(5).max(5000),
  recaptchaToken: z.string().optional(),
  website: z.string().max(0).optional(), // honeypot: must stay empty
});

router.post(
  '/contact',
  formLimiter,
  asyncHandler(async (req, res) => {
    const { recaptchaToken, website, ...data } = contactSchema.parse(req.body);
    await verifyRecaptcha(recaptchaToken, 'contact', req.ip);
    const msg = await ContactMessage.create({ ...data, ip: req.ip });

    notify({
      subject: `Website enquiry: ${data.subject || data.name}`,
      replyTo: data.email,
      text: `From: ${data.name} <${data.email}> ${data.phone}\n\n${data.message}`,
      html: `<p><strong>From:</strong> ${escapeHtml(data.name)} &lt;${escapeHtml(data.email)}&gt; ${escapeHtml(data.phone)}</p><p>${escapeHtml(data.message).replace(/\n/g, '<br>')}</p>`,
    });
    res.status(201).json({ ok: true, id: msg.id });
  }),
);

const SA_ID = /^\d{13}$/;
const enrolmentSchema = z.object({
  consultant: str(),
  financedBy: str(),
  gender: z.enum(['Male', 'Female', 'Other', '']).optional().default(''),
  title: str(30),
  firstNames: z.string().trim().min(1).max(120),
  surname: z.string().trim().min(1).max(120),
  idNumber: z
    .string()
    .trim()
    .min(6, 'ID or passport number is required')
    .max(20)
    .refine((v) => !/^\d+$/.test(v) || SA_ID.test(v), 'South African ID numbers have 13 digits'),
  dateOfBirth: z.coerce.date().optional(),
  language: str(40),
  contactTime: z.enum(['Office Hours', 'After Hours', '']).optional().default(''),
  address: z
    .object({
      unitNumber: str(40),
      street: str(),
      city: str(100),
      town: str(100),
      province: z.enum([...PROVINCES, '']).optional().default(''),
      postalCode: str(10),
    })
    .default({}),
  phones: z.object({ mobile: z.string().trim().min(10).max(20), work: str(20), home: str(20) }),
  email: z.string().trim().email().max(200),
  bank: z.object({
    accountName: z.string().trim().min(2).max(120),
    bankName: z.string().trim().min(2).max(60),
    accountNumber: z.string().trim().regex(/^\d{6,16}$/, 'Account number must be 6–16 digits'),
    accountType: z.enum(['Savings', 'Cheque', 'Current', 'Other']),
  }),
  employment: z
    .object({
      employerName: str(),
      occupation: str(),
      appointmentDate: str(40),
      appointmentType: z.enum(['Permanent', 'Contract', 'Self-employed', '']).optional().default(''),
      salaryPaid: z.enum(['Monthly', 'Weekly', 'Fortnightly', '']).optional().default(''),
      salaryDate: str(40),
      grossSalary: money,
      netSalary: money,
    })
    .default({}),
  consent: z.literal(true, { message: 'You must accept the terms and conditions' }),
  recaptchaToken: z.string().optional(),
  website: z.string().max(0).optional(),
});

router.post(
  '/enrolments',
  formLimiter,
  asyncHandler(async (req, res) => {
    const { recaptchaToken, website, ...data } = enrolmentSchema.parse(req.body);
    await verifyRecaptcha(recaptchaToken, 'enrol', req.ip);
    const enrolment = await Enrolment.create({ ...data, ip: req.ip });

    const fullName = `${data.title} ${data.firstNames} ${data.surname}`.trim();
    // Never email full ID / bank numbers: notifications include masked values only.
    notify({
      subject: `New enrolment: ${fullName}`,
      replyTo: data.email,
      text: [
        `Name: ${fullName}`,
        `Email: ${data.email}`,
        `Mobile: ${data.phones.mobile}`,
        `ID: ${mask(data.idNumber)}`,
        `Bank: ${data.bank.bankName} ${mask(data.bank.accountNumber)}`,
        `Consultant: ${data.consultant || '-'}`,
        '',
        'View the full record in the admin dashboard.',
      ].join('\n'),
    });
    sendMail({
      to: data.email,
      subject: 'Your PMD Investment Academy enrolment',
      text: `Dear ${data.firstNames},\n\nThank you for enrolling with PMD Investment Academy. A consultant will contact you during ${
        data.contactTime || 'office hours'
      }.\n\nRegards,\nPMD Investment Academy\n087 702 1911`,
    }).catch((err) => console.error('[mailer] confirmation failed:', err.message));

    res.status(201).json({ ok: true, id: enrolment.id });
  }),
);

export default router;
