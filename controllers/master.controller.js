let express           = require('express'),
    Role              = require('../models/role.model'),
    Company           = require('../models/company.model'),
    Division          = require('../models/division.model'),
    Department        = require('../models/department.model'),
    Vertical          = require('../models/vertical.model'),
    SubVertical       = require('../models/subVertical.model'),
    MaritalStatus     = require('../models/maritalStatus.model'),
    Currency          = require('../models/currency.model'),
    Grade             = require('../models/grade.model'),
    Designation       = require('../models/designation.model'),
    GradeDesignation  = require('../models/gradeDesignation.model'),    
    Location          = require('../models/location.model'),
    ManagementType    = require('../models/managementType.model'),
    EmploymentType    = require('../models/employmentType.model'),
    EmploymentStatus  = require('../models/employmentStatus.model'),
    jwt               = require('jsonwebtoken'),
    config            = require('../config/config'),
    fs                = require('fs'),
    multer            = require('multer'),
    mime              = require('mime'),
    path              = require('path'),
    crypto            = require('crypto'),
    gm                = require('gm').subClass({imageMagick: true}),
    nodemailer        = require('nodemailer'),
    hbs               = require('nodemailer-express-handlebars'),
    sgTransport       = require('nodemailer-sendgrid-transport'),
    uuidV1            = require('uuid/v1'),
    async             = require('async')
    awaitEach         =require('await-each');


