const User = require("../models/user")
const jwt = require('jsonwebtoken')
const nodeFetch = require('node-fetch')
const sgMail = require('@sendgrid/mail')

// const { GoogleAuth } = require('google-auth-library')
const { OAuth2Client } = require('google-auth-library');

const expressJwt = require('express-jwt');
const { response } = require("express");

sgMail.setApiKey(process.env.SEND_GRID_API_KEYN)

exports.signup = (req, res) => {


    const { name, email, password } = req.body

    console.log(req.body)

    User.findOne({email}).exec((err, user) => {
        if(user){
            return res.status(400).json({
                error: 'Email is taken'
            })
        }

        const token = jwt.sign({name, email, password}, process.env.JWT_ACC_ACT, {expiresIn: '10m'})

        //send email

        const emailData = {
            from: 'flipcute.com@gmail.com',
            to: email,
            subject: 'Account activation link',
            html:`
                <p>Please use the following link to activate your account</p>
                <p>${process.env.CLIENT_URL}/auth/activate/${token}</p>
                <hr />
                <p>This meal may contain senetive information</p>
                <p>${process.env.CLIENT_URL}</p>
            `
        }

        // sgMail.send(emailData).then(sent => {
        //     console.log('Sign up email sent')
        //     return res.json({
        //         message: `Email has been sent to ${email}. Follow the instruction to active your account`
        //     })
        // })

        sgMail.send(emailData).then(() => {
            console.log('Message sent')
        }).catch((error) => {
            console.log(error.response.body)
        
            return res.json({
                message: error.message
            })
        })
    })

  

}

exports.accountActivation = (req, res) => {
    const { token } = req.body

    if(token){
        jwt.verify(token, process.env.JWT_ACC_ACT, function(err, decoded){
            if(err){
                console.log('JWT verify in account activation error', err)
                return res.status(401).json({
                    error: 'Expired link, Signup again'
                })
            }

            const {name, email, password} =  jwt.decode(token)

                let newUser = new User({name, email, password})

                newUser.save((err, success) => {
                    if(err){
                        console.log('Signup Error', err)
                        return res.status(4001).json({
                            err: err
                        })
                    }
                    res.json(
                        {
                            message: 'Signup success! Please signin'
                        }
                    )
                })
        })
    } else {
        return res.josn({

            message: 'Something went wrong. Try again'
        })
    }
}

exports.signin = async (req, res) => {
    const { email, password } = req.body

    console.log({email, password})

    await User.findOne({email}).exec((err, user) => {
        console.log(err)
        if(err || !user){
            return res.status(400).json({
                error: 'User with that email does not exist, please signup'
            })
        }

        //authenticate 
        if(!user.authenticate(password)){
            return res.status(400).json({
                error: 'Email and password do not match'
            })
        }

        //generate token and send to client

        const token = jwt.sign({_id: user._id}, process.env.JWT_SEC, {expiresIn: '7d'})

        const {_id, name, email, role} = user 

        return res.json({
            token, 
            user
        })
    })
}


exports.requireSignin = expressJwt({
    secret: process.env.JWT_SEC,
    algorithms: ["HS256"] 
}) 


exports.adminMiddleware = (req, res) => {
    User.findById({_id: req.user._id}).exec((err, user) => {
        if(err || !user){
            return res.status(400).json({
                error: 'User not found'
            })
        }

        if(user.role !== 'admin'){
            return res.status(400).json({
                error: 'User not admin'
            })
        }

        req.profile = user

        next()
    })
} 

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
exports.googleLogin = (req, res) => {
    const {idToken} = req.body

    console.log('hihi hi')

    client.verifyIdToken({idToken, audience: process.env.GOOGLE_CLIENT_ID})
    .then(response => {
        //console log the response 
        const { email_verified, name, email} = response.payload

        if(email_verified){
            User.findOne({email}).exec((err, user) => {
                if(user){

                    const token = jwt.sign({_id: user._id}, process.env.JWT_SEC, {expiresIn: '7d'})
                    const {_id, email, name, role } = user
                    return res.json({
                        token, user: { _id, email, name, role }
                    })
                } else {
                    let password = email + process.env.JWT_SEC
                    user = new User({name, email, password})
                    user.save((err, data) => {
                        if(err){
                            console.log('Error Google Login on User Save', err)
                            return res.status(400),json({
                                error: 'User Signup failed with google'
                            })
                        }

                        const token = jwt.sign({_id: data._id}, process.env.JWT_SEC, {expiresIn: '7d'})
                        const {_id, email, name, role } = user
                        return res.json({
                            token, user: { _id, email, name, role }
                        })
                    })
                }
                
            })
        } else {
            return res.status(400),json({
                error: 'Google login failed, try again'
            })
        }
    })
}

exports.facebookLogin = (req, res) => {
    
    const { userID, accessToken } = req.body

    const url = `https://graph.facebook.com/v2.11/${userID}/?fields=id,name,email&access_token=${accessToken}`

    return (
        nodeFetch(url, {
            method: 'GET'
        })
        .then(response => response.json())
        .then(response => {
            const {email, name} = response

            User.findOne({email}).exec((err, user) => {
                if(user){
                    const token = jwt.sign({_id: user._id}, process.env.JWT_SEC, {expiresIn: '7d'})
                    const {_id, email, name, role } = user
                    return res.json({
                        token, user: { _id, email, name, role }
                    })
                } else {
                    let password = email + process.env.JWT_SEC
                    user = new User({name, email, password})
                    user.save((err, data) => {
                        if(err){
                            console.log('Error Facebook Login on User Save', err)
                            return res.status(400),json({
                                error: 'User Signup failed with facebook'
                            })
                        }

                        const token = jwt.sign({_id: data._id}, process.env.JWT_SEC, {expiresIn: '7d'})
                        const {_id, email, name, role } = user
                        return res.json({
                            token, user: { _id, email, name, role }
                        })
                    })
                }
            })
        })
        .catch(error => {
            res.json({
                error: 'Facebook login failed, try again'
            })
        })
    )
}