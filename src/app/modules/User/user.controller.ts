import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { UserService } from './user.service';

// Get all users (Admin only)
const getAllUsers = catchAsync(async (req, res) => {
  const result = await UserService.getAllUsersFromDB();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Users retrieved successfully',
    data: result,
  });
});

// Get single user by ID
const getSingleUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await UserService.getSingleUserFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User retrieved successfully',
    data: result,
  });
});

// Get user profile (current logged-in user)
const getMyProfile = catchAsync(async (req, res) => {
  const userId = req.user?.id; // Assuming auth middleware sets req.user
  const result = await UserService.getUserProfile(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Profile retrieved successfully',
    data: result,
  });
});

// Update user profile
const updateMyProfile = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const result = await UserService.updateUserProfile(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Profile updated successfully',
    data: result,
  });
});

// Change password
const changePassword = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const { oldPassword, newPassword } = req.body;

  await UserService.changePassword(userId, oldPassword, newPassword);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Password changed successfully',
    data: null,
  });
});

// Update user status (Admin only)
const updateUserStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const result = await UserService.updateUserStatus(id, status);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User status updated successfully',
    data: result,
  });
});

// Update user role (Admin only)
const updateUserRole = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const result = await UserService.updateUserRole(id, role);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User role updated successfully',
    data: result,
  });
});

// Delete user (Soft delete)
const deleteUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  await UserService.deleteUser(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User deleted successfully',
    data: null,
  });
});

export const UserController = {
  getAllUsers,
  getSingleUser,
  getMyProfile,
  updateMyProfile,
  changePassword,
  updateUserStatus,
  updateUserRole,
  deleteUser,
};
