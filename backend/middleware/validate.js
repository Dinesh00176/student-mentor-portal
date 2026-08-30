const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Runs after express-validator chains; turns failures into a 400 ApiError
function validate(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const messages = result.array().map((e) => e.msg);
    return next(new ApiError(400, 'Validation failed.', messages));
  }
  next();
}

module.exports = validate;
