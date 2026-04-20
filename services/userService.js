const bcrypt = require("bcryptjs");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const asyncHandler = require("express-async-handler");

const { default: slugify } = require("slugify");
const fs = require("fs");
const path = require("path");

const Factory = require("./handlersFactory");
const ApiError = require("../utils/apiError");
const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");
const UserModel = require("../models/userModel");
const User = require("../models/userModel");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};

  Object.keys(obj).forEach((key) => {
    if (allowedFields.includes(key)) {
      newObj[key] = obj[key];
    }
  });

  return newObj;
};

//! Upload single image middleware
exports.uploadUserImage = uploadSingleImage("profileImg");

//! Image Processing using 'sharp'
exports.resizeImage = asyncHandler(async (req, res, next) => {
  if (!req.file) return next();

  // Ensure the directory exists
  const uploadDir = path.join(__dirname, "../uploads/users");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Generate a secure filename
  const user = req.params.id ? await UserModel.findById(req.params.id) : null;
  const filename = `user-${slugify(user ? user.name : req.body.name, "_").toLowerCase()}-${uuidv4()}-${Date.now()}.jpeg`;

  // Process the image with sharp
  await sharp(req.file.buffer)
    .resize(600, 600)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(path.join(uploadDir, filename)); // Save image in disk storage

  req.body.profileImg = filename; // Save image name in DB

  next();
});

// @desc      Get a list of users
// @route     GET /api/v1/users
// @access    Private 'admins'
exports.getUsers = Factory.getAll(UserModel);

// @desc      Get a specific user by id
// @route     GET /api/v1/users/:id
// @access    Private 'admins'
exports.getUser = Factory.getOne(UserModel);

// @desc      Create a new user
// @route     POST /api/v1/users
// @access    Private 'admin'
exports.createUser = Factory.createOne(UserModel);

// @desc      Update specific user
// @route     PUT /api/v1/users/:id
// @access    Private 'admin'
exports.updateUser = asyncHandler(async (req, res, next) => {
  // Find category by id and update with data from req.body
  const document = await User.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      slug: req.body.slug,
      email: req.body.email,
      phone: req.body.phone,
      role: req.body.role,
      active: req.body.active,
      profileImg: req.body.profileImg,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!document)
    return next(
      new ApiError(`No document found with this ID ${req.params.id}`, 404)
    );

  res.status(200).json({ data: document });
});

exports.changeUserPassword = asyncHandler(async (req, res, next) => {
  // Find category by id and update with data from req.body
  const document = await User.findByIdAndUpdate(
    req.params.id,
    {
      password: await bcrypt.hash(req.body.password, 12),
      passwordChangedAt: Date.now(),
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!document)
    return next(
      new ApiError(`No document found with this ID ${req.params.id}`, 404)
    );

  res.status(200).json({ data: document });
});

exports.getLoggedUserData = asyncHandler(async (req, res, next) => {
  req.params.id = req.user._id;
  next();
});

exports.updateLoggedUserPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("+password");

  if (!user) {
    return next(new ApiError("User not found.", 404));
  }

  const isCorrectPassword = await bcrypt.compare(
    req.body.currentPassword,
    user.password
  );

  if (!isCorrectPassword) {
    return next(new ApiError("Incorrect current password.", 401));
  }

  user.password = req.body.password;
  user.passwordChangedAt = Date.now();
  await user.save();

  res.status(200).json({
    status: "success",
    message: "Password updated successfully.",
  });
});

exports.updateLoggedUserData = asyncHandler(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new ApiError(
        "This route is not for password updates. Please use /updateMyPassword.",
        400
      )
    );
  }

  const filteredBody = filterObj(
    req.body,
    "name",
    "email",
    "phone",
    "profileImg"
  );

  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: updatedUser,
  });
});

exports.deactivateLoggedUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).send();
});

// @desc      Delete specific user
// @route     DELETE /api/v1/users/:id
// @access    Private 'admin'
exports.deleteUser = Factory.deleteOne(UserModel);
