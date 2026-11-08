import { Router } from 'express';
import { asyncHandler, HttpError } from '../../middleware/errors.js';
import { resolveMedia } from '../../lib/media.js';

const PROTECTED = ['_id', 'id', 'createdAt', 'updatedAt', '__v'];
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Builds list/get/create/update/delete routes for a Mongoose model.
 * - search: fields matched case-insensitively by ?q=
 * - filters: query params copied into the filter verbatim (e.g. status)
 * - populate: refs to populate on read
 * - prepare(body, req): hook to clean/transform incoming bodies (e.g. sanitise HTML)
 * - listProjection / listTransform: shape list rows (e.g. mask sensitive values)
 * - exactSearch(q): extra $or clauses for exact matches (e.g. blind-index lookups)
 */
export function crudRouter(Model, opts = {}) {
  const {
    search = [],
    filters = [],
    populate = [],
    sort = { createdAt: -1 },
    prepare = (b) => b,
    listProjection,
    listTransform = (d) => d,
    exactSearch,
  } = opts;
  const router = Router();
  const decrypt = (doc) => (Model.decryptDoc ? Model.decryptDoc(doc) : doc);

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 200);
      const filter = {};
      for (const f of filters) if (req.query[f] !== undefined && req.query[f] !== '') filter[f] = String(req.query[f]);
      const q = String(req.query.q || '').trim();
      if (q) {
        const rx = new RegExp(escapeRegex(q), 'i');
        filter.$or = [...search.map((f) => ({ [f]: rx })), ...(exactSearch ? exactSearch(q) : [])];
      }
      const sortBy = req.query.sort ? { [String(req.query.sort).replace(/^-/, '')]: String(req.query.sort).startsWith('-') ? -1 : 1 } : sort;

      let query = Model.find(filter, listProjection).sort(sortBy).skip((page - 1) * limit).limit(limit);
      for (const p of populate) query = query.populate(p, 'name post');
      const [rows, total] = await Promise.all([query.lean(), Model.countDocuments(filter)]);
      res.json({ data: await resolveMedia(rows.map((r) => listTransform(decrypt(r)))), page, limit, total, pages: Math.ceil(total / limit) });
    }),
  );

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      let query = Model.findById(req.params.id);
      for (const p of populate) query = query.populate(p, 'name post');
      const doc = await query.lean();
      if (!doc) throw new HttpError(404, 'Not found');
      res.json(await resolveMedia(decrypt(doc)));
    }),
  );

  const clean = async (body, req) => {
    const copy = { ...(body || {}) };
    for (const k of PROTECTED) delete copy[k];
    for (const k of Object.keys(copy)) if (k.endsWith('Hash')) delete copy[k];
    return prepare(copy, req);
  };

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const doc = new Model(await clean(req.body, req));
      await doc.save();
      res.status(201).json(doc.toJSON());
    }),
  );

  const update = asyncHandler(async (req, res) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) throw new HttpError(404, 'Not found');
    doc.set(await clean(req.body, req));
    await doc.save();
    res.json(doc.toJSON());
  });
  router.put('/:id', update);
  router.patch('/:id', update);

  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const doc = await Model.findByIdAndDelete(req.params.id);
      if (!doc) throw new HttpError(404, 'Not found');
      res.status(204).end();
    }),
  );

  return router;
}
