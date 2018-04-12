module.exports = {
  'paths'    : {
    // path for pets images
    serverPath      : '../server/app',
    imagePath       : 'server/uploads/',
    profileImagePath: 'server/uploads/profiles/',
    tmpImagePath    : 'server/uploads/tmp/',
    dist            : '../dist',
    expressUploads  : '/uploads',
    emailPath       : 'views/email_templates/',
  },
  'email':{
    'welcome':{
      from:'"Team HRIS" <hris@adnsl.net>',
      subject:'Welcome to ADN'
    }
  }
};
