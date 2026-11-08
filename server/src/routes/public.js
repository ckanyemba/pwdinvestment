import { Router } from 'express';
import { Event, Page, Post, Setting, Testimonial } from '../models/content.js';
import { resolveMedia } from '../lib/media.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';

const router = Router();

// Public content is cacheable at the edge; Next.js also revalidates on its side.
router.use((req, res, next) => {
  res.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
  next();
});

const send = async (res, data) => res.json(await resolveMedia(data));

router.get(
  '/site',
  asyncHandler(async (req, res) => {
    const [settings, nav] = await Promise.all([
      Setting.find({ key: { $in: ['site', 'home'] } }).lean(),
      Page.find({ published: true, navOrder: { $ne: null } }, { slug: 1, title: 1, navLabel: 1, navOrder: 1, _id: 0 })
        .sort({ navOrder: 1 })
        .lean(),
    ]);
    const byKey = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    await send(res, { site: byKey.site || {}, home: byKey.home || {}, nav });
  }),
);

router.get(
  '/pages',
  asyncHandler(async (req, res) => {
    const pages = await Page.find({ published: true }, { slug: 1, title: 1, excerpt: 1, heroImage: 1, updatedAt: 1 })
      .sort({ title: 1 })
      .lean();
    await send(res, pages);
  }),
);

router.get(
  '/pages/:slug',
  asyncHandler(async (req, res) => {
    const page = await Page.findOne({ slug: req.params.slug, published: true }).lean();
    if (!page) throw new HttpError(404, 'Page not found');
    await send(res, page);
  }),
);

router.get(
  '/posts',
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const posts = await Post.find({ published: true, publishedAt: { $lte: new Date() } }, { content: 0 })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean();
    await send(res, posts);
  }),
);

router.get(
  '/posts/:slug',
  asyncHandler(async (req, res) => {
    const post = await Post.findOne({ slug: req.params.slug, published: true }).lean();
    if (!post) throw new HttpError(404, 'Post not found');
    await send(res, post);
  }),
);

router.get(
  '/events',
  asyncHandler(async (req, res) => {
    const now = new Date();
    const filter = { published: true };
    if (req.query.when === 'upcoming') filter.$or = [{ endDate: { $gte: now } }, { endDate: null, startDate: { $gte: now } }];
    if (req.query.when === 'past') filter.$or = [{ endDate: { $lt: now } }, { endDate: null, startDate: { $lt: now } }];
    const events = await Event.find(filter)
      .sort({ startDate: req.query.when === 'upcoming' ? 1 : -1 })
      .limit(100)
      .lean();
    await send(res, events);
  }),
);

router.get(
  '/events/:slug',
  asyncHandler(async (req, res) => {
    const event = await Event.findOne({ slug: req.params.slug, published: true }).lean();
    if (!event) throw new HttpError(404, 'Event not found');
    await send(res, event);
  }),
);

router.get(
  '/testimonials',
  asyncHandler(async (req, res) => {
    await send(res, await Testimonial.find({ published: true }).sort({ order: 1, createdAt: 1 }).lean());
  }),
);

export default router;
