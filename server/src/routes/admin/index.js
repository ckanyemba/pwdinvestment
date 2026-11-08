import { Router } from 'express';
import multer from 'multer';
import { crudRouter } from './crud.js';
import { Event, Page, Post, Setting, Testimonial } from '../../models/content.js';
import { ContactMessage, Enrolment } from '../../models/submissions.js';
import { Appointment, Client, Employee } from '../../models/crm.js';
import { MediaAsset } from '../../models/MediaAsset.js';
import { cleanHtml } from '../../lib/sanitize.js';
import { mask } from '../../lib/crypto.js';
import { clearMediaCache, resolveMedia } from '../../lib/media.js';
import { destroyAsset, uploadBuffer } from '../../config/cloudinary.js';
import { requireAdmin } from '../../middleware/auth.js';
import { asyncHandler, HttpError } from '../../middleware/errors.js';

const router = Router();
router.use(requireAdmin);
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');

const richText = (field) => (body, req) => {
  if (typeof body[field] === 'string') body[field] = cleanHtml(body[field]);
  if (req.method === 'POST' && body.title && !body.slug) body.slug = slugify(body.title);
  return body;
};
const emptyRefsToNull = (fields) => (body) => {
  for (const f of fields) if (body[f] === '') body[f] = null;
  return body;
};

// ---- content
router.use('/pages', crudRouter(Page, { search: ['title', 'slug'], sort: { navOrder: 1, title: 1 }, prepare: richText('content') }));
router.use('/posts', crudRouter(Post, { search: ['title', 'slug'], sort: { publishedAt: -1 }, prepare: richText('content') }));
router.use('/events', crudRouter(Event, { search: ['title', 'venue.name'], sort: { startDate: -1 }, prepare: richText('description') }));
router.use('/testimonials', crudRouter(Testimonial, { search: ['name', 'company'], sort: { order: 1 } }));

// ---- submissions
router.use('/messages', crudRouter(ContactMessage, { search: ['name', 'email', 'subject'], filters: ['status'] }));
router.use(
  '/enrolments',
  (req, res, next) => (req.method === 'POST' && req.path === '/' ? next(new HttpError(405, 'Enrolments are created via the public form')) : next()),
);
router.post(
  '/enrolments/:id/convert',
  asyncHandler(async (req, res) => {
    const enrolment = await Enrolment.findById(req.params.id);
    if (!enrolment) throw new HttpError(404, 'Not found');
    const e = enrolment.toJSON();
    const existing = await Client.findOne({ idNumberHash: Client.hashOf(e.idNumber) });
    if (existing) throw new HttpError(409, 'A client with this ID number already exists', { clientId: existing.id });
    const client = await Client.create({
      clientName: `${e.title || ''} ${e.firstNames} ${e.surname}`.trim(),
      idNumber: e.idNumber,
      cell: e.phones?.mobile,
      businessPhone: e.phones?.work,
      emailAddress: e.email,
      area: e.address?.city || e.address?.town,
      financeHouse: e.financedBy,
      bank: e.bank?.bankName,
      accountHolder: e.bank?.accountName,
      accountNumber: e.bank?.accountNumber,
      accountType: e.bank?.accountType,
      debitAmount: e.totalAmount,
      status: 'Pending',
      enrolment: enrolment._id,
    });
    enrolment.status = 'done';
    await enrolment.save();
    res.status(201).json(client.toJSON());
  }),
);
router.use(
  '/enrolments',
  crudRouter(Enrolment, {
    search: ['firstNames', 'surname', 'email', 'phones.mobile', 'consultant'],
    filters: ['status'],
    exactSearch: (q) => [{ idNumberHash: Enrolment.hashOf(q) }],
    listTransform: (d) => ({ ...d, idNumber: mask(d.idNumber), bank: d.bank && { ...d.bank, accountNumber: mask(d.bank.accountNumber) } }),
  }),
);

