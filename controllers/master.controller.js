let express = require('express'),
  Role = require('../models/master/role.model'),
  Company = require('../models/master/company.model'),
  Facility = require('../models/master/facility.model'),
  CompanyBusiness = require('../models/master/companyBusiness.model'),
  Document = require('../models/master/document.model'),
  Division = require('../models/master/division.model'),
  Department = require('../models/master/department.model'),
  Vertical = require('../models/master/vertical.model'),
  SubVertical = require('../models/master/subVertical.model'),
  MaritalStatus = require('../models/master/maritalStatus.model'),
  Currency = require('../models/master/currency.model'),
  Grade = require('../models/master/grade.model'),
  Designation = require('../models/master/designation.model'),
  GradeDesignation = require('../models/master/gradeDesignation.model'),
  Location = require('../models/master/location.model'),
  ManagementType = require('../models/master/managementType.model'),
  EmploymentType = require('../models/master/employmentType.model'),
  EmploymentStatus = require('../models/master/employmentStatus.model'),
  Education = require('../models/master/education.model'),
  Relation = require('../models/master/relation.model'),
  PerformanceRating = require('../models/master/performanceRating.model'),
  FinancialYearDetail = require('../models/master/financialYearDetails.model'),
  FinancialYearCompany = require('../models/master/financialYear.model'),
  PapRatingScale = require('../models/master/papRatingScale.model'),
  HrHeads = require('../models/master/hrheads.model');

//jwt                = require('jsonwebtoken'),
// config            = require('../config/config'),
// fs                = require('fs'),
// multer            = require('multer'),
// mime              = require('mime'),
// path              = require('path'),
// crypto            = require('crypto'),
// gm                = require('gm').subClass({imageMagick: true}),
// nodemailer        = require('nodemailer'),
// hbs               = require('nodemailer-express-handlebars'),
// sgTransport       = require('nodemailer-sendgrid-transport'),
// uuidV1            = require('uuid/v1'),
async = require('async');
//awaitEach         =require('await-each');


