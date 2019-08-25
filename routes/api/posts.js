// Main
const express = require("express")
const router = express.Router()
const passport = require("passport")
const isEmpty = require("../../validation/is-empty")
const cors = require("cors")

// Upload
const upload = require("../../server")

// Validation
const validationPost = require("../../validation/posts")

// Load model
const Post = require("../../models/Post")

// @route   POST api/posts
// @desc    add post
// @access  Private
router.post(
  "/",
  cors(),
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    upload(req, res, err => {
      const { errors, isValid } = validationPost(req.body)

      if (!isValid) {
        return res.status(400).json(errors)
      }
      if (!err) {
        const post = new Post({
          user: req.user.id,
          judul: req.body.judul,
          deskripsi: req.body.deskripsi,
          foto: req.file.filename
        })

        post.save().then(() => {
          res.json(post)
        })
      } else {
        res.status(400).json({
          message: err
        })
      }
    })
  }
)

// @route   GET api/posts
// @desc    Get all post
// @access  Public
router.get("/", (req, res) => {
  Post.find()
    .sort({
      date: -1
    })
    .then(posts => {
      return res.json(posts)
    })
    .catch(() => {
      return res.status(404).json({
        notFound: "posts not found"
      })
    })
})

// @route   GET api/posts/:user_id
// @desc    Get post by user ID
// @access  Public
router.get("/:user_id", (req, res) => {
  Post.findById(req.params.user_id)
    .then(post => {
      return res.json(post)
    })
    .catch(() => {
      return res.status(404).json({
        postNotFound: "no post found by that ID"
      })
    })
})

// @route   DELETE api/posts/:user_id
// @desc    Delete post by user ID
// @access  private
router.delete(
  "/:post_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Post.findById(req.params.post_id).then(post => {
      post
        .remove()
        .then(() => {
          res.json({ success: true })
        })
        .catch(err => {
          res.status(404).json(`cannot delete posts with errors : ${err}`)
        })
    })
  }
)

module.exports = router
