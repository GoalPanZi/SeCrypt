const fs = require('fs');
const path = require('path');

const createDirectories = () => {
  const dirs = [
    'uploads',
    'encrypted', 
    'logs'
  ];
  
  dirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
};

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    return true;
  }
  return false;
};

const removeFile = async (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error removing file ${filePath}:`, error);
    return false;
  }
};

module.exports = {
  createDirectories,
  ensureDir,
  removeFile
};