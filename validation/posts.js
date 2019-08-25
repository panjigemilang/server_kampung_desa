const isEmpty = require("./is-empty")
const validator = require("validator")

module.exports = function validateLogininput(data) {
  let errors = {}
  data.judul = !isEmpty(data.judul) ? data.judul : ""
  data.deskripsi = !isEmpty(data.deskripsi) ? data.deskripsi : ""

  if (validator.isEmpty(data.judul)) {
    errors.judul = "Field judul harus diisi!"
  }

  if (validator.isEmpty(data.deskripsi)) {
    errors.deskripsi = "Field deskripsi harus diisi!"
  }

  return {
    errors,
    isValid: isEmpty(errors)
  }
}
