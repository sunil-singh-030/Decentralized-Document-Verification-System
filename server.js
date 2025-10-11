const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path'); // ✅ required to serve HTML

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// ✅ Serve HTML from public folder
app.use(express.static(path.join(__dirname, 'public')));

const otpStore = {};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'sunilsinghj04@gmail.com',
        pass: 'uvgp btzv axca zalr'
    }
});

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

app.post('/send-otp', async (req, res) => {
    const { email } = req.body;
    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    otpStore[email] = { otp, expiresAt };

    const mailOptions = {
        from: 'sunilsinghj04@gmail.com',
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP is ${otp}. It will expire in 5 minutes.`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'OTP sent!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Email send failed', error });
    }
});

app.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    const record = otpStore[email];

    if (!record) return res.json({ success: false, message: 'No OTP requested.' });
    if (Date.now() > record.expiresAt) return res.json({ success: false, message: 'OTP expired' });
    if (record.otp !== otp) return res.json({ success: false, message: 'Incorrect OTP please try again !' });

    delete otpStore[email];
    res.json({ success: true, message: 'OTP verified!' });
});

app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
