const mongoose = require("mongoose")
const userScheme = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true  //obliga que el email sea unico en base de datos.
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["user", "admin", "autonomo"],
        default: "user"
    }
    ,
    codigo: {
        type: Number,
        default: 0

    },
    status: {
        type: Boolean,
        default: false
    },
    attemps: {
        type: Number,
        default: 0
    },
    // NUEVOS CAMPOS PARA EL PASO 4
    // Se llenará en el onboarding por lo cual no deben ser requeridos
    name: {
        type: String,
        required: false
    },
    surnames: {
        type: String,
        required: false
    },
    nif: {
        type: String,
        required: false,
        unique: true // No debería haber dos usuarios con el mismo NIF
    },
    deleted: {  //AÑADIDO PARA EL PASO 6 -SOFT/HARD DELETE
        type: Boolean, 
        default: false 
    },
    //Información de la empresa
    company: {
        name: { type: String, required: false },
        cif: { type: String, required: false, unique: true }, //el cif debe ser unico, el DNI de una empresa basicamente
        street: { type: String, required: false },
        number: { type: Number, required: false },
        postal: { type: Number, required: false },
        city: { type: String, required: false },
        province: { type: String, required: false },
        logo: { type: String, required: false }// NUEVO CAMPO PARA EL PASO 5
    }
},

    {
        timestamps: true,
        versionKey: false
    }
)

module.exports = mongoose.model("user", userScheme) 