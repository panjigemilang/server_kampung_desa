// Main
const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const cors = require("cors")

// Model
const User = require("../../models/User")

// Key
const keys = require("../../config/keys")

// Validation
const validationRegister = require("../../validation/register")
const validationLogin = require("../../validation/login")

// Register New User
router.post("/register", cors(), (req, res) => {
  const { errors, isValid } = validationRegister(req.body)

  if (!isValid) {
    return res.status(400).json(errors)
  }

  // Check for user username if exists
  User.findOne({
    username: req.body.username
  })
    .then(user => {
      if (!user) {
        // Register success
        // make new user
        const newUser = new User({
          username: req.body.username,
          password: req.body.password
        })

        // bcrypting password
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            newUser.password = hash
            newUser
              .save()
              .then(user => res.json(user))
              .catch(err => console.log(err))
          })
        })
      } else {
        res.status(404).json({
          user: "User Not Found"
        })
      }
    })
    .catch(err => {
      res.status(404).json({
        errors: err
      })
    })
})

// Login User
router.post("/login", cors(), (req, res) => {
  const username = req.body.username
  const password = req.body.password

  const { errors, isValid } = validationLogin(req.body)

  if (!isValid) {
    return res.status(400).json(errors)
  }

  // find user by username
  User.findOne({
    username
  }).then(user => {
    if (!user) {
      return res.status(400).json({
        username: "user not found"
      })
    } else {
      bcrypt.compare(password, user.password).then(isMatch => {
        if (isMatch) {
          // create payload
          const payload = {
            id: user.id,
            name: user.name
          }

          // Sign token
          jwt.sign(
            payload,
            keys.secretOrKey,
            {
              expiresIn: 3600
            },
            (err, token) => {
              res.json({
                success: true,
                // use Bearer protocol format
                token: "Bearer " + token
              })
            }
          )
        } else {
          return res.status(400).json({
            password: "password incorrect"
          })
        }
      })
    }
  })
})

router.get("/test", cors(), (req, res) => res.json({ message: "It works" }))

module.exports = router
