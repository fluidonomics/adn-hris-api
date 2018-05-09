let express = require('express'), 
    fs      = require('fs'),
    aws = require('aws-sdk'),
    multerS3 = require('multer-s3'),
    multer  = require('multer'),
    crypto  = require('crypto'),
    config  = require('../config/config');
    require('dotenv').load()


process.on('uncaughtException', function (err) {
  console.log(err);
});

aws.config.update({
  secretAccessKey: process.env.secretAccessKey,
  accessKeyId: process.env.accessKeyId
});
s3 = new aws.S3();

// create a Temp storage for images, when the user submits the form, the temp image will be moved to the appropriate folder inside /uploads/forms/user_id/photo.jpg
let tempStorage=multerS3({
  s3: s3,
  bucket: process.env.bucketName,
  acl: 'public-read',
  key: function (req, file, cb) {
        crypto.pseudoRandomBytes(4, (err, raw) => {
          let filename = file.originalname.replace(/_/gi, '');
           cb(null, config.aws.tmpImagePath + raw.toString('hex') + '.' + filename.toLowerCase());
        });
  }
});

// When user submits the form, the tmp image is copied to /dest/photo.jpg
let copyImage = (profileImage,dest) => {
   
        var key = profileImage.replace('tmp/','');
       
        var params = {
            Bucket : process.env.bucketName, 
            CopySource : '/' + process.env.bucketName +'/' + config.aws.tmpImagePath + key, 
            Key : dest + key,
            ACL : 'public-read',
        };
        s3.copyObject(params, function(err, data) {
            if (err)
                console.log(err); // an error occurred
            else {
              deleteImage(profileImage);
              
            }
        });
};


//  delete Image
let deleteImage = (imagekey) =>{
  const params = {
    Bucket: process.env.bucketName,
     Key: imagekey
  };
  s3.deleteObject(params, function (err, data) {
    if (err) 
       console.log(err);
    });

};

//  upload document Image
let documentsTemp = multer({
  storage   : tempStorage,
  limits    : {
    fileSize: config.aws.fileSize, // 5MB filesize limit
    parts   : 1
  },
  fileFilter: (req, file, cb) => {
    let filetypes = /jpe?g|png/;
    let mimetype = filetypes.test(file.mimetype);
    let extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb('Error: File upload only supports the following filetypes - ' + filetypes);
  }
}).single('documents');


//  upload profile Image
let profileTemp = multer({
    storage   : tempStorage,
    limits    : {
      fileSize: config.aws.fileSize, // 5MB filesize limit
      parts   : 1
    },
    fileFilter: (req, file, cb) => {
      let filetypes = /jpe?g|png/;
      let mimetype = filetypes.test(file.mimetype);
      let extname = filetypes.test(path.extname(file.originalname).toLowerCase());
      if (mimetype && extname) {
        return cb(null, true);
      }
      cb('Error: File upload only supports the following filetypes - ' + filetypes);
    }
}).single('profile');

let functions = {
  //delete image from S3
  deleteImage: (req, res) => {
       let params = req.body.key;
       deleteImage(params);
      res.status(200).json({
        message: 'Image deleted successfully!'
       });
  },

  // Upload profile Image to S3 tmp Folder
  uploadProfile: (req, res) => {
    profileTemp(req, res, (err) => {
      if (err) {
        return res.status(500).json(err);
      }
      if (req.file !== undefined) {
        res.status(200).json({
          message: 'Profile Image uploaded successfully!',key:req.file.key
        });
      }
    });
  },

  // Upload document Image to S3 tmp Folder
  uploadDocument: (req, res) => {
    documentsTemp(req, res, (err) => {
      if (err) {
        return res.status(500).json(err);
      }
      if (req.file !== undefined) {
        res.status(200).json({
          message: 'Document Image uploaded successfully!',key:req.file.key
        });
      }
    });
  },

  //upload Image to S3 dest Folder
  uploadImage: (req,res) => 
  {
    let imageKey = req.body.key;
    let destFolder = req.body.dest;

    copyImage(imageKey,destFolder);
    var key = imageKey.replace('tmp/','');
    res.status(200).json({
      message: 'Image save successfully!',key:destFolder + key
     });
    

  }
};

module.exports = functions;

