export const MAX_FILE_SIZE_MB = 20;

export const isFileSizeValid = (file: File, maxMB = MAX_FILE_SIZE_MB) => {
    const maxBytes = maxMB * 1024 * 1024;
    return file.size <= maxBytes;
};

export const filterValidFiles = (
    files: File[],
    maxMB = MAX_FILE_SIZE_MB
) => {
    const valid: File[] = [];
    const invalid: File[] = [];

    files.forEach((file) => {
        if (isFileSizeValid(file, maxMB)) {
            valid.push(file);
        } else {
            invalid.push(file);
        }
    });

    return { valid, invalid };
};