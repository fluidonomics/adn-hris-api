let express  = require('express'),
    auth     = require('../controllers/auth.controller'),
    user     = require('../controllers/user.controller'),
    admin    = require('../controllers/admin.controller'),
    master   = require('../controllers/master.controller'),
    common   = require('../controllers/common.controller'),
    Employee = require('../models/employee/employeeDetails.model'),
    // passport = require('passport');
    jwt = require('jsonwebtoken-refresh');

    //let requireAuth = passport.authenticate('jwt', {session: false});

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
                  // var originalDecoded = jwt.decode(token[1], {complete: true});
                  // var refreshedToken = jwt.refresh(originalDecoded, 3600, process.env.Secret);
                  // let refreshToken="Bearer "+ refreshedToken;
                  // res.setHeader("authorization",refreshToken)

                  var originalDecoded = jwt.decode(token, {complete: true});
                  var refreshedToken = jwt.refresh(originalDecoded, 3600, process.env.Secret);
                  res.setHeader('access-token', refreshedToken);
                  res.setHeader('client', "application_id");
                  res.setHeader('expiry', '');
                  res.setHeader('token-type', 'Bearer');
                  res.setHeader('uid', "");

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

  // app.use(passport.initialize());
  // require('../config/passport')(passport);

  // Initializing route groups
  let apiRoutes   = express.Router(),
      authRoutes  = express.Router(),
      adminRoutes = express.Router(),
      userRoutes  = express.Router(),
      masterRoutes= express.Router();
      commonRoutes= express.Router();
      uploadRoutes = express.Router(),

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
  userRoutes.post('/addPersonalInfo', user.addPersonalInfo);
  
  // Add Employee endpoint: http://localhost:3000/api/user/updatePersonalInfo
  userRoutes.post('/updatePersonalInfo', user.updatePersonalInfo);

 // Add Employee endpoint: http://localhost:3000/api/user/addAcademicInfo
 userRoutes.post('/addAcademicInfo', user.addAcademicInfo);

  // Add Employee endpoint: http://localhost:3000/api/user/updateAcademicInfo
  userRoutes.post('/updateAcademicInfo', user.updateAcademicInfo);

    // Academic Info Endpoint: http://localhost:3000/api/user/deleteAcademicInfo
    userRoutes.delete('/deleteAcademicInfo', user.deleteAcademicInfo);

    // Add Employee endpoint: http://localhost:3000/api/user/addPreviousEmploymentInfo
 userRoutes.post('/addPreviousEmploymentInfo', user.addPreviousEmploymentInfo);

 // Add Employee endpoint: http://localhost:3000/api/user/updatePreviousEmploymentInfo
 userRoutes.post('/updatePreviousEmploymentInfo', user.updatePreviousEmploymentInfo);

   // PreviousEmployment Info Endpoint: http://localhost:3000/api/user/deletePreviousEmploymentInfo
   userRoutes.delete('/deletePreviousEmploymentInfo', user.deletePreviousEmploymentInfo);

  // Add Employee Address endpoint: http://localhost:3000/api/user/addAddressInfo
  userRoutes.post('/addAddressInfo', user.addAddressInfo);

   // Update Employee Address endpoint: http://localhost:3000/api/user/updateAddressInfo
   userRoutes.post('/updateAddressInfo', user.updateAddressInfo);

   // Add Employee endpoint: http://localhost:3000/api/user/addFamilyInfo
 userRoutes.post('/addFamilyInfo', user.addFamilyInfo);

 // Add Employee endpoint: http://localhost:3000/api/user/updateFamilyInfo
 userRoutes.post('/updateFamilyInfo', user.updateFamilyInfo);

 // Add Employee endpoint: http://localhost:3000/api/user/deleteFamilyInfo
 userRoutes.delete('/deleteFamilyInfo', user.deleteFamilyInfo);

 // Add Employee endpoint: http://localhost:3000/api/user/addDocumentsInfo
 userRoutes.post('/addDocumentsInfo', user.addDocumentsInfo);

 // Add Employee endpoint: http://localhost:3000/api/user/updateDocumentsInfo
 userRoutes.post('/updateDocumentsInfo', user.updateDocumentsInfo);

 // Add Employee endpoint: http://localhost:3000/api/user/addBankInfo
 userRoutes.post('/addBankInfo', user.addBankInfo);

 // Add Employee endpoint: http://localhost:3000/api/user/updateBankInfo
 userRoutes.post('/updateBankInfo', user.updateBankInfo);

 // Add Employee endpoint: http://localhost:3000/api/user/addSalaryInfo
 userRoutes.post('/addSalaryInfo', user.addSalaryInfo);

 // Add Employee endpoint: http://localhost:3000/api/user/updateSalaryInfo
 userRoutes.post('/updateSalaryInfo', user.updateSalaryInfo);

  // Add Employee endpoint: http://localhost:3000/api/user/addCarInfo
  userRoutes.post('/addCarInfo', user.addCarInfo);

  // Add Employee endpoint: http://localhost:3000/api/user/updateCarInfo
  userRoutes.post('/updateCarInfo', user.updateCarInfo);

  // Add Employee endpoint: http://localhost:3000/api/user/addCertificationInfo
  userRoutes.post('/addCertificationInfo', user.addCertificationInfo);

  // Add Employee endpoint: http://localhost:3000/api/user/updateCertificationInfo
  userRoutes.post('/updateCertificationInfo', user.updateCertificationInfo);

  // Add Employee endpoint: http://localhost:3000/api/user/deleteCertificationInfo
  userRoutes.delete('/deleteCertificationInfo', user.deleteCertificationInfo);

  // Add Employee endpoint: http://localhost:3000/api/user/addPerformanceRatingInfo
  userRoutes.post('/addPerformanceRatingInfo', user.addPerformanceRatingInfo);

  // Add Employee endpoint: http://localhost:3000/api/user/updatePerformanceRatingInfo
  userRoutes.post('/updatePerformanceRatingInfo', user.updatePerformanceRatingInfo);

  // Get All Employee
  //userRoutes.get('/getEmployeeInfo', user.getEmployeeInfo);

  //userRoutes.post('/employeeDetails',user.employeeDetails);


  userRoutes.get('/getPersonalInfo',user.getPersonalInfo);

  userRoutes.get('/getAddressInfo',user.getAddressInfo);

  userRoutes.get('/getDocumentsInfo',user.getDocumentsInfo);

  userRoutes.get('/getAcademicInfo',user.getAcademicInfo);


  userRoutes.get('/getCertificationInfo',user.getCertificationInfo);

  userRoutes.get('/getPreviousEmploymentInfo',user.getPreviousEmploymentInfo);
  
  userRoutes.get('/getFamilyInfo',user.getFamilyInfo);

  userRoutes.get('/getOfficeInfo',user.getOfficeInfo);

  userRoutes.get('/getPositionInfo',user.getPositionInfo);
  

  //userRoutes.get('/getJoiningDetails',user.getJoiningDetails);


   userRoutes.get('/getPerformanceRatingInfo',user.getPerformanceRatingInfo);

   userRoutes.get('/getBankInfo',user.getBankInfo);

   userRoutes.get('/getSalaryInfo',user.getSalaryInfo);

   userRoutes.get('/getAllEmployee',user.getAllEmployee);
   
   userRoutes.get('/getCarInfo',user.getCarInfo);

  // userRoutes.get('/getCompanyCarDetails',user.getCompanyCarDetails);

  // userRoutes.get('/getPersonalCarDetails',user.getPersonalCarDetails);

  //= ========================
  // User Forms Routes
  //= ========================

