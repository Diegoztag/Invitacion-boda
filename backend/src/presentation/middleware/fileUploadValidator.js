/**
 * Middleware para validar la carga de archivos.
 */
import multer from 'multer';
import { ValidationException } from '../../shared/exceptions/ValidationException.js';

const fileUploadValidator = options => {
    const {
        allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'],
        maxSize = 5 * 1024 * 1024 // 5 MB
    } = options;

    const upload = multer({
        limits: {
            fileSize: maxSize
        },
        fileFilter: (req, file, cb) => {
            if (allowedMimeTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(
                    new ValidationException(
                        'FILE_TYPE_NOT_ALLOWED',
                        'Tipo de archivo no permitido.'
                    ),
                    false
                );
            }
        }
    });

    return (req, res, next) => {
        upload.single('file')(req, res, err => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return next(
                        new ValidationException(
                            'FILE_TOO_LARGE',
                            `El archivo excede el tamaño máximo de ${maxSize / 1024 / 1024}MB.`
                        )
                    );
                }
                return next(new ValidationException('FILE_UPLOAD_ERROR', err.message));
            } else if (err) {
                return next(err);
            }
            next();
        });
    };
};

export default fileUploadValidator;
