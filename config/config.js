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
    },
    'resetPassword':{
      from:'"Team HRIS" <hris@adnsl.net>',
      subject:'Password has Changed'
    },
    'LeaveApplied':{
      from:'"Team HRIS" <hris@adnsl.net>',
      subject:'Leave applied'
    },
    'emailToSupvsrForAppliedLeave': {
      from:'"Team HRIS" <hris@adnsl.net>',
      subject:'Leave application of '
    },
    'emailToSupvsrForWithdrawnLeave': {
      from:'"Team HRIS" <hris@adnsl.net>',
      subject:'Leave withdrawn application of '
    },
    'emailToSupvsrForCancelLeave': {
      from:'"Team HRIS" <hris@adnsl.net>',
      subject:'Leave cancel application of '
    },
    'emailToEmployeeForLeaveRequestApproved': {
      from:'"Team HRIS" <hris@adnsl.net>',
      subject:'Application Approved'
    },
    'emailToEmployeeForLeaveRequestRejected': {
      from:'"Team HRIS" <hris@adnsl.net>',
      subject:'Leave Application Rejected'
    },
    'emailToEmployeeForLeaveCancellationApprove': {
      from:'"Team HRIS" <hris@adnsl.net>',
      subject:'Leave Cancellation Approved'
    },
    'emailToEmployeeForLeaveCancellationRejected': {
      from:'"Team HRIS" <hris@adnsl.net>',
      subject:'Leave Cancellation Rejected'
    },
    'emailToEmployeeForSupervsrTransfer': {
      from:'"Team HRIS" <hris@adnsl.net>',
      subject:' is done by HR'
    }, 
    'emailToPrevSupervsrForSupervsrTransfer': {
      from:'"Team HRIS" <hris@adnsl.net>',
      subject:'Subordinate Transferred to New Supervisor'
    } ,
    'emailToNewSupervsrForSupervsrTransfer': {
      from:'"Team HRIS" <hris@adnsl.net>',
      subject:'New Subordinate is added'
    }    
  },
  'aws':
  {
    fileSize        : 300000,
    documentPath    : 'document/',
    profilePath     : 'profile/',
    tmpImagePath    : 'tmp/',
    externalDocument: 'externalDocument/'
  }
};
