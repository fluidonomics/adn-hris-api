let express  = require('express'),
    auth     = require('../controllers/auth.controller'),
    user     = require('../controllers/user.controller'),
    admin    = require('../controllers/admin.controller'),
    master   = require('../controllers/master.controller'),
    common   = require('../controllers/common.controller'),
    passport = require('passport');

let requireAuth = passport.authenticate('jwt', {session: false});

module.exports = (app) => {

  app.use(passport.initialize());
  require('../config/passport')(passport);

  // Initializing route groups
  let apiRoutes   = express.Router(),
      authRoutes  = express.Router(),
      adminRoutes = express.Router(),
      userRoutes  = express.Router(),
      masterRoutes= express.Router();
      commonRoutes= express.Router();

  //= ========================
  // Auth Routes
  //= ========================

  // User Auth Routes endpoint: http://localhost:3000/api/auth
  apiRoutes.use('/auth', authRoutes);  

  // Login endpoint: http://localhost:3000/api/auth/login
  authRoutes.post('/login', auth.loginUser);

  // Forget Password endpoint: http://localhost:3000/api/auth/password
  authRoutes.post('/password', auth.forgetPassword);

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

  // Change user password from front end (not via email, via form)
  userRoutes.post('/password', requireAuth, user.changePassword);

  // Upload image endpoint: http://localhost:3000/api/user/image
  userRoutes.post('/image', requireAuth, user.uploadImage);

  // Delete Image endpoint: http://localhost:3000/api/user/image/:id
  userRoutes.delete('/image/:id', requireAuth, user.deleteImage);

  userRoutes.get('/getEmployeeDetails', user.getEmployeeDetails);
  



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

//   // Admin endpoint: http://localhost:3000/api/admin
//   apiRoutes.use('/admin', adminRoutes);

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

   

   


     //= ========================
  // Common Data For All (Dropdowns) Data Routes 
  //= ========================

    apiRoutes.use('/common', commonRoutes);

    commonRoutes.get('/getRole', common.getRole);

    commonRoutes.get('/getCompany', common.getCompany);

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
    

    
    // Set url for API group routes, all endpoints start with /api/ eg http://localhost:3000/api/admin  || http://localhost:3000/api/auth
    app.use('/api', apiRoutes);
};

