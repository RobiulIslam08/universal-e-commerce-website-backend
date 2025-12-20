// import httpStatus from 'http-status';
// import catchAsync from '../../utils/catchAsync';
// import sendResponse from '../../utils/sendResponse';
// import { CarouselServices } from './carousel.service';
// import { sendImageToCloudinary } from '../../utils/sendImageToCloudinary';

// // Get all carousel slides
// const getAllCarouselSlides = catchAsync(async (req, res) => {
//   const slides = await CarouselServices.getAllCarouselSlides();

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Carousel slides retrieved successfully',
//     data: slides,
//   });
// });

// // Get active carousel slides
// const getActiveCarouselSlides = catchAsync(async (req, res) => {
//   const slides = await CarouselServices.getActiveCarouselSlides();

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Active carousel slides retrieved successfully',
//     data: slides,
//   });
// });

// // Get single carousel slide
// const getSingleCarouselSlide = catchAsync(async (req, res) => {
//   const { id } = req.params;
//   const slide = await CarouselServices.getSingleCarouselSlide(id);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Carousel slide retrieved successfully',
//     data: slide,
//   });
// });

// // Create carousel slide
// const createCarouselSlide = catchAsync(async (req, res) => {
//   const carouselData = req.body;

//   // Handle image upload if file exists
//   if (req.file) {
//     const imageName = `carousel-${Date.now()}`;

//     // Check if using memory storage (buffer) or disk storage (path)
//     if (req.file.buffer) {
//       // For memory storage (Vercel compatible)
//       const { sendImageToCloudinaryFromBuffer } = await import(
//         '../../utils/sendImageToCloudinary'
//       );
//       const { secure_url } = await sendImageToCloudinaryFromBuffer(
//         imageName,
//         req.file.buffer,
//       );
//       carouselData.image = secure_url;
//     } else if (req.file.path) {
//       // For disk storage (local development)
//       const { secure_url } = await sendImageToCloudinary(
//         imageName,
//         req.file.path,
//       );
//       carouselData.image = secure_url;
//     }
//   }

//   // Convert string values to appropriate types
//   if (carouselData.isActive !== undefined) {
//     carouselData.isActive =
//       carouselData.isActive === 'true' || carouselData.isActive === true;
//   }

//   if (carouselData.order !== undefined) {
//     carouselData.order = Number(carouselData.order);
//   }

//   const slide = await CarouselServices.createCarouselSlide(carouselData);

//   sendResponse(res, {
//     statusCode: httpStatus.CREATED,
//     success: true,
//     message: 'Carousel slide created successfully',
//     data: slide,
//   });
// });

// // Update carousel slide
// const updateCarouselSlide = catchAsync(async (req, res) => {
//   const { id } = req.params;
//   const updateData = req.body;

//   // Handle image upload if file exists
//   if (req.file) {
//     const imageName = `carousel-${Date.now()}`;

//     // Check if using memory storage (buffer) or disk storage (path)
//     if (req.file.buffer) {
//       // For memory storage (Vercel compatible)
//       const { sendImageToCloudinaryFromBuffer } = await import(
//         '../../utils/sendImageToCloudinary'
//       );
//       const { secure_url } = await sendImageToCloudinaryFromBuffer(
//         imageName,
//         req.file.buffer,
//       );
//       updateData.image = secure_url;
//     } else if (req.file.path) {
//       // For disk storage (local development)
//       const { secure_url } = await sendImageToCloudinary(
//         imageName,
//         req.file.path,
//       );
//       updateData.image = secure_url;
//     }
//   }

//   // Convert string values to appropriate types
//   if (updateData.isActive !== undefined) {
//     updateData.isActive =
//       updateData.isActive === 'true' || updateData.isActive === true;
//   }

//   if (updateData.order !== undefined) {
//     updateData.order = Number(updateData.order);
//   }

//   const slide = await CarouselServices.updateCarouselSlide(id, updateData);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Carousel slide updated successfully',
//     data: slide,
//   });
// });

// // Delete carousel slide
// const deleteCarouselSlide = catchAsync(async (req, res) => {
//   const { id } = req.params;
//   await CarouselServices.deleteCarouselSlide(id);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Carousel slide deleted successfully',
//     data: null,
//   });
// });

// // Toggle carousel slide status
// const toggleCarouselSlideStatus = catchAsync(async (req, res) => {
//   const { id } = req.params;
//   const { isActive } = req.body;

//   const slide = await CarouselServices.toggleCarouselSlideStatus(id, isActive);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Carousel slide status updated successfully',
//     data: slide,
//   });
// });

// // Reorder carousel slides
// const reorderCarouselSlides = catchAsync(async (req, res) => {
//   const { slides } = req.body;

//   const updatedSlides = await CarouselServices.reorderCarouselSlides(slides);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Carousel slides reordered successfully',
//     data: updatedSlides,
//   });
// });

// export const CarouselControllers = {
//   getAllCarouselSlides,
//   getActiveCarouselSlides,
//   getSingleCarouselSlide,
//   createCarouselSlide,
//   updateCarouselSlide,
//   deleteCarouselSlide,
//   toggleCarouselSlideStatus,
//   reorderCarouselSlides,
// };
