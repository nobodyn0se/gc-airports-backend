import logger from '../middleware/logger.mjs';
import path from 'path';
import { promises as fs } from 'fs';

const readFileData = async (FILE_PATH, file_type) => {
  try {
    await fs.access(FILE_PATH);
    logger.info(`Trying to read from existing local ${file_type} file...`);

    return await fs.readFile(FILE_PATH, 'utf8');
  } catch (readError) {
    logger.error(readError);
  }
};

const writeFileData = async (FILE_PATH, file_type, fileData) => {
  const uploadsDir = path.dirname(FILE_PATH);
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    logger.info('Local uploads directory detected. Saving data...');

    await fs.writeFile(FILE_PATH, fileData, 'utf8');
    logger.info(`${file_type} data saved to local file`);
  } catch (dirError) {
    logger.error(dirError);
  }
};

export { readFileData, writeFileData };
