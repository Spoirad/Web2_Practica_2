const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    cif: {
        type: String,
        required: true,
        unique: true
    },
    archived: {
        type: Boolean,
        default: false
    },
    companyCIF: {
        type: String
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    }
}, {
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model("client", clientSchema);
