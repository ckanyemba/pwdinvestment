import mongoose from 'mongoose';

const mediaAssetSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: String,
    resourceType: { type: String, default: 'image' },
    format: String,
    bytes: Number,
    width: Number,
    height: Number,
    originalName: String,
    legacyPath: { type: String, index: { unique: true, sparse: true } }, // e.g. 2016/01/Forex.jpg
    uploadedBy: String,
  },
  { timestamps: true },
);

export const MediaAsset = mongoose.model('MediaAsset', mediaAssetSchema);
