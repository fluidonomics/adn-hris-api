let express = require('express'),
    nodemailer = require('nodemailer'),
    hbs = require('nodemailer-express-handlebars'),
    uuidV1 = require('uuid/v1'),
    config = require('../config/config'),
    moment = require('moment');

require('dotenv').load()

let options = {
    viewPath: config.paths.emailPath,
    extName: '.hbs'
};

let transporter = nodemailer.createTransport({
    host: process.env.EmailHost,
    secure: false,
    auth: {
        user: process.env.EmailUser,
        pass: process.env.EmailPassword
    },
    tls: {
        rejectUnauthorized: false
    }
});
transporter.use('compile', hbs(options));

let functions =
{
    sendEmail: (req, res) => {
        let toEmail = req.body.toEmail;
        let subject = req.body.subject;
        let htmlBody = req.body.htmlBody;

        let mailOptions = {
            from: config.email.welcome.from, // sender address
            to: toEmail,
            subject: subject, // Subject line
            html: htmlBody,
        };
        this.transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                return console.log("RESULT ERROR = ", error2);
            }
            return res.status(200).json({ "message": "Email Send SuccessFully." });
        });

    },

    sendEmailWithAttachment: (toEmail, subject, htmlBody, attachment) => {
        let mailOptions = {
            from: config.email.welcome.from, // sender address
            to: toEmail,
            subject: subject, // Subject line
            html: htmlBody,
            attachment: attachment
        };
        this.transporter.sendMail(mailOptions);
    },

    sendEmailWelcomeUser: (toEmail, employeeData) => {
        let mailOptions = {
            from: config.email.welcome.from, // sender address
            to: toEmail,
            subject: config.email.welcome.subject, // Subject line
            template: 'email-welcome',
            context: {
                fullName: employeeData.fullName,
                userName: employeeData.userName,
                redirectUrl: process.env.HostUrl + "/reset/" + employeeData.resetPasswordToken,
                uid: uuidV1()
            }
        };
        transporter.sendMail(mailOptions);
    },

    sendEmailResetPassword: (toEmail, redirectUrl) => {
        let mailOptions = {
            from: config.email.forget.from, // sender address
            to: toEmail,
            subject: config.email.forget.subject, // Subject line
            template: 'email-password',
            context: {
                action_url: redirectUrl,
                uid: uuidV1()
            }
        };
        transporter.sendMail(mailOptions);

    },

    sendEmailResetPasswordComplete: (toEmail, fullName, userName) => {
        let mailOptions = {
            from: config.email.resetPassword.from, // sender address
            to: toEmail,
            subject: config.email.resetPassword.subject, // Subject line
            template: 'email-notify-password-reset',
            context: {
                email: toEmail,
                fullName: fullName,
                userName: userName,
                uid: uuidV1()
            }
        };
        transporter.sendMail(mailOptions);
    },
    sendToCCEmail: (emp, toemail) => {
        let options = {
            viewPath: config.paths.emailPath,
            extName: '.hbs'
        };
        let transporter = nodemailer.createTransport({
            host: process.env.EmailHost,
            secure: false,
            auth: {
                user: process.env.EmailUser,
                pass: process.env.EmailPassword
            },
            tls: {
                rejectUnauthorized: false
            }
        });
        transporter.use('compile', hbs(options));

        let mailOptions = {
            from: config.email.LeaveApplied.from, // sender address
            to: toemail,
            subject: config.email.LeaveApplied.subject, // Subject line
            template: 'email-notify-leave-applied',
            context: {
                //                    fullName: emp.fullName,
                //                    userName: emp.userName,
                redirectUrl: process.env.HostUrl + "/reset/",
                uid: uuidV1()
            }
        };
        // send mail with defined transport object
        transporter.sendMail(mailOptions);
    },
    sendEmailToSuprsvrNotifyAppliedLeave: (toEmail, data) => {
        let mailOptions = {
            from: config.email.emailToEmployeeForLeaveRequestRejected.from, // sender address
            to: toEmail,
            subject: config.email.emailToSupvsrForAppliedLeave.subject + data.empName, // Subject line
            template: 'email-notify-to-supvsr-for-applied-leave',
            context: {
                fullName: data.fullName,
                empName: data.empName,
                appliedBy: data.appliedBy,
                leaveType: data.leaveType,
                appliedDate: moment(data.appliedDate).format('L'),
                fromDate: moment(data.fromDate).format('L'),
                toDate: moment(data.toDate).format('L'),
                link: data.action_link
            }
        };
        transporter.sendMail(mailOptions);

    },
    sendEmailToEmployeeNotifyAppliedLeave: (toEmail, data) => {
        let mailOptions = {
            from: config.email.emailToEmployeeForLeaveRequestRejected.from, // sender address
            to: toEmail,
            subject:  data. leaveType + config.email.emailToEmployeeForAppliedLeaveOnBehalf.subject + data.appliedBy, // Subject line
            template: 'email-notify-leave-applied-on-behalf',
            context: {
                fullName: data.fullName,               
                appliedBy: data.appliedBy,
                leaveType: data.leaveType,
                appliedDate: moment(data.appliedDate).format('L'),
                fromDate: moment(data.fromDate).format('L'),
                toDate: moment(data.toDate).format('L'),
                link: data.action_link
            }
        };
        transporter.sendMail(mailOptions);

    },
    sendEmailToEmployeeForLeaveRequestApproved: (toEmail, data) => {
        let mailOptions = {
            from: config.email.emailToEmployeeForLeaveRequestApproved.from, // sender address
            to: toEmail,
            subject: data.leaveType + " " + config.email.emailToEmployeeForLeaveRequestApproved.subject + " " + data.fromDate + " " + data.toDate, // Subject line
            template: 'email-notify-to-emp-for-applied-leave-approved',
            context: {
                fullName: data.fullName,
                leaveType: data.leaveType,
                appliedDate: moment(data.appliedDate).format('L'),
                fromDate: moment(data.fromDate).format('L'),
                toDate: moment(data.toDate).format('L'),
                link: data.action_link
            }
        };
        transporter.sendMail(mailOptions);
    },
    sendEmailToEmployeeForLeaveRequestApprovedOnBehalf: (toEmail, data) => {
        let mailOptions = {
            from: config.email.emailToEmployeeForLeaveRequestApproved.from, // sender address
            to: toEmail,
            subject: data.leaveType + " " + config.email.emailToEmployeeForLeaveRequestApproved.subject + " " + data.fromDate + " " + data.toDate, // Subject line
            template: 'email-notify-to-emp-for-applied-leave-approved-on-behalf',
            context: {
                fullName: data.fullName,
                leaveType: data.leaveType,
                appliedBy:data.appliedBy,
                appliedDate: moment(data.appliedDate).format('L'),
                fromDate: moment(data.fromDate).format('L'),
                toDate: moment(data.toDate).format('L'),
                link: data.action_link
            }
        };
        transporter.sendMail(mailOptions);
    },
    sendEmailToAppliedByForLeaveRequestApproved: (toEmail, data) => {
        let mailOptions = {
            from: config.email.emailTohrForAppliedLeaveApproved.from, // sender address
            to: toEmail,
            subject: config.email.emailTohrForAppliedLeaveApproved.subject + data.fullName +"("+data.empId+") has been approved",
            template: 'email-notify-to-hr-for-applied-leave-approved',
            context: {
                fullName: data.fullName,
                empId:data.empId,
                appliedBy: data.appliedBy,
                leaveType: data.leaveType,
                appliedDate: moment(data.appliedDate).format('L'),
                fromDate: moment(data.fromDate).format('L'),
                toDate: moment(data.toDate).format('L'),
                link: data.action_link
            }
        };
        transporter.sendMail(mailOptions);
    },
    sendEmailToAppliedByForLeaveRequestRejected: (toEmail, data) => {        

        let mailOptions = {
            from: config.email.emailTohrForAppliedLeaveRejected.from, // sender address
            to: toEmail,
            subject:  config.email.emailTohrForAppliedLeaveRejected.subject + data.fullName +"("+data.empId+") is Rejected",
            template: 'email-notify-to-hr-for-applied-leave-rejected',
            context: {
                fullName: data.fullName,
                empId: data.empId,
                appliedBy: data.appliedBy,
                supervisorName: data.supervisorName,
                leaveType: data.leaveType,
                appliedDate: moment(data.appliedDate).format('L'),
                fromDate: moment(data.fromDate).format('L'),
                toDate: moment(data.toDate).format('L'),
                link: data.action_link
            }
        };
        transporter.sendMail(mailOptions);
    },
    sendEmailToEmployeeForLeaveRequestRejected: (toEmail, data) => {
        let mailOptions = {
            from: config.email.emailToEmployeeForLeaveRequestRejected.from, // sender address
            to: toEmail,
            subject: config.email.emailToEmployeeForLeaveRequestRejected.subject, // Subject line
            template: 'email-notify-to-emp-for-applied-leave-rejected',
            context: {
                fullName: data.fullName,
                leaveType: data.leaveType,
                appliedDate: moment(data.appliedDate).format('L'),
                fromDate: moment(data.fromDate).format('L'),
                toDate: moment(data.toDate).format('L'),
                link: data.action_link
            }
        };
        transporter.sendMail(mailOptions);
    },
    sendEmailToEmployeeForLeaveRequestRejectedOnBehalf: (toEmail, data) => {
        let mailOptions = {
            from: config.email.emailToEmployeeForLeaveRequestRejected.from, // sender address
            to: toEmail,
            subject: config.email.emailToEmployeeForLeaveRequestRejected.subject, // Subject line
            template: 'email-notify-to-emp-for-applied-leave-rejected-on-behalf',
            context: {
                fullName: data.fullName,
                leaveType: data.leaveType,
                appliedBy:data.appliedBy,
                appliedDate: moment(data.appliedDate).format('L'),
                fromDate: moment(data.fromDate).format('L'),
                toDate: moment(data.toDate).format('L'),
                link: data.action_link
            }
        };
        transporter.sendMail(mailOptions);
    },
    sendEmailToEmployeeForLeaveCancellationApprove: (toEmail, data) => {
        let mailOptions = {
            from: config.email.emailToEmployeeForLeaveCancellationApprove.from, // sender address
            to: toEmail,
            subject: config.email.emailToEmployeeForLeaveCancellationApprove.subject, // Subject line
            template: 'email-notify-to-emp-for-leave-cancellation-approve',
            context: {
                fullName: data.fullName,
                leaveType: data.leaveType,
                appliedDate: moment(data.appliedDate).format('L'),
                fromDate: moment(data.fromDate).format('L'),
                toDate: moment(data.toDate).format('L'),
                link: data.action_link
            }
        };
        transporter.sendMail(mailOptions);
    },
    sendEmailToEmployeeForLeaveCancellationRejected: (toEmail, data) => {
        let mailOptions = {
            from: config.email.emailToEmployeeForLeaveCancellationRejected.from, // sender address
            to: toEmail,
            subject: config.email.emailToEmployeeForLeaveCancellationRejected.subject, // Subject line
            template: 'email-notify-to-emp-for-leave-cancellation-rejected',
            context: {
                fullName: data.fullName,
                leaveType: data.leaveType,
                appliedDate: moment(data.appliedDate).format('L'),
                fromDate: moment(data.fromDate).format('L'),
                toDate: moment(data.toDate).format('L'),
                link: data.action_link
            }
        };
        transporter.sendMail(mailOptions);
    },
    sendEmailToSuprsvrNotifyWithdrawnLeave: (toEmail, data) => {
        let mailOptions = {
            from: config.email.forget.from, // sender address
            to: toEmail,
            subject: config.email.emailToSupvsrForWithdrawnLeave.subject + data.empName, // Subject line
            template: 'email-notify-to-supvsr-for-withdrawn-leave',
            context: {
                fullName: data.fullName,
                empName: data.empName,
                leaveType: data.leaveType,
                appliedDate: moment(data.appliedDate).format('L'),
                fromDate: moment(data.fromDate).format('L'),
                toDate: moment(data.toDate).format('L'),
                link: data.action_link
            }
        };
        transporter.sendMail(mailOptions);

    },
    sendEmailToSuprsvrNotifyCancelLeave: (toEmail, data) => {
        let mailOptions = {
            from: config.email.forget.from, // sender address
            to: toEmail,
            subject: config.email.emailToSupvsrForCancelLeave.subject + data.empName, // Subject line
            template: 'email-notify-to-supvsr-for-leave-cancellation',
            context: {
                fullName: data.fullName,
                empName: data.empName,
                leaveType: data.leaveType,
                appliedDate: moment(data.appliedDate).format('L'),
                fromDate: moment(data.fromDate).format('L'),
                toDate: moment(data.toDate).format('L'),
                link: data.action_link
            }
        };
        transporter.sendMail(mailOptions);

    },
    sendEmailToHRNotifyCancelLeave: (toEmail, data) => {
        let mailOptions = {
            from: config.email.forget.from, // sender address
            to: toEmail,
            subject: config.email.emailToHRForCancelLeave.subject + data.empName +"("+data.empId+")", // Subject line
            template: 'email-notify-to-hr-for-leave-cancellation',
            context: {
                fullName: data.fullName,
                empName: data.empName,
                empId:data.empId,
                leaveType: data.leaveType,
                appliedDate: moment(data.appliedDate).format('L'),
                fromDate: moment(data.fromDate).format('L'),
                toDate: moment(data.toDate).format('L'),
                link: data.action_link
            }
        };
        transporter.sendMail(mailOptions);

    },
    sendEmailToHRNotifyCancelLeaveRejected: (toEmail, data) => {
        let mailOptions = {
            from: config.email.forget.from, // sender address
            to: toEmail,
            subject: config.email.emailToHRForCancelLeave.subject + data.empName +"("+data.empId+")", // Subject line
            template: 'email-notify-to-hr-for-leave-cancellation-rejected',
            context: {
                fullName: data.fullName,
                empName: data.empName,
                empId:data.empId,
                leaveType: data.leaveType,
                appliedDate: moment(data.appliedDate).format('L'),
                fromDate: moment(data.fromDate).format('L'),
                toDate: moment(data.toDate).format('L'),
                link: data.action_link
            }
        };
        transporter.sendMail(mailOptions);

    },
    sendEmailToSupervisorToApproveMtr: (data, callback) => {
        if(data.supervisor_email === null ||data.supervisor_email === "") {
            return 
        }
        let mailOptions = {
            from: config.email.sendEmailToSupervisorToApproveMtr.from, // sender address
            to: data.supervisor_email,
            subject: config.email.sendEmailToSupervisorToApproveMtr.subject, // Subject line
            template: 'email-notify-to-supvsr-for-mtr-approve',
            context: {
                fullName: data.supervisor_name,
                appliedDate: moment(new Date()).format('L'),
                link: data.action_link,
                empName: data.user_name
            }
        };
        transporter.sendMail(mailOptions, callback);
    },
    sendEmailToUserAboutMtrStatus: (data, callback) => {
        if(data.user_email === null ||data.user_email === "") {
            return 
        }
        let mailOptions = {
            from: config.email.sendEmailToEmployeeForMtrStatus.from, // sender address
            to: data.user_email,
            subject: config.email.sendEmailToEmployeeForMtrStatus.subject, // Subject line
            template: 'email-notify-to-emp-for-mtr-status',
            context: {
                fullName: data.supervisor_name,
                appliedDate: moment(new Date()).format('L'),
                link: data.action_link,
                empName: data.user_name,
                isApproved: data.isApproved
            }
        };
        transporter.sendMail(mailOptions, callback);
    }


}

module.exports = functions;