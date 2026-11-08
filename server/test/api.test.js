import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Environment must be set before the app modules (which validate env on import) load.
const mongo = await MongoMemoryServer.create();
Object.assign(process.env, {
  NODE_ENV: 'test',
  MONGODB_URI: mongo.getUri('pmd-test'),
  JWT_SECRET: 'test-secret-test-secret-test-secret-123',
  ENCRYPTION_KEY: 'a'.repeat(64),
  ADMIN_EMAILS: 'admin@pmdinvestment.co.za',
  GOOGLE_CLIENT_ID: '',
  RECAPTCHA_SECRET: '',
  GMAIL_USER: '',
  CLOUDINARY_URL: '',
});

const { default: request } = await import('supertest');
const jwt = (await import('jsonwebtoken')).default;
const { createApp } = await import('../src/app.js');
const { connectDB, disconnectDB } = await import('../src/config/db.js');
const { Page, Setting } = await import('../src/models/content.js');
const { Enrolment } = await import('../src/models/submissions.js');
const { Client } = await import('../src/models/crm.js');

const app = createApp();
const adminToken = jwt.sign({ sub: 'admin@pmdinvestment.co.za', role: 'admin' }, process.env.JWT_SECRET);
const outsiderToken = jwt.sign({ sub: 'someone@example.com', role: 'admin' }, process.env.JWT_SECRET);
const auth = (t = adminToken) => ({ Authorization: `Bearer ${t}` });

const enrolment = {
  firstNames: 'Thandi',
  surname: 'Mokoena',
  idNumber: '9001015009087',
  phones: { mobile: '0821234567' },
  email: 'thandi@example.com',
  bank: { accountName: 'T Mokoena', bankName: 'Capitec 470010', accountNumber: '1234567890', accountType: 'Savings' },
  consent: true,
};

before(async () => {
  await connectDB();
  await Setting.create({ key: 'site', value: { name: 'PMD Investment Academy' } });
  await Page.create({ slug: 'forex', title: 'Forex Trading', content: '<p><img src="{{media:2016/01/Forex.jpg}}"></p>', navOrder: 1 });
  await Page.create({ slug: 'draft', title: 'Draft', published: false });
});

after(async () => {
  await disconnectDB();
  await mongo.stop();
});

describe('public content', () => {
  it('returns site settings with navigation', async () => {
    const res = await request(app).get('/api/site').expect(200);
    assert.equal(res.body.site.name, 'PMD Investment Academy');
    assert.deepEqual(res.body.nav.map((n) => n.slug), ['forex']);
  });

  it('resolves legacy media tokens to served URLs', async () => {
    const res = await request(app).get('/api/pages/forex').expect(200);
    assert.match(res.body.content, /http:\/\/localhost:4000\/media\/2016\/01\/Forex\.jpg/);
    assert.doesNotMatch(res.body.content, /\{\{media:/);
  });

  it('hides unpublished pages', async () => {
    await request(app).get('/api/pages/draft').expect(404);
  });
});

describe('forms', () => {
  it('accepts a valid contact message', async () => {
    await request(app).post('/api/contact').send({ name: 'Sipho', email: 'sipho@example.com', message: 'Hello there' }).expect(201);
  });

  it('rejects the honeypot field', async () => {
    await request(app)
      .post('/api/contact')
      .send({ name: 'Bot', email: 'bot@example.com', message: 'Buy now!!', website: 'spam' })
      .expect(400);
  });

  it('validates enrolments', async () => {
    const res = await request(app).post('/api/enrolments').send({ ...enrolment, idNumber: '12345678' }).expect(400);
    assert.ok(res.body.details.some((d) => d.path === 'idNumber'));
  });

  it('stores ID and bank numbers encrypted', async () => {
    const res = await request(app).post('/api/enrolments').send(enrolment).expect(201);
    const raw = await Enrolment.collection.findOne({ _id: Enrolment.castObject({ _id: res.body.id })._id });
    assert.match(raw.idNumber, /^enc:v1:/);
    assert.match(raw.bank.accountNumber, /^enc:v1:/);
    assert.ok(raw.idNumberHash);
  });
});

describe('admin', () => {
  it('requires a session', async () => {
    await request(app).get('/api/admin/stats').expect(401);
  });

  it('rejects tokens for emails not on the allow-list', async () => {
    await request(app).get('/api/admin/stats').set(auth(outsiderToken)).expect(401);
  });

  it('masks sensitive values in lists but decrypts in detail', async () => {
    const list = await request(app).get('/api/admin/enrolments').set(auth()).expect(200);
    const row = list.body.data[0];
    assert.equal(row.idNumber, '•••••••••9087');
    const detail = await request(app).get(`/api/admin/enrolments/${row._id}`).set(auth()).expect(200);
    assert.equal(detail.body.idNumber, enrolment.idNumber);
    assert.equal(detail.body.bank.accountNumber, enrolment.bank.accountNumber);
  });

  it('finds enrolments by exact ID number via blind index', async () => {
    const res = await request(app).get('/api/admin/enrolments').query({ q: enrolment.idNumber }).set(auth()).expect(200);
    assert.equal(res.body.total, 1);
  });

  it('converts an enrolment into a CRM client once', async () => {
    const list = await request(app).get('/api/admin/enrolments').set(auth()).expect(200);
    const id = list.body.data[0]._id;
    const res = await request(app).post(`/api/admin/enrolments/${id}/convert`).set(auth()).expect(201);
    assert.equal(res.body.clientName, 'Thandi Mokoena');
    assert.equal(res.body.idNumber, enrolment.idNumber);
    await request(app).post(`/api/admin/enrolments/${id}/convert`).set(auth()).expect(409);
    assert.equal(await Client.countDocuments(), 1);
  });

  it('runs CRUD on employees and appointments', async () => {
    const emp = await request(app).post('/api/admin/employees').set(auth()).send({ name: 'Precious N', cell: '0110000000', post: 'COO' }).expect(201);
    const appt = await request(app)
      .post('/api/admin/appointments')
      .set(auth())
      .send({ clientName: 'Jane', date: '2026-12-01', time: '10:00', salesRep: emp.body._id, telemarketer: '' })
      .expect(201);
    const got = await request(app).get(`/api/admin/appointments/${appt.body._id}`).set(auth()).expect(200);
    assert.equal(got.body.salesRep.name, 'Precious N');
    await request(app).patch(`/api/admin/appointments/${appt.body._id}`).set(auth()).send({ seen: true }).expect(200);
    await request(app).delete(`/api/admin/appointments/${appt.body._id}`).set(auth()).expect(204);
  });

  it('sanitises page HTML and auto-slugs new pages', async () => {
    const res = await request(app)
      .post('/api/admin/pages')
      .set(auth())
      .send({ title: 'New Course Page', content: '<p onclick="x()">Hi<script>alert(1)</script></p>' })
      .expect(201);
    assert.equal(res.body.slug, 'new-course-page');
    assert.equal(res.body.content, '<p>Hi</p>');
  });
});
