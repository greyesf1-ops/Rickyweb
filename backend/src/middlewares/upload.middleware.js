const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const tiposPermitidos = new Map([
  ['.jpg', new Set(['image/jpeg'])],
  ['.jpeg', new Set(['image/jpeg'])],
  ['.png', new Set(['image/png'])],
  ['.pdf', new Set(['application/pdf'])],
  ['.docx', new Set(['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip'])],
  ['.xlsx', new Set(['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/zip'])],
  ['.csv', new Set(['text/csv', 'application/csv', 'text/plain', 'application/vnd.ms-excel'])]
]);
const destino = path.resolve(process.env.UPLOAD_PATH || path.join(__dirname, '..', 'uploads', 'evidencias'));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, destino);
  },
  filename: (_req, file, cb) => {
    cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!tiposPermitidos.has(ext) || !tiposPermitidos.get(ext).has(file.mimetype)) {
      return cb(new Error('Tipo de archivo no permitido'));
    }

    return cb(null, true);
  }
});

module.exports = { upload, destino, tiposPermitidos };
