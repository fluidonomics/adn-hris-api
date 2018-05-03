let express           = require('express'),
    EmployeeInfo      = require('../models/employee/employeeDetails.model'),
    PersonalInfo      = require('../models/employee/employeePersonalDetails.model'),
    OfficeInfo        = require('../models/employee/employeeOfficeDetails.model'),
    SupervisorInfo    = require('../models/employee/employeeSupervisorDetails.model'),
    AuditTrail        = require('../models/common/auditTrail.model'),
    Notification      = require('../models/common/notification.model'),
    EmployeeRoles     = require('../models/employee/employeeRoleDetails.model'),
    Kra               = require('../models/kra/kra.model'),
    KraWorkflow       = require('../models/kra/kraWorkflow.model'),
    config            = require('../config/config'),
    crypto            = require('crypto'),
    async             = require('async'),
    nodemailer        = require('nodemailer'),
    hbs               = require('nodemailer-express-handlebars'),
    sgTransport       = require('nodemailer-sendgrid-transport'),
    uuidV1            = require('uuid/v1');
    require('dotenv').load()


// addKraDetails(req,res,done){

// }

addKraInfo:(req,res )=> {
  async.waterfall([
    function(done) {
      addKraDetails(req,res,done);
    },
    function(kraDetailsData,done) {
      return res.status(200).json(kraDetailsData);
    }
  ]);
}
module.exports = functions;