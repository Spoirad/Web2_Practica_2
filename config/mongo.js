const mongoose = require("mongoose");
require("dotenv").config();

const dbConnect = async () => {
  const uri = process.env.NODE_ENV === "test" 
    ? process.env.DB_URI_TEST 
    : process.env.DB_URI;

  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`✅ Conectado a la base de datos ${process.env.NODE_ENV === "test" ? "de testing" : "principal"}`);
  } catch (err) {
    console.error("❌ Error conectando a la base de datos:", err);
  }
};

module.exports = dbConnect;