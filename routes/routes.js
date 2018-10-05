let express  = require('express'),
    auth     = require('../controllers/auth.controller'),
    user     = require('../controllers/user.controller'),
    admin    = require('../controllers/admin.controller'),
    master   = require('../controllers/master.controller'),
    common   = require('../controllers/common.controller'),
    upload   = require('../controllers/upload.controller'),
    kra      = require('../controllers/kra.controller'),
    leave    = require('../controllers/leave.controller'),
    externalDocument = require('../controllers/externalDocument.controller'),
    Employee = require('../models/employee/employeeDetails.model'),
    batch = require('../controllers/batch.controller'),
    jwt = require('jsonwebtoken-refresh');

    function ensureAuthenticated(req, res, next) {
      if(req.headers && req.headers['access-token'])
      {
        let token=req.headers['access-token'];
        // let token=req.headers.authorization.split(' ');
        jwt.verify(token, process.env.Secret, function(err, decoded) {
          if (err) {
            return res.status(401).json({
              error: err
            });
          }
          else{
           Employee.find({_id:parseInt(decoded._id),isDeleted:false},function(err,users)
            {
              if(users)
              {
                  var originalDecoded = jwt.decode(token, {complete: true});
                  var refreshedToken = jwt.refresh(originalDecoded, 3600, process.env.Secret);
                  res.setHeader('access-token', refreshedToken);
                  res.setHeader('client', "application_id");
                  res.setHeader('expiry', '');
                  res.setHeader('token-type', 'Bearer');
                  res.setHeader('uid', parseInt(decoded._id));

                  return next();
              }

              return res.status(403).json({
                    title: 'Error!',
                    error: {
                        message: err
                    },
                    result: {
                        message: users
                    }
              });
            })
          }
        });
      }
      else{
        return res.status(403).end("Forbidden");
      }
    }

    module.exports = (app) => {

      // Initializing route groups
        let apiRoutes   = express.Router(),
          authRoutes  = express.Router(),
          adminRoutes = express.Router(),
          userRoutes  = express.Router(),
          masterRoutes= express.Router();
          commonRoutes= express.Router();
          uploadRoutes= express.Router(),
          kraRoutes   = express.Router(),
          leaveRoutes = express.Router(),
          hrRoutes = express.Router(),
          externalDocumentRoutes = express.Router(),
          batchRoutes=express.Router(),

      //= ========================
      
      //= ========================
      // Auth Routes
      //= ========================

        // User Auth Routes endpoint: http://localhost:3000/api/auth
        apiRoutes.use('/auth', authRoutes);  

        authRoutes.get('/validateToken',auth.validateToken);

        // Login endpoint: http://localhost:3000/api/auth/login
        authRoutes.post('/login', auth.loginUser);

        // Forget Password endpoint: http://localhost:3000/api/auth/password
        authRoutes.post('/forget-password', auth.forgetPassword);

        // Check if password reset token is not expired. endpoint: http://localhost:3000/api/auth/reset/:token
        authRoutes.get('/reset/:token', auth.verifyPasswordResetToken);

        // If password reset token is valid (not expired) then proceed to password change. endpoint: http://localhost:3000/api/auth/reset/:token
        authRoutes.post('/reset', auth.changePassword);

      //= ========================

      //= ========================
      // User Routes
      //= ========================

          apiRoutes.use('/user', userRoutes);

          // Add Employee endpoint: http://localhost:3000/api/user/addEmployee
          userRoutes.post('/addEmployee',ensureAuthenticated, user.addEmployee);

          // Add Employee endpoint: http://localhost:3000/api/user/addPersonalInfo
          userRoutes.post('/addPersonalInfo',ensureAuthenticated, user.addPersonalInfo);
          
          // Add Employee endpoint: http://localhost:3000/api/user/updatePersonalInfo
          userRoutes.post('/updatePersonalInfo',ensureAuthenticated, user.updatePersonalInfo);

          // Add Employee endpoint: http://localhost:3000/api/user/addAcademicInfo
          userRoutes.post('/addAcademicInfo',ensureAuthenticated, user.addAcademicInfo);

          // Add Employee endpoint: http://localhost:3000/api/user/updateAcademicInfo
          userRoutes.post('/updateAcademicInfo',ensureAuthenticated, user.updateAcademicInfo);

          // Academic Info Endpoint: http://localhost:3000/api/user/deleteAcademicInfo
          userRoutes.delete('/deleteAcademicInfo',ensureAuthenticated, user.deleteAcademicInfo);

          // Add Employee endpoint: http://localhost:3000/api/user/addProfileProcessInfo
          userRoutes.post('/addProfileProcessInfo',ensureAuthenticated, user.addProfileProcessInfo);

          // Add Employee endpoint: http://localhost:3000/api/user/updateProfileProcessInfo
          userRoutes.post('/updateProfileProcessInfo',ensureAuthenticated, user.updateProfileProcessInfo);

          // Add Employee endpoint: http://localhost:3000/api/user/addPreviousEmploymentInfo
          userRoutes.post('/addPreviousEmploymentInfo',ensureAuthenticated, user.addPreviousEmploymentInfo);

          // Add Employee endpoint: http://localhost:3000/api/user/updatePreviousEmploymentInfo
          userRoutes.post('/updatePreviousEmploymentInfo',ensureAuthenticated, user.updatePreviousEmploymentInfo);

          // PreviousEmployment Info Endpoint: http://localhost:3000/api/user/deletePreviousEmploymentInfo
          userRoutes.delete('/deletePreviousEmploymentInfo',ensureAuthenticated, user.deletePreviousEmploymentInfo);

          // Add Employee Address endpoint: http://localhost:3000/api/user/addAddressInfo
          userRoutes.post('/addAddressInfo',ensureAuthenticated, user.addAddressInfo);

          // Update Employee Address endpoint: http://localhost:3000/api/user/updateAddressInfo
          userRoutes.post('/updateAddressInfo',ensureAuthenticated, user.updateAddressInfo);

          // Add Employee endpoint: http://localhost:3000/api/user/addFamilyInfo
          userRoutes.post('/addFamilyInfo',ensureAuthenticated, user.addFamilyInfo);

          // Add Employee endpoint: http://localhost:3000/api/user/updateFamilyInfo
          userRoutes.post('/updateFamilyInfo',ensureAuthenticated, user.updateFamilyInfo);

          // Add Employee endpoint: http://localhost:3000/api/user/deleteFamilyInfo
          userRoutes.delete('/deleteFamilyInfo',ensureAuthenticated, user.deleteFamilyInfo);

          // Add Employee endpoint: http://localhost:3000/api/user/addDocumentsInfo
          userRoutes.post('/addDocumentsInfo',ensureAuthenticated, user.addDocumentsInfo);

          // Add Employee endpoint: http://localhost:3000/api/user/updateDocumentsInfo
          userRoutes.post('/updateDocumentsInfo',ensureAuthenticated, user.updateDocumentsInfo);

          // Add Employee endpoint: http://localhost:3000/api/user/addBankInfo
          userRoutes.post('/addBankInfo',ensureAuthenticated, user.addBankInfo);

          // Add Employee endpoint: http://localhost:3000/api/user/updateBankInfo
          userRoutes.post('/updateBankInfo',ensureAuthenticated, user.updateBankInfo);

          // Add Employee endpoint: http://localhost:3000/api/user/addSalaryInfo
          userRoutes.post('/addSalaryInfo',ensureAuthenticated, user.addSalaryInfo);

          // Add Employee endpoint: http://localhost:3000/api/user/updateSalaryInfo
          userRoutes.post('/updateSalaryInfo',ensureAuthenticated, user.updateSalaryInfo);

          // Add Employee endpoint: http://localhost:3000/api/user/addCarInfo
          userRoutes.post('/addCarInfo',ensureAuthenticated, user.addCarInfo);

          // Add Employee endpoint: http://localhost:3000/api/user/updateCarInfo
          userRoutes.post('/updateCarInfo',ensureAuthenticated, user.updateCarInfo);

          // Add Employee endpoint: http://localhost:3000/api/user/addCertificationInfo
          userRoutes.post('/addCertificationInfo',ensureAuthenticated, user.addCertificationInfo);

          // Add Employee endpoint: http://localhost:3000/api/user/updateCertificationInfo
          userRoutes.post('/updateCertificationInfo',ensureAuthenticated, user.updateCertificationInfo);

          // Add Employee endpoint: http://localhost:3000/api/user/deleteCertificationInfo
          userRoutes.delete('/deleteCertificationInfo',ensureAuthenticated, user.deleteCertificationInfo);

          // Add Employee endpoint: http://localhost:3000/api/user/addPerformanceRatingInfo
          userRoutes.post('/addPerformanceRatingInfo',ensureAuthenticated, user.addPerformanceRatingInfo);

          // Add Employee endpoint: http://localhost:3000/api/user/updatePerformanceRatingInfo
          userRoutes.post('/updatePerformanceRatingInfo',ensureAuthenticated, user.updatePerformanceRatingInfo);

          // Add Employee endpoint: http://localhost:3000/api/user/updatePerformanceRatingInfo
          userRoutes.post('/updateOfficeInfo',ensureAuthenticated, user.updateOfficeInfo);

          // Add Employee endpoint: http://localhost:3000/api/user/updatePerformanceRatingInfo
          userRoutes.post('/updatePositionInfo',ensureAuthenticated, user.updatePositionInfo);
          
          // Add Employee endpoint: http://localhost:3000/api/user/updatePerformanceRatingInfo
          userRoutes.post('/saveBulkPerformanceRating',ensureAuthenticated, user.saveBulkPerformanceRating);

          // Add Employee endpoint: http://localhost:3000/api/user/updatePerformanceRatingInfo
          userRoutes.get('/getPersonalInfo',ensureAuthenticated,user.getPersonalInfo);

          // Add Employee endpoint: http://localhost:3000/api/user/updatePerformanceRatingInfo
          userRoutes.get('/getAddressInfo',ensureAuthenticated,user.getAddressInfo);

          // Add Employee endpoint: http://localhost:3000/api/user/updatePerformanceRatingInfo
          userRoutes.get('/getDocumentsInfo',ensureAuthenticated,user.getDocumentsInfo);

          // Add Employee endpoint: http://localhost:3000/api/user/updatePerformanceRatingInfo
          userRoutes.get('/getAcademicInfo',ensureAuthenticated,user.getAcademicInfo);

          userRoutes.get('/getProfileProcessInfo',ensureAuthenticated,user.getProfileProcessInfo);

          userRoutes.get('/getCertificationInfo',ensureAuthenticated,user.getCertificationInfo);

          userRoutes.get('/getPreviousEmploymentInfo',ensureAuthenticated,user.getPreviousEmploymentInfo);
          
          userRoutes.get('/getFamilyInfo',ensureAuthenticated,user.getFamilyInfo);

          userRoutes.get('/getOfficeInfo',ensureAuthenticated,user.getOfficeInfo);

          userRoutes.get('/getPositionInfo',ensureAuthenticated,user.getPositionInfo);

          userRoutes.get('/getPerformanceRatingInfo',ensureAuthenticated,user.getPerformanceRatingInfo);

          userRoutes.get('/getBankInfo',ensureAuthenticated,user.getBankInfo);

          userRoutes.get('/getSalaryInfo',ensureAuthenticated,user.getSalaryInfo);

          userRoutes.get('/getAllEmployee',ensureAuthenticated,user.getAllEmployee);
          userRoutes.post('/getAllEmployeeByReviewerId',user.getAllEmployeeByReviewerId);
          
          
          userRoutes.get('/getCarInfo',ensureAuthenticated,user.getCarInfo);

          userRoutes.get('/getSupervisorInfo', ensureAuthenticated, user.getSupervisorInfo);

          userRoutes.get('/getEmployeeDetails', ensureAuthenticated, user.getEmployeeDetails);

          userRoutes.post('/changePassword', ensureAuthenticated, user.changePassword);

          
          
      //= ========================

      //= ========================
      // Administrator Routes
      //= ========================
        // Admin endpoint: http://localhost:3000/api/admin
        // apiRoutes.use('/admin', adminRoutes);
        // adminRoutes.post('/upload', admin.uploadImage);
      //= ========================

      //= ========================
      // Kra Routes 
      //= ========================

        apiRoutes.use('/kra', kraRoutes);

        kraRoutes.post('/addKraInfo',ensureAuthenticated, kra.functions.addKraInfo);

        kraRoutes.post('/updateKraInfo',ensureAuthenticated, kra.functions.updateKraInfo);

        kraRoutes.delete('/deleteKraInfo',ensureAuthenticated, kra.functions.deleteKraInfo);

        // kraRoutes.get('/getKraInfo',ensureAuthenticated, kra.getKraInfo);

        // kraRoutes.get('/getKraDetailsData',ensureAuthenticated, kra.getKraDetailsData);

        kraRoutes.post('/addKraCategoryInfo',ensureAuthenticated, kra.functions.addKraCategoryInfo);

        kraRoutes.post('/addKraWeightageInfo',ensureAuthenticated, kra.functions.addKraWeightageInfo);

        kraRoutes.post('/addKraWorkFlowInfo',ensureAuthenticated, kra.functions.addKraWorkFlowInfo);

        kraRoutes.post('/updateKraWorkFlowInfo',ensureAuthenticated, kra.functions.updateKraWorkFlowInfo);
        
        kraRoutes.get('/getEmployeeKraWorkFlowInfo',ensureAuthenticated, kra.functions.getEmployeeKraWorkFlowInfo);
        
        kraRoutes.get('/getKraWorkFlowInfo',ensureAuthenticated, kra.functions.getKraWorkFlowInfo);
        
        kraRoutes.get('/getKraInfo',ensureAuthenticated, kra.functions.getKraInfo);

        kraRoutes.post('/addBulkKra',ensureAuthenticated, kra.functions.addBulkKra);

        kraRoutes.get('/getKraWorkFlowInfoByBatch',ensureAuthenticated, kra.functions.getKraWorkFlowInfoByBatch);

        //kraRoutes.post('/updateBatchStatus',ensureAuthenticated, kra.updateBatchStatus);
        
        

      //= ========================

      //= ========================
      // Leave Routes 
      //= ========================

        apiRoutes.use('/leave', leaveRoutes);

        leaveRoutes.post('/applyLeave', leave.postApplyLeave);
        leaveRoutes.post('/uploadSickLeaveDocument', leave.uploadSickLeaveDocument);
//        leaveRoutes.get('/leaveTransactionDetails', leave.getLeaveTransaction);
        leaveRoutes.get('/getLeaveTypes', leave.getLeaveTypes);
       leaveRoutes.post('/cancelLeave', leave.postCancelLeave);
//        leaveRoutes.get('/getCancelEmployeeLeaveDetails', leave.getCancelEmployeeLeaveDetails);
//        leaveRoutes.get('/getLeaveWorkflowDetails', leave.getLeaveWorkflowDetails);
       leaveRoutes.get('/getSupervisorTeamMember', leave.getSupervisorTeamMember);
       leaveRoutes.get('/getSupervisorLeaveDetails', leave.getSupervisorLeaveDetails);
       leaveRoutes.get('/getLeaveDetailsByFilter', leave.getLeaveDetailsByFilter);
//        leaveRoutes.get('/getHRLeaveDetails', leave.getHRLeaveDetails);
       leaveRoutes.get('/getLeaveDetailsById', leave.getLeaveDetailsById);
//        leaveRoutes.post('/grantLeaveByEmployee', leave.grantLeaveByEmployee);
//        leaveRoutes.post('/grantLeaveByDepartment', leave.grantLeaveByDepartment);
//        leaveRoutes.post('/grantLeaveAllEmployee', leave.grantLeaveAllEmployee);
        leaveRoutes.get('/getEmployeeLeaveBalance', leave.getLeaveBalance);
        leaveRoutes.post('/hr/createLeaveTransactionReport', leave.createLeaveTransactionReport);

        leaveRoutes.get('/hr/getAllEmployeeLeaveBalance', leave.getAllLeaveBalance);
        leaveRoutes.get('/hr/getAllEmployeeLeaveDetails', leave.getAllEmployeeLeaveDetails);
//        leaveRoutes.get('/getLeaveDetailsByRole', leave.getLeaveDetailsByRole);
//        leaveRoutes.post('/addLeaveHoliday', leave.postLeaveHoliday);
          leaveRoutes.get('/getLeaveHolidays', leave.getHolidays);
          leaveRoutes.get('/getUpcomingHoliday', leave.getUpcomingHoliday);
          leaveRoutes.get('/getLeaveTransactionDetails', leave.getLeaveTransactionDetails);
          leaveRoutes.post('/cancelApproveLeave', leave.cancelApproveLeave);
          leaveRoutes.post('/autoApproveLeave', leave.autoApproveLeave);
          leaveRoutes.get('/calculateLeave', leave.calculateLeave);
          leaveRoutes.get('/uploadCarryForward', leave.uploadCarryForward);
//        leaveRoutes.post('/updateLeaveHoliday', leave.updateHoliday);
//        leaveRoutes.post('/postLeaveCarry', leave.postLeaveCarry);
//        leaveRoutes.post('/removeLeaveHoliday', leave.removeHoliday);
//        leaveRoutes.post('/postAcceptRejectLeave', leave.postAcceptRejectLeave);
//        leaveRoutes.get('/getLeavesByMonth', leave.getLeavesByMonth);
//        leaveRoutes.get('/getLeavesByLeaveType', leave.getLeavesByLeaveType);
    	  leaveRoutes.get('/getAllEmployee', leave.getAllEmployee);
    	  leaveRoutes.post('/withdrawLeave', leave.withdrawLeave);
//        leaveRoutes.get('/getEmployeeProbationDetails', leave.getEmployeeProbationDetails);
//        leaveRoutes.post('/postLeaveTransactionYear', leave.postLeaveTransactionYear);
//        leaveRoutes.post('/grantMaternityLeave', leave.grantMaternityLeave);
       leaveRoutes.get('/getEmpMaternityLeaveDetails', leave.getEmpMaternityLeaveDetails);
       leaveRoutes.get('/downloadFile', leave.downloadLeaveAttachment);
      //= ========================
      //hr dashboard routes

      //= ========================
      // Master Data (Dropdowns) Routes 
      //= ========================

        // User Auth Routes endpoint: http://localhost:3000/api/auth
      apiRoutes.use('/master', masterRoutes);

      // Register endpoint: http://localhost:3000/api/master/createGrade
      masterRoutes.post('/createRole',ensureAuthenticated, master.createRole);

      // Register endpoint: http://localhost:3000/api/master/createCompany
      masterRoutes.post('/createCompany',ensureAuthenticated, master.createCompany);

      // Register endpoint: http://localhost:3000/api/master/createDocument
      masterRoutes.post('/createDocument',ensureAuthenticated,  master.createDocument);

      // Register endpoint: http://localhost:3000/api/master/createCompany
      masterRoutes.post('/createFacility',ensureAuthenticated, master.createFacility);

      // Register endpoint: http://localhost:3000/api/master/createCompany
      masterRoutes.post('/createCompanyBusiness',ensureAuthenticated, master.createCompanyBusiness);

      // Register endpoint: http://localhost:3000/api/master/createDivision
      masterRoutes.post('/createDivision',ensureAuthenticated, master.createDivision);

      // Register endpoint: http://localhost:3000/api/master/createDepartment
      masterRoutes.post('/createDepartment',ensureAuthenticated, master.createDepartment);

      // Register endpoint: http://localhost:3000/api/master/createVertical
      masterRoutes.post('/createVertical',ensureAuthenticated, master.createVertical);

      // Register endpoint: http://localhost:3000/api/master/createSubVertical
      masterRoutes.post('/createSubVertical',ensureAuthenticated, master.createSubVertical);

      // Register endpoint: http://localhost:3000/api/master/createMaritalStatus
      masterRoutes.post('/createMaritalStatus',ensureAuthenticated, master.createMaritalStatus);

      // Register endpoint: http://localhost:3000/api/master/createCurrency
      masterRoutes.post('/createCurrency',ensureAuthenticated, master.createCurrency);

      // Register endpoint: http://localhost:3000/api/master/createGrade
      masterRoutes.post('/createGrade',ensureAuthenticated, master.createGrade);

      // Register endpoint: http://localhost:3000/api/master/createDesignation
      masterRoutes.post('/createDesignation',ensureAuthenticated, master.createDesignation);

      // Register endpoint: http://localhost:3000/api/master/createGradeDesignation
      masterRoutes.post('/createGradeDesignation',ensureAuthenticated, master.createGradeDesignation);

      // Register endpoint: http://localhost:3000/api/master/createLocation
      masterRoutes.post('/createLocation',ensureAuthenticated, master.createLocation);

      // Register endpoint: http://localhost:3000/api/master/createManagementType
      masterRoutes.post('/createManagementType',ensureAuthenticated, master.createManagementType);

      // Register endpoint: http://localhost:3000/api/master/createEmploymentType
      masterRoutes.post('/createEmploymentType',ensureAuthenticated, master.createEmploymentType);

      // Register endpoint: http://localhost:3000/api/master/createEmploymentStatus
      masterRoutes.post('/createEmploymentStatus',ensureAuthenticated, master.createEmploymentStatus);

      // Register endpoint: http://localhost:3000/api/master/createEducation
      masterRoutes.post('/createEducation',ensureAuthenticated, master.createEducation);

      // Register endpoint: http://localhost:3000/api/master/createRelation
      masterRoutes.post('/createRelation',ensureAuthenticated, master.createRelation);

      // Register endpoint: http://localhost:3000/api/master/createPerformanceRating
      masterRoutes.post('/createPerformanceRating',ensureAuthenticated, master.createPerformanceRating);

      // Register endpoint: http://localhost:3000/api/master/createFinancialYear
      masterRoutes.post('/createFinancialYear',  master.createFinancialYear);
      masterRoutes.post('/createCompanyFinancialYear',  master.createCompanyFinancialYear);
      
     

      
      //= ========================

      //= ========================
      // Common Data For All (Dropdowns) Data Routes
      //= ========================

          apiRoutes.use('/common', commonRoutes);

          commonRoutes.get('/getRole',ensureAuthenticated, common.getRole);
          commonRoutes.get('/getEmployeeEmailDetails', common.getAllEmployeeEmails);
          

          commonRoutes.get('/getCompany',ensureAuthenticated, common.getCompany);

          commonRoutes.get('/getDocuments',ensureAuthenticated, common.getDocuments);

          commonRoutes.get('/getFacility',ensureAuthenticated, common.getFacility);

          commonRoutes.get('/getCompanyBusiness',ensureAuthenticated, common.getCompanyBusiness);

          commonRoutes.get('/getDivision',ensureAuthenticated, common.getDivision);

          commonRoutes.get('/getDepartment',ensureAuthenticated, common.getDepartment);

          commonRoutes.get('/getVertical',ensureAuthenticated, common.getVertical);

          commonRoutes.get('/getSubVertical',ensureAuthenticated, common.getSubVertical);

          commonRoutes.get('/getGrade',ensureAuthenticated, common.getGrade);

          commonRoutes.get('/getDesignation',ensureAuthenticated, common.getDesignation);

          commonRoutes.get('/getGradeDesignation',ensureAuthenticated, common.getGradeDesignation);

          commonRoutes.get('/getLocation',ensureAuthenticated, common.getLocation);

          commonRoutes.get('/getManagementType',ensureAuthenticated, common.getManagementType);

          commonRoutes.get('/getEmploymentType',ensureAuthenticated, common.getEmploymentType);

          commonRoutes.get('/getEmploymentStatus',ensureAuthenticated, common.getEmploymentStatus);

          commonRoutes.get('/getEmployee', common.getEmployee);

          commonRoutes.get('/getHr',ensureAuthenticated, common.getHr);

          commonRoutes.get('/getSupervisor',ensureAuthenticated, common.getSupervisor);

          commonRoutes.get('/getKraSupervisor',ensureAuthenticated, common.getKraSupervisor);

          commonRoutes.get('/checkEmailExists',ensureAuthenticated, common.checkEmailExists);

          commonRoutes.get('/checkUserNameExists',ensureAuthenticated, common.checkUserNameExists);

          commonRoutes.get('/getEducation',ensureAuthenticated, common.getEducation);

          commonRoutes.get('/getPerformanceRating',ensureAuthenticated, common.getPerformanceRating);

          commonRoutes.get('/getRelation',ensureAuthenticated, common.getRelation);

          commonRoutes.get('/getTabStatus',ensureAuthenticated, common.getTabStatus);

          commonRoutes.post('/sendEmail',ensureAuthenticated, common.sendEmail);

          commonRoutes.post('/resetPasswordByHr',ensureAuthenticated, common.resetPasswordByHr);

          commonRoutes.get('/getEmployeeRoles',ensureAuthenticated,common.getEmployeeRoles);

          commonRoutes.post('/addEmployeeRole',ensureAuthenticated,common.addEmployeeRole);

          commonRoutes.post('/updateEmployeeRole',ensureAuthenticated,common.updateEmployeeRole);

          commonRoutes.get('/getEmployeeDocument',ensureAuthenticated, common.getEmployeeDocument);

          commonRoutes.get('/getEmployeeSupervisor',ensureAuthenticated, common.getEmployeeSupervisor);

          commonRoutes.post('/addEmployeeSupervisor',ensureAuthenticated, common.addEmployeeSupervisor);

          commonRoutes.post('/updateEmployeeSupervisor',ensureAuthenticated, common.updateEmployeeSupervisor);

          commonRoutes.get('/getKraCategoryInfo',ensureAuthenticated, common.getKraCategoryInfo);

          commonRoutes.get('/getKraWeightageInfo',ensureAuthenticated, common.getKraWeightageInfo);
           
          commonRoutes.get('/getFinincialYear', ensureAuthenticated,  common.getFinincialYear);
          // commonRoutes.get('/sendNotification',ensureAuthenticated, common.sendNotification);
        
      //= ========================


      //=========================
      // External Documents Routes
      //=========================
        apiRoutes.use('/externalDocument', externalDocumentRoutes);

        externalDocumentRoutes.post('/addEmployeeExternalDocumentInfo',ensureAuthenticated, externalDocument.addEmployeeExternalDocumentInfo);

        externalDocumentRoutes.post('/updateEmployeeExternalDocumentInfo',ensureAuthenticated, externalDocument.updateEmployeeExternalDocumentInfo);

        externalDocumentRoutes.post('/deleteEmployeeExternalDocumentInfo',ensureAuthenticated, externalDocument.deleteEmployeeExternalDocumentInfo);

        externalDocumentRoutes.get('/getEmployeeExternalDocumentInfo',ensureAuthenticated, externalDocument.getEmployeeExternalDocumentInfo);
      
      //= ======================== 
      
      
      
      //=========================
      // External Documents Routes
      //=========================
      apiRoutes.use('/batch', batchRoutes);

      batchRoutes.get('/getBatchInfo',ensureAuthenticated, batch.functions.getBatchInfo);

      batchRoutes.post('/updateBatchInfo',ensureAuthenticated, batch.functions.updateBatchInfo);

      batchRoutes.post('/updateBatchInfo',ensureAuthenticated, batch.functions.updateBatchInfo);
      
      batchRoutes.get('/getBatchInfoByEmp',ensureAuthenticated, batch.functions.getBatchInfoByEmp);
      

    //= ======================== 
      
          
      //= ========================
      // Upload Routes
      //= ========================
          apiRoutes.use('/upload', uploadRoutes);

          // upload document
          uploadRoutes.post('/document', upload.uploadDocument);

          // upload profile image
          uploadRoutes.post('/profile', upload.uploadProfile);
      
          //delete  Image
          uploadRoutes.post('/deleteImage',upload.deleteImage);
      //= ========================

      // Set url for API group routes, all endpoints start with /api/ eg http://localhost:3000/api/admin  || http://localhost:3000/api/auth
      app.use('/api', apiRoutes);
    };

