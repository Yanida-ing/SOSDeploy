const express = require('express');
// ลบ express-session
// const session = require('express-session');
const bodyParser = require("body-parser");
const nocache = require("nocache");
const nosniff = require("dont-sniff-mimetype");
const xssFilter = require("x-xss-protection");
const ienoopen = require("ienoopen");
const compression = require("compression");
const morgan = require("morgan");
const sass = require("node-sass-middleware");
const expressValidator = require('express-validator');
const rateLimit = require('express-rate-limit');
const path = require("path");
const cors = require('cors');

const { corsOptions, ipCheckMiddleware } = require('../config/corsAndIP');
const { limiter, blockMiddleware } = require('../config/rateLimit');

// Import logger
const  loggerMiddleware  = require('../config/logger');

module.exports = function (app) {
    // ===== ลบ express-session middleware =====
    // app.use(session({
    //   secret: process.env.SESSION_SECRET || 'your-secret-key',
    //   resave: false,
    //   saveUninitialized: true,
    //   cookie: { maxAge: 60 * 60 * 1000 } // 1 ชั่วโมง
    // }));

    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ limit: '10mb', extended: true }));

    app.use(compression());

    // ใช้ CORS middleware ทุกโหมด
    app.use(cors(corsOptions));
    app.options('*', cors(corsOptions));

    if (process.env.NODE_ENV === 'production') {
        app.use(blockMiddleware); // ตรวจสอบ IP ก่อน
        app.use(limiter); // ใช้ rate limiter หลังจากตรวจสอบ IP
        app.use(ipCheckMiddleware);
        app.use(morgan('combined')); // ใช้ log format ที่เหมาะสม
    } else {
        app.use(morgan('dev')); // ใช้ log format สำหรับ development
    }

    // การใช้งาน logger ใน Express
    app.use(loggerMiddleware);

    app.use(expressValidator());
    app.disable("x-powered-by");
    app.use(ienoopen());
    app.use(nocache());
    app.use(nosniff());
    app.use(xssFilter());

    app.use(sass({ src: "./sass", dest: "./public/css", debug: true, outputStyle: "compressed" }));
    app.use(express.static(path.join(__dirname, "./public")));
    app.use(express.static(path.join(__dirname, "../node_modules/bootstrap/dist")));

    // Handle errors
    app.use((err, req, res, next) => {
        console.error(err);
        res.status(500).send({ message: "Internal Server Error" });
    });
};
