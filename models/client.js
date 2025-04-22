const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    cif: {
        type: String,
        required: true, unique: true
    },
    email: {
        type: String

    },
    phone: {
        type: String

    },
    address: {
        type: String
    },
    archived: {
        type: Boolean,
        default: false
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true }
}, {
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model("client", clientSchema);
