const nodemailer = require("nodemailer");

// async..await is not allowed in global scope, must use a wrapper
export default async function mandarMail(to:string[],subject:string,text:string,html:string) {
    try{
        // Generate test SMTP service account from ethereal.email

        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            host: "smtp-mail.outlook.com",
            secureConnection: false, // TLS requires secureConnection to be false
            requireTLS:true,//this parameter solved problem for me
            port: 587,
            tls: {
                ciphers:'SSLv3'
            },
            secure: false, // true for 465, false for other ports
            method:"GET",
            auth: {
            user: "sistema-universidad-avisos@hotmail.com", // sender user
            pass: "gtBQX.nC/e4B2D2", // sender password
            connectionTimeout: 5 * 60 * 1000, // 5 min
            },
        });

        for (let i = 0; i < to.length; i++) {
            // send mail with defined transport object
            let info = await transporter.sendMail({
                from: "sistema-universidad-avisos@hotmail.com", // sender address
                to: to[i], // list of receivers
                subject: subject, // Subject line
                text: text, // plain text body
                html: html, // html body
            });

            console.log("Message sent: %s", info.messageId);
            // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

            // Preview only available when sending through an Ethereal account
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
            // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
        }

    }catch(error){
        console.log(error);
    }
}