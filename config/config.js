module.exports = {
  'paths': {
    // path for pets images
    serverPath: '../server/app',
    imagePath: 'uploads/',
    profileImagePath: 'uploads/profiles/',
    dist: '../dist',
    expressUploads: 'uploads',
    emailPath: 'views/email_templates/',

  },
  'email': {
    'welcome': {
      from: '"Team HRIS" <hris@adnsl.net>',
      subject: 'Welcome to ADN'
    },
    'forget': {
      from: '"Team HRIS" <hris@adnsl.net>',
      subject: 'Reset Password'
    },
    'resetPassword': {
      from: '"Team HRIS" <hris@adnsl.net>',
      subject: 'Password has Changed'
    },
    'LeaveApplied': {
      from: '"Team HRIS" <hris@adnsl.net>',
      subject: 'Leave applied'
    },
    'emailToSupvsrForAppliedLeave': {
      from: '"Team HRIS" <hris@adnsl.net>',
      subject: 'Leave application of '
    },
    'emailToEmployeeForAppliedLeaveOnBehalf': {
      from: '"Team HRIS" <hris@adnsl.net>',
      subject: ' is applied on your behalf by '
    },
    'emailTohrForAppliedLeaveRejected': {
      from: '"Team HRIS" <hris@adnsl.net>',
      subject: ' Leave Request of '
    },
    'emailTohrForAppliedLeaveApproved': {
      from: '"Team HRIS" <hris@adnsl.net>',
      subject: ' Leave application of '
    },
    'emailToSupvsrForWithdrawnLeave': {
      from: '"Team HRIS" <hris@adnsl.net>',
      subject: 'Leave withdrawn application of '
    },
    'emailToSupvsrForCancelLeave': {
      from: '"Team HRIS" <hris@adnsl.net>',
      subject: 'Leave cancel application of '
    },
    'emailToHRForCancelLeave': {
      from: '"Team HRIS" <hris@adnsl.net>',
      subject: 'Leave cancelled of '
    },
    'emailToEmployeeForLeaveRequestApproved': {
      from: '"Team HRIS" <hris@adnsl.net>',
      subject: 'Application Approved'
    },
    'emailToEmployeeForLeaveRequestRejected': {
      from: '"Team HRIS" <hris@adnsl.net>',
      subject: 'Leave Application Rejected'
    },
    'emailToEmployeeForLeaveCancellationApprove': {
      from: '"Team HRIS" <hris@adnsl.net>',
      subject: 'Leave Cancellation Approved'
    },
    'emailToEmployeeForLeaveCancellationRejected': {
      from: '"Team HRIS" <hris@adnsl.net>',
      subject: 'Leave Cancellation Rejected'
    },
    'emailToEmployeeForAnnualLeaveGrant': {
      from: '"Team HRIS" <hris@adnsl.net>'
    },
    'emailToEmployeeForSupervsrTransfer': {
      from: '"Team HRIS" <hris@adnsl.net>',
      subject: ' is done by HR'
    },
    'emailToPrevSupervsrForSupervsrTransfer': {
      from: '"Team HRIS" <hris@adnsl.net>',
      subject: 'Subordinate Transferred to New Supervisor'
    },
    'emailToNewSupervsrForSupervsrTransfer': {
      from: '"Team HRIS" <hris@adnsl.net>',
      subject: 'New Subordinate is added'
    },
    'sendEmailToSupervisorToApproveMtr': {
      from: '"Team HRIS" <hris@adnsl.net>',
      subject: 'Midterm Review for Approval'
    },
    'sendEmailToEmployeeForMtrStatus': {
      from: '"Team HRIS" <hris@adnsl.net>',
      subject: 'Midterm Review Status'
    },
    'sendEmailToEmployeeForPapInitiate': {
      from: '"Team HRIS" <hris@adnsl.net>',
      subject: 'Performance Appraisal Initaited'
    },
    'sendEmailToEmployeeForLearningStatus': {
      from: '"Team HRIS" <hris@adnsl.net>',
      subject: 'Learning Agenda Status'
    },
    'sendEmailToSupervisorToApproveLearning': {
      from: '"Team HRIS" <hris@adnsl.net>',
      subject: 'Learning Agenda for approval'
    },
    'sendEmailToEmployeeForInitiatedLearning': {
      from: '"Team HRIS" <hris@adnsl.net>',
      subject: 'Learning Agenda initiated'
    }
  },
  'aws':
  {
    fileSize: 300000,
    documentPath: 'document/',
    profilePath: 'profile/',
    tmpImagePath: 'tmp/',
    externalDocument: 'externalDocument/'
  }
};