//   apiRoutes.use('/forms', formRoutes);

//   // Upload image endpoint: http://localhost:3000/api/forms/image
//   formRoutes.post('/image', requireAuth, forms.uploadImage);

//   // Delete Image endpoint: http://localhost:3000/api/forms/image/:id
//   formRoutes.delete('/image/:id', requireAuth, forms.deleteImage);



  //= ========================
  // Administrator Routes
  //= ========================

  // Admin endpoint: http://localhost:3000/api/admin
      // apiRoutes.use('/admin', adminRoutes);

      // adminRoutes.post('/upload', admin.uploadImage);

//   // Upload image endpoint: http://localhost:3000/api/admin/form/image
//   formRoutes.post('/form/image', requireAuth, admin.uploadImage);

//   // Delete Image endpoint: http://localhost:3000/api/admin/form/image/:id
//   formRoutes.delete('/form/image/:id', requireAuth, admin.deleteImage);



  //= ========================
  // Master Data (Dropdowns) Routes 
  //= ========================

    // User Auth Routes endpoint: http://localhost:3000/api/auth
   apiRoutes.use('/master', masterRoutes);

   // Register endpoint: http://localhost:3000/api/master/createGrade
   masterRoutes.post('/createRole', master.createRole);

   // Register endpoint: http://localhost:3000/api/master/createCompany
   masterRoutes.post('/createCompany', master.createCompany);

   // Register endpoint: http://localhost:3000/api/master/createDivision
   masterRoutes.post('/createDivision', master.createDivision);

   // Register endpoint: http://localhost:3000/api/master/createDepartment
   masterRoutes.post('/createDepartment', master.createDepartment);

   // Register endpoint: http://localhost:3000/api/master/createVertical
   masterRoutes.post('/createVertical', master.createVertical);

   // Register endpoint: http://localhost:3000/api/master/createSubVertical
   masterRoutes.post('/createSubVertical', master.createSubVertical);

   // Register endpoint: http://localhost:3000/api/master/createMaritalStatus
   masterRoutes.post('/createMaritalStatus', master.createMaritalStatus);

   // Register endpoint: http://localhost:3000/api/master/createCurrency
   masterRoutes.post('/createCurrency', master.createCurrency);

   // Register endpoint: http://localhost:3000/api/master/createGrade
   masterRoutes.post('/createGrade', master.createGrade);

   // Register endpoint: http://localhost:3000/api/master/createDesignation
   masterRoutes.post('/createDesignation', master.createDesignation);

   // Register endpoint: http://localhost:3000/api/master/createGradeDesignation
   masterRoutes.post('/createGradeDesignation', master.createGradeDesignation);

   // Register endpoint: http://localhost:3000/api/master/createLocation
   masterRoutes.post('/createLocation', master.createLocation);

   // Register endpoint: http://localhost:3000/api/master/createManagementType
   masterRoutes.post('/createManagementType', master.createManagementType);

   // Register endpoint: http://localhost:3000/api/master/createEmploymentType
   masterRoutes.post('/createEmploymentType', master.createEmploymentType);

   // Register endpoint: http://localhost:3000/api/master/createEmploymentStatus
   masterRoutes.post('/createEmploymentStatus', master.createEmploymentStatus);

   // Register endpoint: http://localhost:3000/api/master/createEducation
   masterRoutes.post('/createEducation', master.createEducation);

   // Register endpoint: http://localhost:3000/api/master/createRelation
   masterRoutes.post('/createRelation', master.createRelation);

   // Register endpoint: http://localhost:3000/api/master/createPerformanceRating
   masterRoutes.post('/createPerformanceRating', master.createPerformanceRating);

   

   


     //= ========================
  // Common Data For All (Dropdowns) Data Routes 
  //= ========================

    apiRoutes.use('/common', commonRoutes);

    commonRoutes.get('/getRole', common.getRole);

    commonRoutes.get('/getCompany',ensureAuthenticated, common.getCompany);

    commonRoutes.get('/getDivision', common.getDivision);

    commonRoutes.get('/getDepartment', common.getDepartment);

    commonRoutes.get('/getVertical', common.getVertical);

    commonRoutes.get('/getSubVertical', common.getSubVertical);

    commonRoutes.get('/getGrade', common.getGrade);

    commonRoutes.get('/getDesignation', common.getDesignation);

    commonRoutes.get('/getGradeDesignation', common.getGradeDesignation);

    commonRoutes.get('/getLocation', common.getLocation);

    commonRoutes.get('/getManagementType', common.getManagementType);

    commonRoutes.get('/getEmploymentType', common.getEmploymentType);

    commonRoutes.get('/getEmploymentStatus', common.getEmploymentStatus);

    commonRoutes.get('/getEmployee', common.getEmployee);

    commonRoutes.get('/getHr', common.getHr);

    commonRoutes.get('/getSupervisor', common.getSupervisor);

    commonRoutes.get('/checkEmailUnique', common.checkEmailUnique);

    commonRoutes.get('/getEducation', common.getEducation);

    commonRoutes.get('/getPerformanceRating', common.getPerformanceRating);

    commonRoutes.get('/getRelation', common.getRelation);
    
      //= ========================
      // Upload Routes
      //= ========================


    apiRoutes.use('/upload', uploadRoutes);

    uploadRoutes.post('/document', admin.uploadDocumentImage);
    
    // Set url for API group routes, all endpoints start with /api/ eg http://localhost:3000/api/admin  || http://localhost:3000/api/auth
    app.use('/api', apiRoutes);
};

