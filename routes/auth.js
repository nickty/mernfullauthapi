const express = require('express')
const { signup, accountActivation, signin, googleLogin, facebookLogin } = require('../controllers/auth')
const { runValidation } = require('../validators')
const { userSignupValidtor, userSigninValidtor } = require('../validators/auth')
const router = express.Router()


router.post('/signup', userSignupValidtor, runValidation, signup)
router.post('/signin', userSigninValidtor, runValidation, signin)
router.post('/account-activation', accountActivation)

//route for google
router.post('/google-login', googleLogin)
router.post('/facebook-login', facebookLogin)


module.exports = router