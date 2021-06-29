const { check } = require('express-validator') 

exports.userSignupValidtor = [
    check('name')
    .not()
    .isEmpty()
    .withMessage('Name is required'),

    check('email')
    .not()
    .isEmpty()
    .withMessage('Email is required'), 

    check('password')
    .isLength({min: 6})
    .withMessage('Password must be atleast 6 charactors long')
]

exports.userSigninValidtor = [
  
    check('email')
    .not()
    .isEmpty()
    .withMessage('Email is required'), 

    check('password')
    .isLength({min:6})
    .withMessage('Password must be atleast 6 charactors long')
]