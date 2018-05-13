let express = require('express'),

    LeaveApply = require('../models/leave/leaveApply.model');
config = require('../config/config'),
    crypto = require('crypto'),
    async = require('async'),
    nodemailer = require('nodemailer'),
    hbs = require('nodemailer-express-handlebars'),
    sgTransport = require('nodemailer-sendgrid-transport'),
    uuidV1 = require('uuid/v1');
require('dotenv').load()
function applyLeave(req, res, done) {
    let leavedetails = new LeaveApply(req.body);
    leavedetails.emp_id = req.body.emp_id || req.query.emp_id;
    leavedetails.createdBy = parseInt(req.headers.uid);
    leavedetails.fromDate = new Date(req.body.fromDate);
    leavedetails.toDate = new Date(req.body.toDate);
    leavedetails.save(function (err, leavesInfoData) {
        if (err) {
            return res.status(403).json({
                title: 'There is a problem',
                error: {
                    message: err
                },
                result: {
                    message: leavesInfoData
                }
            });
        }
        return done(err, leavesInfoData);
    })

}
// function updateLeave(req, res, done){

// }
// function userLeaveDashboardDetails(req, res, done){

// }
// function empLeaveDetails(req, res, done){

// }

let functions = {
    postApplyLeave: (req, res) => {
        async.waterfall([
            function (done) {
                // let details = new LeaveApply();
                // details.leave_type = req.body.leave_type;
                // details.fromDate = req.body.fromDate;
                // details.toDate = req.body.toDate;
                // details.days = req.body.days;
                // details.applyTo = req.body.applyTo;
                // details.reason = req.body.reason;
                // details.contactDetails = req.body.contactDetails;
                // details.attachment = req.body.attachment;
                // details.ccTo = req.body.ccTo;
                // details.isApproved = req.body.isApproved;
                // details.isCancelled = req.body.isCancelled
                // details.cancelReason  = req.body.cancelReason;
                // details.cancelLeaveApplyTo  = req.body.cancelLeaveApplyTo;
                // details.remark  = req.body.remark;
                // details.forwardTo  = req.body.forwardTo;
                // details.updatedBy  = req.body.updatedBy;
                // details.createdBy  = parseInt(req.headers.uid);
                // details.isDeleted = false;
                applyLeave(req, res, done);
            },
            function (kraWorkFlowInfoData, done) {
                return res.status(200).json(kraWorkFlowInfoData);
            }
        ])
    }
    // postUpdateLeave: (req, res) => {
    //     async.waterfall([
    //         function(done){
    //             updateLeave(req, res,done);
    //         },
    //         function() {
    //             return res.status(200).json();
    //         }
    //     ])
    // },
    // getUserLeaveDashboardDetails: (req, res) => {
    //     async.waterfall([
    //         function(done){
    //             userLeaveDashboardDetails(req, res, done);
    //         },
    //         function(){
    //             return res.status(200).json();
    //         }
    //     ])
    // },
    // getEmpLeaveDetails: (req,res) => {
    //     async.waterfall([
    //         function(done){
    //             empLeaveDetails(req, res, done);
    //         },
    //         function() {
    //             return res.status(200).json();
    //         }
    //     ])
    // }
}

module.exports = functions;