let functions = {
  createRole: (req, res) => {
    let role = new Role();
    role.roleName = req.body.roleName || req.query.roleName;
    role.createdBy = req.body.createdBy || req.query.createdBy;
    //grade.createdBy = req.headers['emp_id'];

    role.save(function (err, result) {
      if (result) {
        return res.status(200).json({
          status: '200',
          message: 'Role Added Successful!'
        });
      }
      else {
        return res.status(403).json({
          title: 'There was a problem',
          error: { message: err },
          result: { message: result }
        });
      }
    });
  },
  createCompany: (req, res) => {
    let company = new Company();
    //Fill Company Details
    company.companyName = req.body.companyName;
    company.createdBy = req.body.createdBy;
    //grade.createdBy = req.headers['emp_id'];
    company.save(function (err, result) {
      if (result) {
        return res.status(200).json({
          status: '200', message: 'Company added Successfully',
        });
      }
      else {
        return res.status(403).json({
          title: 'Add new Company failed!',
          error: { message: err },
          result: { message: result }
        });
      }
    });
  },


  createDocument: (req, res) => {
    let document = new Document(req.body);
    //Fill Document Details
    document.createdBy = req.body.createdBy;
    document.save(function (err, result) {
      if (result) {
        return res.status(200).json({
          status: '200', message: 'Document added Successfully',
        });
      }
      else {
        return res.status(403).json({
          title: 'Add new Document failed!',
          error: { message: err },
          result: { message: result }
        });
      }
    });
  },

  createFacility: (req, res) => {
    let facility = new Facility();
    //Fill Facility Details
    facility.facilityName = req.body.facilityName;
    facility.createdBy = req.body.createdBy;
    //grade.createdBy = req.headers['emp_id'];
    facility.save(function (err, result) {
      if (result) {
        return res.status(200).json({
          status: '200', message: 'Facility added Successfully',
        });
      }
      else {
        return res.status(403).json({
          title: 'Add new Facility failed!',
          error: { message: err },
          result: { message: result }
        });
      }
    });
  },

  createCompanyBusiness: (req, res) => {
    let companyBusiness = new CompanyBusiness();
    //Fill CompanyBusiness Details
    companyBusiness.companyBusinessName = req.body.companyBusinessName;
    companyBusiness.createdBy = req.body.createdBy;
    //grade.createdBy = req.headers['emp_id'];
    companyBusiness.save(function (err, result) {
      if (result) {
        return res.status(200).json({
          status: '200', message: 'CompanyBusiness added Successfully',
        });
      }
      else {
        return res.status(403).json({
          title: 'Add new CompanyBusiness failed!',
          error: { message: err },
          result: { message: result }
        });
      }
    });
  },

  createDivision: (req, res) => {
    let division = new Division();
    //Fill Division Details
    division.divisionName = req.body.divisionName;
    division.createdBy = req.body.createdBy;
    //grade.createdBy = req.headers['emp_id'];
    division.save(function (err, result) {
      if (result) {
        return res.status(200).json({
          status: '200', message: 'Division added Successfully',
        });
      }
      else {
        return res.status(403).json({
          title: 'Add new Division failed!',
          error: { message: err },
          result: { message: result }
        });
      }
    });
  },

  createDepartment: (req, res) => {
    let department = new Department();
    //Fill Department Details
    department.departmentName = req.body.departmentName;
    department.division_id = req.body.division_id;
    department.createdBy = req.body.createdBy;
    //grade.createdBy = req.headers['emp_id'];
    department.save(function (err, result) {
      if (result) {
        return res.status(200).json({
          status: '200', message: 'Department added Successfully',
        });
      }
      else {
        return res.status(403).json({
          title: 'Add new Department failed!',
          error: { message: err },
          result: { message: result }
        });
      }
    });
  },
  createVertical: (req, res) => {
    let vertical = new Vertical();
    //Fill Vertical Details
    vertical.verticalName = req.body.verticalName;
    vertical.department_id = req.body.department_id;
    vertical.createdBy = req.body.createdBy;
    //grade.createdBy = req.headers['emp_id'];
    vertical.save(function (err, result) {
      if (result) {
        return res.status(200).json({
          status: '200', message: 'Vertical added Successfully',
        });
      }
      else {
        return res.status(403).json({
          title: 'Add new Vertical failed!',
          error: { message: err },
          result: { message: result }
        });
      }
    });
  },
  createSubVertical: (req, res) => {
    let subVertical = new SubVertical();
    //Fill Vertical Details
    subVertical.subVerticalName = req.body.subVerticalName;
    subVertical.vertical_id = req.body.vertical_id;
    subVertical.createdBy = req.body.createdBy;
    //grade.createdBy = req.headers['emp_id'];
    subVertical.save(function (err, result) {
      if (result) {
        return res.status(200).json({
          status: '200', message: 'Sub Vertical added Successfully',
        });
      }
      else {
        return res.status(403).json({
          title: 'Add new Sub Vertical failed!',
          error: { message: err },
          result: { message: result }
        });
      }
    });
  },
  createMaritalStatus: (req, res) => {
    let maritalStatus = new MaritalStatus();
    //Fill Marital Status Details
    maritalStatus.maritalStatusName = req.body.maritalStatusName;
    maritalStatus.createdBy = req.body.createdBy;
    //grade.createdBy = req.headers['emp_id'];
    maritalStatus.save(function (err, result) {
      if (result) {
        return res.status(200).json({
          status: '200', message: 'Marital Status added Successfully',
        });
      }
      else {
        return res.status(403).json({
          title: 'Add new Marital Status failed!',
          error: { message: err },
          result: { message: result }
        });
      }
    });
  },
  createCurrency: (req, res) => {
    let currency = new Currency();
    //Fill Marital Status Details
    currency.currencyName = req.body.currencyName;
    currency.createdBy = req.body.createdBy;
    //grade.createdBy = req.headers['emp_id'];
    currency.save(function (err, result) {
      if (result) {
        return res.status(200).json({
          status: '200', message: 'Currency added Successfully',
        });
      }
      else {
        return res.status(403).json({
          title: 'Add new Currency failed!',
          error: { message: err },
          result: { message: result }
        });
      }
    });
  },
  createGrade: (req, res) => {
    let grade = new Grade();
    //Fill Grade Details
    grade.gradeName = req.body.gradeName;
    grade.createdBy = req.body.createdBy;
    //grade.createdBy = req.headers['emp_id'];

    grade.save(function (err, result) {
      if (result) {
        return res.status(200).json({
          status: '200', message: 'Grade added Successfully',
        });
      }
      else {
        return res.status(403).json({
          title: 'Add new Grade failed!',
          error: { message: err },
          result: { message: result }
        });
      }
    });
  },
  createDesignation: (req, res) => {
    let designation = new Designation();
    //Fill Designation Details
    designation.designationName = req.body.designationName;
    designation.grade_id = req.body.grade_id;
    designation.createdBy = req.body.createdBy;
    //designation.createdBy = req.headers['emp_id'];
    designation.save(function (err, result) {
      if (result) {
        return res.status(200).json({
          status: '200', message: 'Designation added Successfully',
        });
      }
      else {
        return res.status(403).json({
          title: 'Add new Designation failed!',
          error: { message: err },
          result: { message: result }
        });
      }
    });
  },

  createLocation: (req, res) => {
    let location = new Location();
    location.locationName = req.body.locationName;

    var parent_id = req.body.parent_id;
    if (parent_id) {
      location.parent_id = parent_id;
    }
    location.createdBy = req.body.createdBy;
    //location.createdBy = req.headers[emp_id];

    location.save(function (err, result) {
      if (result) {
        return res.status(200).json({
          status: '200', message: 'Location added Successfully',
        });
      }
      else {
        return res.status(403).json({
          title: 'Add new Location failed!',
          error: { message: err },
          result: { message: result }
        });
      }
    });
  },
  createGradeDesignation: (req, res) => {
    let gradeDesignation = new GradeDesignation();
    //Fill Grade Details    
    gradeDesignation.designation_id = req.body.designation_id;
    gradeDesignation.grade_id = req.body.grade_id;
    gradeDesignation.createdBy = req.body.createdBy;
    //grade.createdBy = req.headers['emp_id'];

    gradeDesignation.save(function (err, result) {
      if (result) {
        return res.status(200).json({
          status: '200', message: 'GradeDesignation added Successfully',
        });
      }
      else {
        return res.status(403).json({
          title: 'Add new GradeDesignation failed!',
          error: { message: err },
          result: { message: result }
        });
      }
    });
  },
  createManagementType: (req, res) => {
    let managementType = new ManagementType();
    //Fill ManagementType Details
    managementType.managementTypeName = req.body.managementTypeName;
    managementType.createdBy = req.body.createdBy;
    //grade.createdBy = req.headers['emp_id'];
    managementType.save(function (err, result) {
      if (result) {
        return res.status(200).json({
          status: '200', message: 'ManagementType added Successfully',
        });
      }
      else {
        return res.status(403).json({
          title: 'Add new ManagementType failed!',
          error: { message: err },
          result: { message: result }
        });
      }
    });
  },
  createEmploymentType: (req, res) => {
    let employmentType = new EmploymentType();
    //Fill EmploymentType Details
    employmentType.employmentTypeName = req.body.employmentTypeName;
    employmentType.managementType_id = req.body.managementType_id;
    employmentType.createdBy = req.body.createdBy;
    //grade.createdBy = req.headers['emp_id'];
    employmentType.save(function (err, result) {
      if (result) {
        return res.status(200).json({
          status: '200', message: 'EmploymentType added Successfully',
        });
      }
      else {
        return res.status(403).json({
          title: 'Add new EmploymentType failed!',
          error: { message: err },
          result: { message: result }
        });
      }
    });
  },
  createEmploymentStatus: (req, res) => {
    let employmentStatus = new EmploymentStatus();
    //Fill EmploymentStatus Details
    employmentStatus.employmentStatusName = req.body.employmentStatusName;
    employmentStatus.createdBy = req.body.createdBy;
    //grade.createdBy = req.headers['emp_id'];
    employmentStatus.save(function (err, result) {
      if (result) {
        return res.status(200).json({
          status: '200', message: 'EmploymentStatus added Successfully',
        });
      }
      else {
        return res.status(403).json({
          title: 'Add new EmploymentStatus failed!',
          error: { message: err },
          result: { message: result }
        });
      }
    });
  },
  createEducation: (req, res) => {
    let education = new Education();
    education.educationName = req.body.educationName;

    var parent_id = req.body.parent_id;
    if (parent_id) {
      education.parent_id = parent_id;
    }
    education.createdBy = req.body.createdBy;
    //education.createdBy = req.headers[emp_id];

    education.save(function (err, result) {
      if (result) {
        return res.status(200).json({
          status: '200', message: 'Education added Successfully',
        });
      }
      else {
        return res.status(403).json({
          title: 'Add new Education failed!',
          error: { message: err },
          result: { message: result }
        });
      }
    });
  },
  createRelation: (req, res) => {
    let relation = new Relation();
    relation.relationName = req.body.relationName;

    var parent_id = req.body.parent_id;
    if (parent_id) {
      relation.parent_id = parent_id;
    }
    relation.createdBy = req.body.createdBy;
    //relation.createdBy = req.headers[emp_id];

    relation.save(function (err, result) {
      if (result) {
        return res.status(200).json({
          status: '200', message: 'Relation added Successfully',
        });
      }
      else {
        return res.status(403).json({
          title: 'Add new Relation failed!',
          error: { message: err },
          result: { message: result }
        });
      }
    });
  },
  createPerformanceRating: (req, res) => {
    let performanceRating = new PerformanceRating();
    performanceRating.performanceRatingName = req.body.performanceRatingName;

    var parent_id = req.body.parent_id;
    if (parent_id) {
      performanceRating.parent_id = parent_id;
    }
    performanceRating.createdBy = req.body.createdBy;
    //performanceRating.createdBy = req.headers[emp_id];

    performanceRating.save(function (err, result) {
      if (result) {
        return res.status(200).json({
          status: '200', message: 'PerformanceRating added Successfully',
        });
      }
      else {
        return res.status(403).json({
          title: 'Add new PerformanceRating failed!',
          error: { message: err },
          result: { message: result }
        });
      }
    });
  },

  createFinancialYear: (req, res) => {
    let financialYear = new FinancialYearDetail();
    financialYear.financialYearName = req.body.FinancialYearName;
    financialYear.starDate = new Date(req.body.StarDate);
    financialYear.endDate = new Date(req.body.EndDate);
    financialYear.isYearActive = req.body.isYearActive;
    financialYear.isDeleted = false;

    financialYear.save(function (err, result) {
      if (result) {
        return res.status(200).json({
          status: '200', message: 'Financial year added Successfully',
        });
      }
      else {
        return res.status(403).json({
          title: 'Financial year add failed!',
          error: { message: err },
          result: { message: result }
        });
      }
    });
  },

  createCompanyFinancialYear: (req, res) => {
    let financialYearCompany = new FinancialYearCompany();
    financialYearCompany.financialYearId = req.body.financialYearId;
    financialYearCompany.isDeleted = req.body.isDeleted;
    financialYearCompany.companyId = req.body.companyId;

    financialYearCompany.save(function (err, result) {
      if (result) {
        return res.status(200).json({
          status: '200', message: 'Company Financial year added Successfully',
        });
      }
      else {
        return res.status(403).json({
          title: 'Company Financial year add failed!',
          error: { message: err },
          result: { message: result }
        });
      }
    });

  },
  createPapRatingScale: (req, res) => {
    let ratingScale = new PapRatingScale();
    ratingScale.ratingScale = req.body.ratingScale;
    ratingScale.nomenclature = req.body.nomenclature;
    ratingScale.definition = req.body.definition;
    ratingScale.differentiator = req.body.differentiator;
    ratingScale.updatedBy = req.body.emp_id;
    ratingScale.createdBy = req.body.emp_id;
    ratingScale.isDeleted = false;

    ratingScale.save(function (err, result) {
      if (result) {
        return res.status(200).json({
          status: '200', message: 'PAP Rating Scale added Successfully',
        });
      }
      else {
        return res.status(403).json({
          title: 'PAP Rating Scale add failed!',
          error: { message: err },
          result: { message: result }
        });
      }
    });

  },
  getPapRatingScale: (req, res) => {
    PapRatingScale.find({}, (err, result) => {
      if (err) {
        return res.status(403).json({
          title: 'There was an error, please try again later',
          error: { message: err },
          result: { message: result }
        });
      }
      return res.status(200).json({ result });
    });
  },
  getHrHeads: (req, res) => {
    HrHeads.aggregate([
      {
        $match: {
          company_id: parseInt(req.query.company_id)
        }
      },
      {
        $lookup: {
          from: "employeedetails",
          localField: "emp_id",
          foreignField: "_id",
          as: "employeedetails"
        }
      },
      {
        $unwind: {
          path: "$employeedetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          "_id": 1,
          "updatedAt": 1,
          "createdAt": 1,
          "company_id": 1,
          "emp_id": 1,
          "type": 1,
          "isDeleted": 1,

          "userName": "$employeedetails.userName",
          "grade_id": "$employeedetails.grade_id",
          "designation_id": "$employeedetails.designation_id",
          "employmentType_id": "$employeedetails.employmentType_id",
          "fullName": "$employeedetails.fullName",
          "isAccountActive": "$employeedetails.isAccountActive",
          "isDeleted": "$employeedetails.isDeleted",
          "profileImage": "$employeedetails.profileImage"
        }
      }
    ]).exec((err, result) => {
      if (err) {
        return res.status(403).json({
          title: 'There was an error, please try again later',
          error: { message: err },
          result: { message: result }
        });
      }
      return res.status(200).json({ result });
    });
  },
  getAllHrHeads: (req, res) => {
    HrHeads.aggregate([
      {
        $lookup: {
          from: "employeedetails",
          localField: "emp_id",
          foreignField: "_id",
          as: "employeedetails"
        }
      },
      {
        $unwind: {
          path: "$employeedetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "companies",
          localField: "company_id",
          foreignField: "_id",
          as: "companies"
        }
      },
      {
        $unwind: {
          path: "$companies",
          preserveNullAndEmptyArrays: true
        }
      }
    ]).exec((err, result) => {
      if (err) {
        return res.status(403).json({
          title: 'There was an error, please try again later',
          error: { message: err },
          result: { message: result }
        });
      }
      return res.status(200).json({ result });
    });
  }
};

module.exports = functions;

