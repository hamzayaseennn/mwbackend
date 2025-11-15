const { validationResult } = require('express-validator');

// Higher-order function that returns the actual middleware
const validate = (rules) => [
  ...rules,                                   // spread the validators
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }
    next();
  }
];

module.exports = validate;

