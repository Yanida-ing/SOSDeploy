const rateLimit = require('express-rate-limit');

// ตัวแปรเก็บสถานะของ IP ที่ถูกบล็อก (ใช้ Map หรือ Redis เพื่อความปลอดภัยในระบบ production)
const blockedIPs = new Map(); // ใช้ Map เพื่อจัดเก็บ IP ที่ถูกบล็อก

// ฟังก์ชันสำหรับบล็อก IP
const blockIP = (ip, duration) => {
    blockedIPs.set(ip, Date.now() + duration); // เพิ่ม IP ลงใน Map พร้อมกำหนดเวลาปลดบล็อก
};

// ฟังก์ชันตรวจสอบว่า IP ถูกบล็อกอยู่หรือไม่
const isBlocked = (ip) => {
    const unblockTime = blockedIPs.get(ip);
    if (unblockTime && Date.now() < unblockTime) {
        return true; // ยังคงถูกบล็อก
    } else {
        blockedIPs.delete(ip); // ลบ IP ออกจาก Map หากปลดบล็อกแล้ว
        return false;
    }
};

// การตั้งค่า Rate Limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // กำหนดเวลาต่อรอบ 15 นาที
    max: 100, // จำกัดจำนวน request ที่อนุญาต
    handler: (req, res) => {
        const ip = req.ip; // ดึง IP ของผู้ใช้
        blockIP(ip, 15 * 60 * 1000); // บล็อก IP เป็นเวลา 15 นาที
        res.status(429).json({
            message: 'Too many requests from this IP. You have been temporarily blocked.',
        });
    },
});

// Middleware ตรวจสอบ IP ที่ถูกบล็อก
const blockMiddleware = (req, res, next) => {
    const ip = req.ip; // ดึง IP ของผู้ใช้
    if (isBlocked(ip)) {
        res.status(403).json({
            message: 'Access denied. Your IP has been temporarily blocked.',
        });
    } else {
        next(); // หาก IP ไม่ถูกบล็อก ให้ทำงานต่อไป
    }
};



module.exports = { limiter, blockMiddleware };
