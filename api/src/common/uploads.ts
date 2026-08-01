// Single source of truth for upload size limits. Applied both as a hard multer
// cap (rejects oversized uploads before they're fully buffered into memory) and
// as a defence-in-depth check in the services after the file is received.
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB
export const MAX_UPLOAD_LABEL = '2 MB';

/** Multer options shared by every file-upload endpoint. */
export const uploadLimits = {
  limits: { fileSize: MAX_UPLOAD_BYTES },
};
