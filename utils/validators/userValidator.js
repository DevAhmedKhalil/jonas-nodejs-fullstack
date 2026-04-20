const bcrypt = require("bcryptjs");
const slugify = require("slugify");
const { check, body } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const User = require("../../models/userModel");

exports.createUserValidator = [
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
  check("phone")
    .optional()
    .isMobilePhone(["ar-EG", "ar-SA"])
    .withMessage("Invalid phone number only accepted Egy and SA numbers."),

  check("profileImg").optional(),
  check("role").optional(),
  validatorMiddleware,
];

exports.getUserValidator = [
  //@ 1- Rules
  check("id").isMongoId().withMessage("Invalid ID format."),
  //@ 2- Middleware --> Catch errors from Rules if exists
  validatorMiddleware,
];

exports.updateUserValidator = [
  check("id").isMongoId().withMessage("Invalid ID format."),
  check("name")
    .optional()
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
  check("phone")
    .optional()
    .isMobilePhone(["ar-EG", "ar-SA"])
    .withMessage("Invalid phone number only accepted Egy and SA numbers."),
  check("profileImg").optional(),
  check("role").optional(),
  validatorMiddleware,
];

exports.changeUserPasswordValidator = [
  check("id").isMongoId().withMessage("Invalid ID format."),
  body("currentPassword")
    .notEmpty()
    .withMessage("You must enter your current password."),
  body("passwordConfirm")
    .notEmpty()
    .withMessage("You must enter the password confirmation."),
  body("password")
    .notEmpty()
    .withMessage("You must enter a new password.")
    .custom(async (val, { req }) => {
      //? 1) Verify current password
      const user = await User.findById(req.params.id).select("+password");
      if (!user) {
        throw new Error("User not found with this ID.");
      }
      const isCorrectPassword = await bcrypt.compare(
        req.body.currentPassword,
        user.password
      );
      if (!isCorrectPassword) {
        throw new Error("Incorrect current password.");
      }

      //? 2) Verify password confirm
      if (val !== req.body.passwordConfirm) {
        throw new Error("Passwords Confirmation Incorrect.");
      }

      //? 3) Verify current and new password isn't the same
      if (req.body.currentPassword === req.body.password) {
        throw new Error(
          "New password should be different from current password."
        );
      }

      return true;
    }),

  //@ 3) Middleware catches errors
  validatorMiddleware,
];

exports.deleteUserValidator = [
  check("id").isMongoId().withMessage("Invalid ID format."),
  validatorMiddleware,
];

exports.updateLoggedUserValidator = [
  check("name")
    .optional()
    .isLength({ min: 3 })
    .withMessage("Too short User name.")
    .isLength({ max: 50 })
    .withMessage("Too long User name.")
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  check("email")
    .optional()
    .isEmail()
    .withMessage("Invalid email address.")
    .custom(async (val, { req }) => {
      const user = await User.findOne({ email: val });
      if (user && user._id.toString() !== req.user._id.toString()) {
        throw new Error("Email already in use.");
      }
      return true;
    }),
  check("phone")
    .optional()
    .isMobilePhone(["ar-EG", "ar-SA"])
    .withMessage("Invalid phone number only accepted Egy and SA numbers."),
  validatorMiddleware,
];

exports.updateLoggedUserPasswordValidator = [
  body("currentPassword")
    .notEmpty()
    .withMessage("You must enter your current password."),
  body("password")
    .notEmpty()
    .withMessage("You must enter a new password.")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters."),
  body("passwordConfirm")
    .notEmpty()
    .withMessage("You must enter the password confirmation.")
    .custom((passwordConfirm, { req }) => {
      if (passwordConfirm !== req.body.password) {
        throw new Error("Passwords Confirmation Incorrect.");
      }

      if (req.body.currentPassword === req.body.password) {
        throw new Error(
          "New password should be different from current password."
        );
      }

      return true;
    }),
  validatorMiddleware,
];
