const path = require('path');
const multer = require('multer');

const extensionesPermitidas = new Set(['.jpg', '.jpeg', '.png', '.pdf', '.docx', '.xlsx', '.csv']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, process.env.UPLOAD_PATH || 'src/uploads/evidencias');
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const limpio = file.originalname.replace(/\s+/g, '-').toLowerCase();
    cb(null, `${timestamp}-${limpio}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!extensionesPermitidas.has(ext)) {
      return cb(new Error('Tipo de archivo no permitido'));
    }

    return cb(null, true);
  }
});

module.exports = { upload };

