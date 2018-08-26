let express = require('express'), 
    fs      = require('fs'),
    aws     = require('aws-sdk'),
    multerS3 = require('multer-s3'),
    multer  = require('multer'),
    crypto  = require('crypto'),
    config  = require('../config/config');
    path    = require("path");
    require('dotenv').load()

    aws.config.update({
      secretAccessKey: process.env.SecretAccessKey,
      accessKeyId: process.env.AccessKeyId
    });
    s3 = new aws.S3();

   let imageTempStorage=multerS3({
    s3: s3,
    bucket: process.env.BucketName,
    acl: 'public-read',
    key: function (req, file, cb) {
          crypto.pseudoRandomBytes(4, (err, raw) => {
            let filename = file.originalname.replace(/_/gi, '');
             cb(null, config.aws.tmpImagePath + raw.toString('hex') + '.' + filename.toLowerCase());
          });
    }
   });

   let documentStorage=multerS3({
    s3: s3,
    bucket: process.env.BucketName,
    acl: 'public-read',
    key: function (req, file, cb) {
          crypto.pseudoRandomBytes(4, (err, raw) => {
            let filename = file.originalname.replace(/_/gi, '');
             cb(null, config.aws.externalDocument + raw.toString('hex') + '.' + filename.toLowerCase());
          });
    }
   });

   let pdfDocuments = multer({
    storage   : documentStorage,
    limits    : {
    fileSize: config.aws.fileSize, // 5MB filesize limit
    },
    fileFilter: (req, file, cb) => {
    let filetypes = /pdf/jpg/jpeg/png/pdf/docx;
    let mimetype = filetypes.test(file.mimetype);
    let extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
        return cb(null, req);
    }
    cb('File upload only supports the following filetypes - jpg|jpeg|png|pdf|docx');
    }
   }).single('seakleavedocument');

   let profileTemp = multer({
    storage   : imageTempStorage,
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
   }).single('profile')

   module.exports = {pdfDocuments,profileTemp}