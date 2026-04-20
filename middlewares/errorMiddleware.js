const ApiError = require("../utils/apiError");

// Global Error Middleware
const globalError = (err, req, res, next) => {
  console.log(
    "NODE_ENV=" + process.env.NODE_ENV + "\nGlobal ERROR💥 " + err.message
  );

  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // Send error response
  sendErrorResponse(err, req, res);
};

const handleJwtInvalidSignature = () =>
  new ApiError("Invalid token, please login again...", 401);

const handleJwtExpired = () =>
  new ApiError("Token expired, please login again...", 401);

const handleCastErrorDB = (err) =>
  new ApiError(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateFieldsDB = (err) => {
  const value = Object.values(err.keyValue).join(", ");
  return new ApiError(`Duplicate field value: ${value}. Please use another value.`, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((val) => val.message);
  return new ApiError(`Invalid input data. ${errors.join(". ")}`, 400);
};

//! Choose sending error to production or development mode
const sendErrorResponse = (err, req, res) => {
  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else {
    if (err.name === "CastError") err = handleCastErrorDB(err);
    if (err.code === 11000) err = handleDuplicateFieldsDB(err);
    if (err.name === "ValidationError") err = handleValidationErrorDB(err);
    if (err.name === "JsonWebTokenError") err = handleJwtInvalidSignature();
    if (err.name === "TokenExpiredError") err = handleJwtExpired();
    sendErrorProd(err, res);
  }
};

// @desc Send error response in development mode
const sendErrorDev = (err, res) => {
  console.log("IN sendErrorDev 🌋");

  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// @desc Send error response in production mode
const sendErrorProd = (err, res) => {
  console.log("IN sendErrorProd 🌋");

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};

module.exports = globalError;
