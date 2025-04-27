const mongoose = require("mongoose");

const deliverynoteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user", required: true
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "client", required: true
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "project", required: true
    },
    description: {
        type: String
    },
    materials: [
        {
            description: { type: String },
            quantity: { type: Number },
            unit: { type: String },
            price: { type: Number }
        }
    ],
    hours: [
        {
            worker: { type: String },
            hours: { type: Number },
            pricePerHour: { type: Number }
        }
    ],
    totalCost: {
        type: Number
    },
    signed: {
        type: Boolean, default: false
    },
    signatureUrl: {
        type: String
    }, // IPFS o URL de nube
    archived: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model("deliverynote", deliverynoteSchema);
