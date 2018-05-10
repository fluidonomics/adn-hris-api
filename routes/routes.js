let express  = require('express'),
    auth     = require('../controllers/auth.controller'),
    user     = require('../controllers/user.controller'),
    admin    = require('../controllers/admin.controller'),
    master   = require('../controllers/master.controller'),
    common   = require('../controllers/common.controller'),
    upload   = require('../controllers/upload.controller'),
    kra      = require('../controllers/kra.controller'),
    Employee = require('../models/employee/employeeDetails.model'),
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
  authRoutes.post('/reset/:token', auth.changePassword);

  //= ========================
  // User Routes
  //= ========================

  apiRoutes.use('/user', userRoutes);

  // // Get User Info endpoint: http://localhost:3000/api/user/:id
  // userRoutes.get('/:id', requireAuth, user.getUserInfo);

  // // Change user password from front end (not via email, via form)
  // userRoutes.post('/password', requireAuth, user.changePassword);

  // // Upload image endpoint: http://localhost:3000/api/user/image
  // userRoutes.post('/image', requireAuth, user.uploadImage);

  // // Delete Image endpoint: http://localhost:3000/api/user/image/:id
  // userRoutes.delete('/image/:id', requireAuth, user.deleteImage);

  // Add Employee endpoint: http://localhost:3000/api/user/addEmployee
  userRoutes.post('/addEmployee', user.addEmployee);

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

   userRoutes.post('/updatePositionInfo',ensureAuthenticated, user.updatePositionInfo);

  

  // Get All Employee
  //userRoutes.get('/getEmployeeInfo', user.getEmployeeInfo);

  //userRoutes.post('/employeeDetails',user.employeeDetails);


  userRoutes.get('/getPersonalInfo',ensureAuthenticated,user.getPersonalInfo);

  userRoutes.get('/getAddressInfo',ensureAuthenticated,user.getAddressInfo);

  userRoutes.get('/getDocumentsInfo',ensureAuthenticated,user.getDocumentsInfo);

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

   userRoutes.get('/getAllEmployee',ensureAuthenticated,ensureAuthenticated,user.getAllEmployee);
   
   userRoutes.get('/getCarInfo',ensureAuthenticated,user.getCarInfo);

  //= ========================
  // Administrator Routes
  //= ========================

  // Admin endpoint: http://localhost:3000/api/admin
  // apiRoutes.use('/admin', adminRoutes);

  // adminRoutes.post('/upload', admin.uploadImage);


  //= ========================
  // Kra Routes 
  //= ========================

  apiRoutes.use('/kra', kraRoutes);

  kraRoutes.post('/addKraInfo', kra.addKraInfo);

  kraRoutes.post('/updateKraInfo', kra.updateKraInfo);

  kraRoutes.get('/getKraInfo', kra.getKraInfo);

  kraRoutes.get('/getKraDetailsData', kra.getKraDetailsData);

  kraRoutes.post('/addKraWorkFlowInfo', kra.addKraWorkFlowInfo);

  kraRoutes.get('/getKraWorkFlowInfo', kra.getKraWorkFlowInfo);

  






  //= ========================
  // Master Data (Dropdowns) Routes 
  //= ========================

    // User Auth Routes endpoint: http://localhost:3000/api/auth
   apiRoutes.use('/master',ensureAuthenticated, masterRoutes);

   // Register endpoint: http://localhost:3000/api/master/createGrade
   masterRoutes.post('/createRole',ensureAuthenticated, master.createRole);

   // Register endpoint: http://localhost:3000/api/master/createCompany
   masterRoutes.post('/createCompany',ensureAuthenticated, master.createCompany);

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

   

   


     //= ========================
  // Common Data For All (Dropdowns) Data Routes 
  //= ========================

    apiRoutes.use('/common', commonRoutes);

    commonRoutes.get('/getRole',ensureAuthenticated, common.getRole);

    commonRoutes.get('/getCompany',ensureAuthenticated, common.getCompany);

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

    commonRoutes.get('/getEmployee',ensureAuthenticated, common.getEmployee);

    commonRoutes.get('/getHr',ensureAuthenticated, common.getHr);

    commonRoutes.get('/getSupervisor',ensureAuthenticated, common.getSupervisor);

    commonRoutes.get('/checkEmailUnique',ensureAuthenticated, common.checkEmailUnique);

    commonRoutes.get('/getEducation',ensureAuthenticated, common.getEducation);

    commonRoutes.get('/getPerformanceRating',ensureAuthenticated, common.getPerformanceRating);

    commonRoutes.get('/getRelation',ensureAuthenticated, common.getRelation);

    commonRoutes.get('/getProfileProcessStatus',ensureAuthenticated, common.getProfileProcessStatus);

    commonRoutes.get('/checkTabCompleted',ensureAuthenticated, common.checkTabCompleted);

    commonRoutes.post('/sendEmail',ensureAuthenticated, common.sendEmail);
    
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

    // Set url for API group routes, all endpoints start with /api/ eg http://localhost:3000/api/admin  || http://localhost:3000/api/auth
    app.use('/api', apiRoutes);
};

