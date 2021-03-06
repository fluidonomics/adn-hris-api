let express = require('express'),
    nodemailer = require('nodemailer'),
    hbs = require('nodemailer-express-handlebars'),
    uuidV1 = require('uuid/v1'),
    config = require('../config/config');
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
        }
    }

module.exports = functions;