let functions = {
  createRole: (req, res) => {
    let role=new Role();
    role.roleName = req.body.roleName|| req.query.roleName;
    role.createdBy =  req.body.createdBy|| req.query.createdBy;
    //grade.createdBy = req.headers['emp_id'];
    
    role.save(function (err, result) {
      if(result)
      {
        return res.status(200).json({
            status : '200',
            message: 'Role Added Successful!'
          });
      }
      else{
        return res.status(403).json({
          title: 'There was a problem',
          error: {message: err},
          result: {message: result}
        });
      }
    });
  },
  createCompany: (req, res) => {
    let company=new Company();
    //Fill Company Details
    company.companyName = req.body.companyName;
    company.createdBy = req.body.createdBy;
    //grade.createdBy = req.headers['emp_id'];
    company.save(function (err, result) {
      if(result)
      {
        return res.status(200).json({ status : '200',message: 'Company added Successfully',
        });
      }
      else{
        return res.status(403).json({
          title: 'Add new Company failed!',
          error: {message: err},
          result: {message: result}
        });
      }
    });
  },

  createDivision: (req, res) => {
    let division=new Division();
    //Fill Division Details
    division.divisionName = req.body.divisionName;
    division.createdBy = req.body.createdBy;
    //grade.createdBy = req.headers['emp_id'];
    division.save(function (err, result) {
      if(result)
      {
        return res.status(200).json({ status : '200',message: 'Division added Successfully',
        });
      }
      else{
        return res.status(403).json({
          title: 'Add new Division failed!',
          error: {message: err},
          result: {message: result}
        });
      }
    });
  },

  createDepartment: (req, res) => {
    let department=new Department();
    //Fill Department Details
    department.departmentName = req.body.departmentName;
    department.division_id = req.body.division_id;
    department.createdBy = req.body.createdBy;
    //grade.createdBy = req.headers['emp_id'];
    department.save(function (err, result) {
      if(result)
      {
        return res.status(200).json({ status : '200',message: 'Department added Successfully',
        });
      }
      else{
        return res.status(403).json({
          title: 'Add new Department failed!',
          error: {message: err},
          result: {message: result}
        });
      }
    });
  },
  createVertical: (req, res) => {
    let vertical=new Vertical();
    //Fill Vertical Details
    vertical.verticalName = req.body.verticalName;
    vertical.department_id = req.body.department_id;
    vertical.createdBy = req.body.createdBy;
    //grade.createdBy = req.headers['emp_id'];
    vertical.save(function (err, result) {
      if(result)
      {
        return res.status(200).json({ status : '200',message: 'Vertical added Successfully',
        });
      }
      else{
        return res.status(403).json({
          title: 'Add new Vertical failed!',
          error: {message: err},
          result: {message: result}
        });
      }
    });
  },
  createSubVertical: (req, res) => {
    let subVertical=new SubVertical();
    //Fill Vertical Details
    subVertical.subVerticalName = req.body.subVerticalName;
    subVertical.vertical_id = req.body.vertical_id;
    subVertical.createdBy = req.body.createdBy;
    //grade.createdBy = req.headers['emp_id'];
    subVertical.save(function (err, result) {
      if(result)
      {
        return res.status(200).json({ status : '200',message: 'Sub Vertical added Successfully',
        });
      }
      else{
        return res.status(403).json({
          title: 'Add new Sub Vertical failed!',
          error: {message: err},
          result: {message: result}
        });
      }
    });
  },
  createMaritalStatus: (req, res) => {
    let maritalStatus=new MaritalStatus();
    //Fill Marital Status Details
    maritalStatus.maritalStatusName = req.body.maritalStatusName;
    maritalStatus.createdBy = req.body.createdBy;
    //grade.createdBy = req.headers['emp_id'];
    maritalStatus.save(function (err, result) {
      if(result)
      {
        return res.status(200).json({ status : '200',message: 'Marital Status added Successfully',
        });
      }
      else{
        return res.status(403).json({
          title: 'Add new Marital Status failed!',
          error: {message: err},
          result: {message: result}
        });
      }
    });
  },
  createCurrency: (req, res) => {
    let currency=new Currency();
    //Fill Marital Status Details
    currency.currencyName = req.body.currencyName;
    currency.createdBy = req.body.createdBy;
    //grade.createdBy = req.headers['emp_id'];
    currency.save(function (err, result) {
      if(result)
      {
        return res.status(200).json({ status : '200',message: 'Currency added Successfully',
        });
      }
      else{
        return res.status(403).json({
          title: 'Add new Currency failed!',
          error: {message: err},
          result: {message: result}
        });
      }
    });
  },
  createGrade: (req, res) => {
    let grade=new Grade();
    //Fill Grade Details
    grade.gradeName = req.body.gradeName;
    grade.createdBy = req.body.createdBy;
    //grade.createdBy = req.headers['emp_id'];
    
    grade.save(function (err, result) {
      if(result)
      {
        return res.status(200).json({ status : '200',message: 'Grade added Successfully',
        });
      }
      else{
        return res.status(403).json({
          title: 'Add new Grade failed!',
          error: {message: err},
          result: {message: result}
        });
      }
    });
  },
  createDesignation: (req, res) => {
    let designation=new Designation();
    //Fill Designation Details
    designation.designationName = req.body.designationName;
    designation.grade_id = req.body.grade_id;
    designation.createdBy = req.body.createdBy;
    //designation.createdBy = req.headers['emp_id'];
    designation.save(function (err, result) {
      if(result)
      {
        return res.status(200).json({ status : '200',message: 'Designation added Successfully',
        });
      }
      else{
        return res.status(403).json({
          title: 'Add new Designation failed!',
          error: {message: err},
          result: {message: result}
        });
      }
    });
  },
  
  createLocation: (req, res) => {
    let location=new Location();
    location.locationName = req.body.locationName;
   
    var parent_id=req.body.parent_id;
    if(parent_id){
      location.parent_id = parent_id;
    }
     location.createdBy = req.body.createdBy;
    //location.createdBy = req.headers[emp_id];
 
    location.save(function (err, result) {
      if(result)
      {
        return res.status(200).json({ status : '200',message: 'Location added Successfully',
        });
      }
      else{
        return res.status(403).json({
          title: 'Add new Location failed!',
          error: {message: err},
          result: {message: result}
        });
      }
    });
  }, 
  createGradeDesignation: (req, res) => {
    let gradeDesignation=new GradeDesignation();
    //Fill Grade Details    
    gradeDesignation.designation_id = req.body.designation_id;
    gradeDesignation.grade_id = req.body.grade_id;
    gradeDesignation.createdBy = req.body.createdBy;
    //grade.createdBy = req.headers['emp_id'];
    
    gradeDesignation.save(function (err, result) {
      if(result)
      {
        return res.status(200).json({ status : '200',message: 'GradeDesignation added Successfully',
        });
      }
      else{
        return res.status(403).json({
          title: 'Add new GradeDesignation failed!',
          error: {message: err},
          result: {message: result}
        });
      }
    });
  },
  createManagementType: (req, res) => {
    let managementType=new ManagementType();
    //Fill ManagementType Details
    managementType.managementTypeName = req.body.managementTypeName;
    managementType.createdBy = req.body.createdBy;
    //grade.createdBy = req.headers['emp_id'];
    managementType.save(function (err, result) {
      if(result)
      {
        return res.status(200).json({ status : '200',message: 'ManagementType added Successfully',
        });
      }
      else{
        return res.status(403).json({
          title: 'Add new ManagementType failed!',
          error: {message: err},
          result: {message: result}
        });
      }
    });
  },
  createEmploymentType: (req, res) => {
    let employmentType=new EmploymentType();
    //Fill EmploymentType Details
    employmentType.employmentTypeName = req.body.employmentTypeName;
    employmentType.managementType_id = req.body.managementType_id;
    employmentType.createdBy = req.body.createdBy;
    //grade.createdBy = req.headers['emp_id'];
    employmentType.save(function (err, result) {
      if(result)
      {
        return res.status(200).json({ status : '200',message: 'EmploymentType added Successfully',
        });
      }
      else{
        return res.status(403).json({
          title: 'Add new EmploymentType failed!',
          error: {message: err},
          result: {message: result}
        });
      }
    });
  },
  createEmploymentStatus: (req, res) => {
    let employmentStatus=new EmploymentStatus();
    //Fill EmploymentStatus Details
    employmentStatus.employmentStatusName = req.body.employmentStatusName;
    employmentStatus.createdBy = req.body.createdBy;
    //grade.createdBy = req.headers['emp_id'];
    employmentStatus.save(function (err, result) {
      if(result)
      {
        return res.status(200).json({ status : '200',message: 'EmploymentStatus added Successfully',
        });
      }
      else{
        return res.status(403).json({
          title: 'Add new EmploymentStatus failed!',
          error: {message: err},
          result: {message: result}
        });
      }
    });
  },
};

module.exports = functions;


