// const bcrypt = require("bcryptjs");
const slugify = require("slugify");
const { check } = require("express-validator");

const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const User = require("../../models/userModel");

// @desc          Signup
// @route         GET /api/v1/auth/signup
// @access        Public
exports.signupValidator = [
  check("name")
    .notEmpty()
    .withMessage("User name is required.")
    .isLength({ min: 3 })
    .withMessage("Too short User name.")
    .isLength({ max: 50 })
    .withMessage("Too long User name.")
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),

  check("email")
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Invalid email address.")
    .custom((val) =>
      User.findOne({ email: val }).then((user) => {
        if (user) {
          return Promise.reject(new Error("Email already in user."));
        }
      })
    ),

  check("password")
    .notEmpty()
    .withMessage("Password is required.")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters."),

  check("passwordConfirm")
    .notEmpty()
    .withMessage("Password Confirm is required.")
    .custom((passwordConfirm, { req }) => {
      if (passwordConfirm !== req.body.password) {
        throw new Error("Passwords Confirmation Incorrect.");
      }
      return true;
    }),

  validatorMiddleware,
];

// @desc          Signup
// @route         GET /api/v1/auth/signup
// @access        Public
exports.loginValidator = [
  check("email")
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Invalid email address."),

  check("password")
    .notEmpty()
    .withMessage("Password is required.")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters."),

  validatorMiddleware,
];

exports.forgotPasswordValidator = [
  check("email")
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Invalid email address."),
  validatorMiddleware,
];

exports.verifyResetCodeValidator = [
  check("resetCode")
    .notEmpty()
    .withMessage("Reset code is required.")
    .isLength({ min: 6, max: 6 })
    .withMessage("Reset code must be 6 digits."),
  validatorMiddleware,
];

exports.resetPasswordValidator = [
  check("email")
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Invalid email address."),
  check("newPassword")
    .notEmpty()
    .withMessage("New password is required.")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters."),
  check("passwordConfirm")
    .notEmpty()
    .withMessage("Password confirmation is required.")
    .custom((passwordConfirm, { req }) => {
      if (passwordConfirm !== req.body.newPassword) {
        throw new Error("Passwords Confirmation Incorrect.");
      }
      return true;
    }),
  validatorMiddleware,
];
