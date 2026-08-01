import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import multer from 'multer';
import { MAX_UPLOAD_LABEL } from './uploads';

// Multer aborts an oversized upload with a MulterError (LIMIT_FILE_SIZE) before
// the whole file is buffered into memory. Without this filter Nest surfaces that
// as a 500; here we translate it into a clean 400 the client can show, matching
// the { statusCode, message, error } shape the rest of the API returns.
@Catch(multer.MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: { code?: string; message?: string }, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const message =
      exception?.code === 'LIMIT_FILE_SIZE'
        ? `File is too large. Please choose a file under ${MAX_UPLOAD_LABEL}.`
        : `Upload failed: ${exception?.message ?? 'invalid file'}`;

    res.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message,
      error: 'Bad Request',
    });
  }
}
