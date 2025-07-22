var mongo = require('mongodb');
var objSchema = require('../models/report.model');
// Import Information_Accounts model to register it for populate
require('../../accounts/models/admin.model');

exports.onQuery = async function (query) {
    return new Promise((resolve, reject) => {
        objSchema
            .findOne(query)
            // .sort("coin")
            .populate([
                { path: 'type', select: 'title description' },
                { path: 'level', select: 'title description' },
                { path: 'status', select: 'title description' },
                { path: 'tracking.status', select: 'title description' },
                { path: 'tracking.by', select: 'userInfo.firstName userInfo.lastName authen.email', options: { strictPopulate: false } },
                { path: 'user', select: 'title description' } // <-- เพิ่มบรรทัดนี้
            ])
            .lean()
            .exec(function (err, doc) {
                err ? reject(err) : resolve(doc);
            })
    });
}
exports.onQuerys = async function (query) {
    return new Promise((resolve, reject) => {
        objSchema
            .find(query)
            .sort({_id:-1})
            .populate([
                { path: 'type', select: 'title description' },
                { path: 'level', select: 'title description' },
                { path: 'status', select: 'title description' },
                { path: 'tracking.status', select: 'title description' },
                { path: 'tracking.by', select: 'userInfo.firstName userInfo.lastName authen.email', options: { strictPopulate: false } },
                { path: 'user', select: 'title description' } // <-- เพิ่มบรรทัดนี้
            ])
            .lean()
            .exec(function (err, doc) {
                err ? reject(err) : resolve(doc);
            })
    });
}

exports.onCreate = async function (data) {
    // Fix: parse media if it's a string
    if (typeof data.media === 'string') {
        try {
            data.media = JSON.parse(data.media);
        } catch (e) {
            data.media = [];
        }
    }
    return new Promise((resolve, reject) => {
        var objSchemas = new objSchema(data);
        objSchemas.save(function (err, doc) {
            err ? reject(err) : resolve(doc);
        });
    });
}

exports.onCreateMany = async function (data) {

    return new Promise((resolve, reject) => {
        objSchema.insertMany(data, function (err, docs) {
            err ? reject(err) : resolve(docs);
        });
    });
};

exports.onUpdate = async function (query,data) {
    return new Promise((resolve, reject) => {
        objSchema
            .findOneAndUpdate(query, data, { new: true, returnOriginal: false, upsert: true })
            .populate([
                // {path : "address.province"},
                // {path : "address.district"},
                // {path : "bankInfo.bankName"}
            ])
            .lean()
            .exec(function (err, doc) {
                err ? reject(err) : resolve(doc);
            });
    });
}

exports.onUpdateMany = async function (filter, query) {

    return new Promise((resolve, reject) => {
        objSchema
            .updateMany(filter,query)
            .exec(function (err, doc) {
                err ? reject(err) : resolve(doc);
            });
    });
}

exports.onDelete = async function (query) {

    return new Promise((resolve, reject) => {
        objSchema
            .deleteOne(query)
            .exec(function (err, doc) {
                err ? reject(err) : resolve(doc);
            });
    });
}

exports.onDeleteMany = async function (query) {

    return new Promise((resolve, reject) => {
        objSchema
            .deleteMany(query)
            .exec(function (err, doc) {
                err ? reject(err) : resolve(doc);
            });
    });
}

// Disaster Report specific methods
exports.onCreateReport = async function (data) {
    return new Promise(async (resolve, reject) => {
        try {
            // Validate required fields
            if (!data.description || data.description.trim() === '') {
                return reject(new Error('ไม่มีรายละเอียดภัยพิบัติ'));
            }

            if (!data.type) {
                return reject(new Error('ไม่ระบุประเภทภัยพิบัติ'));
            }

            if (!data.level) {
                return reject(new Error('ไม่ระบุระดับความรุนแรง'));
            }

            // Create new report with all fields
            const newReport = new objSchema({
                type: data.type,
                user: data.user, // <--- เพิ่มบรรทัดนี้เพื่อบันทึก userType
                level: data.level,
                description: data.description,
                reasoning: data.reasoning || '',
                location: data.location || {
                    type: "Point",
                    coordinates: [0, 0]
                },
                media: data.media || [],
                contact: data.contact || {},
                timeStamps: data.timeStamps || new Date(),
                tracking: data.tracking || [],
                assets: data.assets || [],
                status: data.status
            });

            const savedReport = await newReport.save();
            
            // Populate the saved report with related data
            const populatedReport = await objSchema
                .findById(savedReport._id)
                .populate([
                    { path: 'type', select: 'title description' },
                    { path: 'level', select: 'title description' },
                    { path: 'status', select: 'title description' },
                    { path: 'tracking.status', select: 'title description' },
                    { path: 'tracking.by', select: 'userInfo.firstName userInfo.lastName authen.email', options: { strictPopulate: false } },
                    { path: 'user', select: 'title description' } // <-- เพิ่มบรรทัดนี้
                ])
                .lean();

            resolve(populatedReport);
        } catch (error) {
            reject(error);
        }
    });
};

exports.onQueryReport = async function () {
    return new Promise((resolve, reject) => {
        objSchema
            .find({})
            .populate([
                { path: 'type', select: 'title description' },
                { path: 'level', select: 'title description' },
                { path: 'status', select: 'title description' },
                { path: 'tracking.status', select: 'title description' },
                { path: 'tracking.by', select: 'userInfo.firstName userInfo.lastName authen.email', options: { strictPopulate: false } },
                { path: 'user', select: 'title description' } // <-- เพิ่มบรรทัดนี้
            ])
            .sort({ createdAt: -1 })
            .lean()
            .exec(function (err, docs) {
                err ? reject(err) : resolve(docs);
            });
    });
};