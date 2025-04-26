const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    address: {
        type: String
    },
    postalCode: {
        type: String
    },
    city: {
        type: String
    },
    archived: {
        type: Boolean,
        default: false
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "client", required: true
    }, //cliente del proyecto como tal
    owner: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "user", required: true
    },// usuario que crea el proyecto
    companyCIF: {
        type: String
    } // Para poder asociar a la empresa
}, {
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model("project", projectSchema);
