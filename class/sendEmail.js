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
            subject: data.leaveType + " " + config.email.emailToEmployeeForLeaveRequestApproved.subject + " " + data.formDate + " " + data.toDate, // Subject line
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
    sendEmailToEmployeeForMaternityLeaveQuotaProvided: (data) => {
        let mailOptions = {
            from: config.email.emailToEmployeeForLeaveRequestRejected.from, // sender address
            to: data.userEmail,
            subject: config.email.emailToEmployeeForLeaveRequestRejected.subject, // Subject line
            template: 'email-notify-to-emp-for-applied-leave-rejected',
            context: {
                fullName: data.fullName,
                leaveType: 'Maternity Leave',
                appliedDate: moment(new Date()).format('L'),
                fromDate: moment(data.startDate).format('L'),
                toDate: moment(data.endDate).format('L'),
                link: data.action_link
            }
        };
        transporter.sendMail(mailOptions, function(err, response) {
            if(err) {
                return err;
            } else {
                return response;
            }
        });
    }

}

module.exports = functions;