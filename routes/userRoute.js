const express = require("express");
const {
  getUserValidator,
  createUserValidator,
  updateUserValidator,
  deleteUserValidator,
  changeUserPasswordValidator,
  updateLoggedUserValidator,
  updateLoggedUserPasswordValidator,
} = require("../utils/validators/userValidator");
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  uploadUserImage,
  resizeImage,
  changeUserPassword,
  getLoggedUserData,
  updateLoggedUserData,
  updateLoggedUserPassword,
  deactivateLoggedUser,
} = require("../services/userService");

const authServices = require("../services/authService");

const router = express.Router();

//! Routes
router.get("/getMe", authServices.protect, getLoggedUserData, getUser);
router.put(
  "/updateMyPassword",
  authServices.protect,
  updateLoggedUserPasswordValidator,
  updateLoggedUserPassword
);
router.put(
  "/updateMe",
  authServices.protect,
  uploadUserImage,
  resizeImage,
  updateLoggedUserValidator,
  updateLoggedUserData
);
router.delete("/deleteMe", authServices.protect, deactivateLoggedUser);

router.put(
  "/changePassword/:id",
  authServices.protect,
  authServices.allowedTo("admin"),
  changeUserPasswordValidator,
  changeUserPassword
);
router
  .route("/")
  .get(
    // Get all users
    authServices.protect,
    authServices.allowedTo("admin", "manager"),
    getUsers
  )
  .post(
    // Create user
    authServices.protect,
    authServices.allowedTo("admin"),
    uploadUserImage,
    resizeImage,
    createUserValidator,
    createUser
  );
router
  .route("/:id")
  .get(
    // Get specific user
    authServices.protect,
    authServices.allowedTo("admin"),
    getUserValidator,
    getUser
  )
  .put(
    // Update user
    authServices.protect,
    authServices.allowedTo("admin"),
    uploadUserImage,
    resizeImage,
    updateUserValidator,
    updateUser
  )
  .delete(
    // Delete user
    authServices.protect,
    authServices.allowedTo("admin"),
    deleteUserValidator,
    deleteUser
  );

module.exports = router;
