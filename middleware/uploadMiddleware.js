const multer = require('multer');

const storage = multer.memoryStorage(); // Guarda en memoria
const upload = multer({ storage });

module.exports = { upload };
