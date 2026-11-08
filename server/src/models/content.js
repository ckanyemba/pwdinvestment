import mongoose from 'mongoose';

const { Schema, model } = mongoose;
const slug = { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9-]+$/ };

const pageSchema = new Schema(
  {
    slug,
    title: { type: String, required: true, trim: true },
    content: { type: String, default: '' }, // sanitised HTML
    excerpt: String,
    heroImage: String,
    seoTitle: String,
    seoDescription: String,
    navOrder: Number, // shown in the main navigation when set
    navLabel: { type: String, trim: true }, // short menu label (defaults to title)
    published: { type: Boolean, default: true },
    legacyId: Number,
    publishedAt: Date,
  },
  { timestamps: true },
);

const postSchema = new Schema(
  {
    slug,
    title: { type: String, required: true, trim: true },
    content: { type: String, default: '' },
    excerpt: String,
    coverImage: String,
    published: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now },
    legacyId: Number,
  },
  { timestamps: true },
);
postSchema.index({ published: 1, publishedAt: -1 });

const eventSchema = new Schema(
  {
    slug,
    title: { type: String, required: true, trim: true },
    description: String,
    startDate: { type: Date, required: true },
    endDate: Date,
    venue: {
      name: String,
      address: String,
      city: String,
      province: String,
      postalCode: String,
      country: String,
    },
    image: String,
    published: { type: Boolean, default: true },
    legacyId: Number,
  },
  { timestamps: true },
);
eventSchema.index({ published: 1, startDate: -1 });

const testimonialSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    quote: { type: String, required: true },
    role: String,
    company: String,
    photo: String,
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
    legacyId: Number,
  },
  { timestamps: true },
);

// Singleton documents for site-wide settings and the home page layout (key: 'site' | 'home').
const settingSchema = new Schema(
  { key: { type: String, required: true, unique: true }, value: { type: Schema.Types.Mixed, default: {} } },
  { timestamps: true, minimize: false },
);

export const Page = model('Page', pageSchema);
export const Post = model('Post', postSchema);
export const Event = model('Event', eventSchema);
export const Testimonial = model('Testimonial', testimonialSchema);
export const Setting = model('Setting', settingSchema);
