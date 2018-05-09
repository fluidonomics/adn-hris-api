module.exports = {
  'paths'    : {
    // path for pets images
    serverPath      : '../server/app',
    imagePath       : 'uploads/',
    profileImagePath: 'uploads/profiles/',
    dist            : '../dist',
    expressUploads  : 'uploads',
    emailPath       : 'views/email_templates/',

  },
  'email':{
    'welcome':{
      from:'"Team HRIS" <hris@adnsl.net>',
      subject:'Welcome to ADN'
    },
    'forget':{
      from:'"Team HRIS" <hris@adnsl.net>',
      subject:'Reset Password'
    }
  },
  'aws':
  {
    fileSize        : 5000000,
    documentPath    : 'document/',
    profilePath     : 'profile/',
    tmpImagePath    : 'tmp/'
  }
};
