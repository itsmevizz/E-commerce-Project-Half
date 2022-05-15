const multer  = require('multer')
// const upload = multer({ dest: 'uploads/' })

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/images')
    },
    filename: function (req, file, cb) {
       
      cb(null, 'Image' + '-' +Date.now()+".jpg")
    }
  })
  
  const upload = multer({ storage: storage })
  module.exports=upload;