// ---- CRM
router.use('/employees', crudRouter(Employee, { search: ['name', 'employeeId', 'post', 'cell', 'email'], filters: ['active'], sort: { name: 1 } }));
router.use(
  '/clients',
  crudRouter(Client, {
    search: ['clientName', 'projectName', 'enrolmentNumber', 'cell', 'emailAddress', 'financeHouse'],
    filters: ['status', 'consultant', 'telemarketer'],
    populate: ['consultant', 'telemarketer'],
    exactSearch: (q) => [{ idNumberHash: Client.hashOf(q) }],
    prepare: emptyRefsToNull(['consultant', 'telemarketer', 'enrolment']),
    listTransform: (d) => ({ ...d, idNumber: mask(d.idNumber), accountNumber: mask(d.accountNumber) }),
  }),
);
router.use(
  '/appointments',
  crudRouter(Appointment, {
    search: ['clientName', 'projectName', 'email', 'cellNumber', 'meetingPlace'],
    filters: ['salesRep', 'telemarketer', 'seen', 'signed', 'sale'],
    populate: ['salesRep', 'telemarketer'],
    sort: { date: -1, time: -1 },
    prepare: emptyRefsToNull(['salesRep', 'telemarketer', 'client']),
  }),
);

// ---- settings (site info, home page)
router.get(
  '/settings/:key',
  asyncHandler(async (req, res) => {
    const s = await Setting.findOne({ key: req.params.key }).lean();
    res.json(await resolveMedia(s?.value ?? {}));
  }),
);
router.put(
  '/settings/:key',
  asyncHandler(async (req, res) => {
    if (!['site', 'home'].includes(req.params.key)) throw new HttpError(400, 'Unknown settings key');
    const s = await Setting.findOneAndUpdate({ key: req.params.key }, { value: req.body }, { upsert: true, returnDocument: 'after' });
    res.json(s.value);
  }),
);

// ---- uploads → Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    /^(image\/(jpeg|png|webp|gif|svg\+xml)|application\/pdf)$/.test(file.mimetype)
      ? cb(null, true)
      : cb(new HttpError(400, 'Only images and PDF files are allowed')),
});

router.post(
  '/uploads',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'No file uploaded (field name: "file")');
    const folder = /^[a-z0-9-]{1,40}$/.test(req.body.folder || '') ? req.body.folder : 'uploads';
    const isPdf = req.file.mimetype === 'application/pdf';
    const result = await uploadBuffer(req.file.buffer, { folder, resourceType: isPdf ? 'raw' : 'image' });
    const asset = await MediaAsset.create({
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      originalName: req.file.originalname,
      uploadedBy: req.user.email,
    });
    res.status(201).json({ url: asset.url, publicId: asset.publicId, name: asset.originalName, resourceType: asset.resourceType, id: asset.id });
  }),
);
router.get(
  '/media',
  asyncHandler(async (req, res) => {
    res.json(await MediaAsset.find().sort({ createdAt: -1 }).limit(200).lean());
  }),
);
router.delete(
  '/media/:id',
  asyncHandler(async (req, res) => {
    const asset = await MediaAsset.findByIdAndDelete(req.params.id);
    if (!asset) throw new HttpError(404, 'Not found');
    await destroyAsset(asset.publicId, asset.resourceType);
    clearMediaCache();
    res.status(204).end();
  }),
);

// ---- dashboard
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
    const [newEnrolments, newMessages, clients, activeClients, employees, upcomingAppointments, recentEnrolments] = await Promise.all([
      Enrolment.countDocuments({ status: 'new' }),
      ContactMessage.countDocuments({ status: 'new' }),
      Client.countDocuments(),
      Client.countDocuments({ status: 'Active' }),
      Employee.countDocuments({ active: true }),
      Appointment.countDocuments({ date: { $gte: startOfToday } }),
      Enrolment.find({}, { firstNames: 1, surname: 1, email: 1, status: 1, createdAt: 1 }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);
    res.json({ newEnrolments, newMessages, clients, activeClients, employees, upcomingAppointments, recentEnrolments });
  }),
);

export default router;
