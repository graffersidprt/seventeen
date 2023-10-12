const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({

  destination:  (req, file, cb) => {
    console.log("directory name in multer ",path.join(__dirname,'../../', '/public/uploads/'));
    console.log(__dirname,"__direname in multer");
    try {
      cb(null,path.join(__dirname,'../../', '/public/uploads/'));
    } catch (error) {
      console.log("error in multer destination",error);
    }
     
  },
  filename: (req, file, cb) => {
    try {
      var ext = file.originalname.substring(file.originalname.indexOf('.'));
      cb(null, `${file.fieldname}_${Date.now()}${ext}`);
    } catch (error) {
      console.log("error in multer filename",error);
    }
   
  },
});
const upload = multer({ storage });
module.exports = upload;
