import { Schema, model } from 'mongoose';
import { ICarousel } from './carousel.interface';

const carouselSchema = new Schema<ICarousel>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    subtitle: {
      type: String,
      required: [true, 'Subtitle is required'],
      trim: true,
    },
    badge: {
      type: String,
      required: [true, 'Badge text is required'],
      trim: true,
    },
    badgeSubtext: {
      type: String,
      required: [true, 'Badge subtext is required'],
      trim: true,
    },
    bgColor: {
      type: String,
      required: [true, 'Background color is required'],
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    buttonText: {
      type: String,
      trim: true,
    },
    buttonLink: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      required: [true, 'Order is required'],
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Index for better query performance
carouselSchema.index({ order: 1, isActive: 1 });

export const Carousel = model<ICarousel>('Carousel', carouselSchema);
