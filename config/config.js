module.exports = {
  'database' : 'mongodb://adndev:adndev@ds135619.mlab.com:35619/adndev',
  'secret'   : 'iloveadnhris', // change this to a hard to guess random string. it's for jwt encryption and decryption
  'jwtExpire': '72h', //set the jwtExpire in smaller period in production
  'paths'    : {
    // path for pets images
    serverPath      : '../server/app',
    imagePath       : 'server/uploads/',
    profileImagePath: 'server/uploads/profiles/',
    tmpImagePath    : 'server/uploads/tmp/',
    dist            : '../dist',
    expressUploads  : '/uploads',
    emailPath       : 'server/views/email_templates/',
  }
};
