let express = require('express'),
    fs      = require('fs'),
    fse     = require('fs-extra'),
    multer  = require('multer'),
    mime    = require('mime'),
    path    = require('path'),
    crypto  = require('crypto'),
    mkdirP  = require('mkdirp'),
    config  = require('../config/config'),
    User    = require('../models/employee/employeeDetails.model'),
    gm      = require('gm').subClass({imageMagick: true});


process.on('uncaughtException', function (err) {
  console.log(err);
});

let rmDir = (dirPath, removeSelf) => {
  if (removeSelf === undefined)
    removeSelf = true;
  try {
    var files = fs.readdirSync(dirPath);
  }
  catch (e) {
    return;
  }
  if (files.length > 0)
    for (let i = 0; i < files.length; i++) {
      let filePath = dirPath + '/' + files[i];
      if (fs.statSync(filePath).isFile())
        fs.unlinkSync(filePath);
      else
        rmDir(filePath);
    }
  if (removeSelf)
    fs.rmdirSync(dirPath);
};

// create a Temp storage for images, when the user submits the form, the temp image will be moved to the appropriate folder inside /uploads/forms/user_id/photo.jpg
let tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = config.paths.tmpImagePath;
    let stat = null;
    try {
      stat = fs.statSync(dest);
    }
    catch (err) {
      fs.mkdirSync(dest);
    }
    if (stat && !stat.isDirectory()) {
      throw new Error('Directory cannot be created because an inode of a different type exists at "' + dest + '"');
    }
    cb(null, dest);
  },
  filename   : (req, file, cb) => {
    // if you want even more random characters prefixing the filename then change the value '2' below as you wish, right now, 4 charaters are being prefixed
    crypto.pseudoRandomBytes(4, (err, raw) => {
      let filename = file.originalname.replace(/_/gi, '');
      cb(null, raw.toString('hex') + '.' + filename.toLowerCase());
    });
  }
});

//  multer configuration
let uploadTemp = multer({
  storage   : tempStorage,
  limits    : {
    fileSize: 300000, // 5MB filesize limit
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
}).single('fileUp');

// When user submits the form, the temp image is copied to /uploads/forms/user_id/photo.jpg
let copyImage = (req, source) => {
  mkdirP(config.paths.imagePath + req.user._id, (err) => {
    if (err) {
      console.log(err);
    }
    fse.copy(config.paths.tmpImagePath + source, config.paths.imagePath + req.user._id + '/' + source)
      .then(() => {
      })
      .catch((error) => console.log(error));
  });
};

let deleteImage = (image) => {
  fse.remove(config.paths.tmpImagePath + image)
    .then(() => {
      console.log('success!');
    })
    .catch(err => {
      console.error(err);
    });
};

let functions = {

  // // Upload Image to Server Temp Folder
  // uploadImage: (req, res) => {
  //   uploadTemp(req, res, (err) => {
  //     if (err) {
  //       console.log(err);
  //     }
  //     if (req.file !== undefined) {
  //       gm(req.file.path)
  //         .resize(445, null)
  //         .noProfile()
  //         .write(req.file.path, (err) => {
  //           if (err) {
  //             console.log(err);
  //             res.status(500).json({
  //               message: 'The file you selected is not an image'
  //             });
  //           }
  //           res.status(201).json(req.file.filename);
  //         });
  //     }
  //   });
  // },

  // // Delete Temporary Image From Temp Folder
  // deleteImage: (req, res) => {
  //   let params = req.params.id;
  //   deleteImage(params);
  //   res.status(200).json({
  //     message: 'Image deleted successfully!'
  //   });
  // },
};

module.exports = functions;

