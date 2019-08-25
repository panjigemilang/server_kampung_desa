// Required modules
const express = require("express")
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const passport = require("passport")
const crypto = require("crypto")
const multer = require("multer")
const Grid = require("gridfs-stream")
const GridFsStorage = require("multer-gridfs-storage")
const path = require("path")
const cors = require("cors")

const app = express()

// Body Parser
app.use(
  bodyParser.urlencoded({
    extended: true
  })
)
app.use(bodyParser.json())

// DB Config and create mongo connection
const db = require("./config/keys").mongoURI

// Connecting to mongoDB
mongoose.connect(db, { useNewUrlParser: true })

// Init gfs
let gfs

// create gfs on connection 'open'
mongoose.connection
  .once("open", () => {
    // Init stream
    gfs = Grid(mongoose.connection.db, mongoose.mongo)
    gfs.collection("uploads")

    app.locals.gfs = gfs
    console.log("mongoDB connected and gfs has been created")
  })
  .on("error", err => {
    console.log("connection error", err)
  })

// Create storage engine
const storage = new GridFsStorage({
  url: db,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err)
        }
        const filename = buf.toString("hex") + path.extname(file.originalname)
        const fileInfo = {
          filename: filename,
          bucketName: "uploads"
        }
        resolve(fileInfo)
      })
    })
  }
})
const upload = multer({ storage }).single("thumbnail")

module.exports = upload

// Routes
const user = require("./routes/api/users")
const post = require("./routes/api/posts")

// Passport Middleware
app.use(passport.initialize())

// Passport config
require("./config/passport")(passport)

// Handle Cors
app.options("*", cors())
app.use(cors({ credentials: true, origin: true }))

// use routes
app.use("/api/users", user)
app.use("/api/posts", post)

// @route GET /image/:filename
// @desc Display Image
app.get("/image/:filename", (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: "No file exists"
      })
    }

    // Check if image
    if (file.contentType === "image/jpeg" || file.contentType === "image/png") {
      // Read output to browser
      const readstream = gfs.createReadStream(file.filename)
      readstream.pipe(res)
    } else {
      res.status(404).json({
        err: "Not an image"
      })
    }
  })
})

// @route DELETE /files/:id
// @desc  Delete file
app.delete("/files/:name", (req, res) => {
  gfs.remove(
    { filename: req.params.name, root: "uploads" },
    (err, gridStore) => {
      if (err) {
        return res.status(404).json({ err: err })
      }
      res.redirect("/")
    }
  )
})

const port = process.env.PORT || 5000

app.listen(port, () => console.log(`Server running on port ${port}`))
