import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { ICarousel } from './carousel.interface';
import { Carousel } from './carousel.model';

// Get all carousel slides
const getAllCarouselSlides = async () => {
  const slides = await Carousel.find().sort({ order: 1, createdAt: -1 });
  return slides;
};

// Get active carousel slides only
const getActiveCarouselSlides = async () => {
  const slides = await Carousel.find({ isActive: true }).sort({ order: 1 });
  return slides;
};

// Get single carousel slide
const getSingleCarouselSlide = async (id: string) => {
  const slide = await Carousel.findById(id);

  if (!slide) {
    throw new AppError(httpStatus.NOT_FOUND, 'Carousel slide not found');
  }

  return slide;
};

// Create carousel slide
const createCarouselSlide = async (payload: ICarousel) => {
  // If order not provided, set it to be the last
  if (!payload.order && payload.order !== 0) {
    const lastSlide = await Carousel.findOne().sort({ order: -1 });
    payload.order = lastSlide ? lastSlide.order + 1 : 0;
  }

  const slide = await Carousel.create(payload);
  return slide;
};

// Update carousel slide
const updateCarouselSlide = async (id: string, payload: Partial<ICarousel>) => {
  const slide = await Carousel.findById(id);

  if (!slide) {
    throw new AppError(httpStatus.NOT_FOUND, 'Carousel slide not found');
  }

  const updatedSlide = await Carousel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return updatedSlide;
};

// Delete carousel slide
const deleteCarouselSlide = async (id: string) => {
  const slide = await Carousel.findById(id);

  if (!slide) {
    throw new AppError(httpStatus.NOT_FOUND, 'Carousel slide not found');
  }

  await Carousel.findByIdAndDelete(id);
  return slide;
};

// Toggle carousel slide status
const toggleCarouselSlideStatus = async (id: string, isActive: boolean) => {
  const slide = await Carousel.findById(id);

  if (!slide) {
    throw new AppError(httpStatus.NOT_FOUND, 'Carousel slide not found');
  }

  const updatedSlide = await Carousel.findByIdAndUpdate(
    id,
    { isActive },
    { new: true, runValidators: true },
  );

  return updatedSlide;
};

// Reorder carousel slides
const reorderCarouselSlides = async (
  slides: { id: string; order: number }[],
) => {
  // Validate all slides exist
  const slideIds = slides.map((s) => s.id);
  const existingSlides = await Carousel.find({ _id: { $in: slideIds } });

  if (existingSlides.length !== slides.length) {
    throw new AppError(httpStatus.BAD_REQUEST, 'One or more slides not found');
  }

  // Update each slide's order
  const updatePromises = slides.map((slide) =>
    Carousel.findByIdAndUpdate(
      slide.id,
      { order: slide.order },
      { new: true, runValidators: true },
    ),
  );

  await Promise.all(updatePromises);

  // Return updated slides sorted by order
  const updatedSlides = await Carousel.find({ _id: { $in: slideIds } }).sort({
    order: 1,
  });

  return updatedSlides;
};

export const CarouselServices = {
  getAllCarouselSlides,
  getActiveCarouselSlides,
  getSingleCarouselSlide,
  createCarouselSlide,
  updateCarouselSlide,
  deleteCarouselSlide,
  toggleCarouselSlideStatus,
  reorderCarouselSlides,
};
