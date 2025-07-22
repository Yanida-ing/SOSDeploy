// middlewares/corsAndIP.js
const cors = require('cors');

// กำหนดโดเมนและ IP ที่อนุญาต
const allowedDomains = ['https://example.com', 'https://anotherdomain.com'];
const allowedIPs = ['192.168.1.1', '203.0.113.5','127.0.0.1'];

// การตั้งค่า CORS
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedDomains.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};

// ฟังก์ชัน middleware สำหรับการตรวจสอบ IP ที่อนุญาต
const ipCheckMiddleware = (req, res, next) => {

    const userIP = req.ip.replace('::ffff:', '') || req.connection.remoteAddress;
    if (allowedIPs.includes(userIP)) {
        next();
    } else {
        res.status(403).send('Access Denied');
    }
};

module.exports = { corsOptions, ipCheckMiddleware };
