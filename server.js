const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'assets')));

// Serve HTML files from the root directory
app.use(express.static(__dirname));

// Handle POST requests to /send
app.post('/send', (req, res) => {
    const { name, email, message } = req.body;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'vanishjr.test@gmail.com',
            pass: 'tdxq tnay rutv xxyd' 
        }
    });

    const mailOptions = {
        from: email, 
        to: 'vanishjr.test@gmail.com',
        subject: `Message from ${name}`,
        text: message
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send(error.toString());
        }
        res.send('Message sent: ' + info.response);
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
