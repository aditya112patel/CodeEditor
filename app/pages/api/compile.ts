import type { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

// Set up multer to handle file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

const execAsync = promisify(exec);
const unlinkAsync = promisify(fs.unlink);

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadMiddleware = upload.single('cppFile');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await new Promise((resolve, reject) => {
    uploadMiddleware(req as any, res as any, (err: any) => {
      if (err) return reject(err);
      resolve(null);
    });
  });

  const code = req.body.code;
  let filePath: string;

  if (code) {
    filePath = path.join(process.cwd(), 'uploads', 'temp.cpp');
    await fs.promises.writeFile(filePath, code);
  } else if (req.file) {
    const fileExtension = path.extname(req.file.originalname);
    if (fileExtension !== '.cpp') {
      return res.status(400).json({ error: 'File must be a .cpp file' });
    }
    filePath = path.join(process.cwd(), req.file.path);
  } else {
    return res.status(400).json({ error: 'No code or file uploaded' });
  }

  const outputFileName = `${filePath}.out`;

  try {
    console.log(`Compiling file: ${filePath}`); // Log for debugging

    // Compile the C++ file
    const { stdout, stderr } = await execAsync(`g++ "${filePath}" -o "${outputFileName}"`);

    if (stderr) {
      throw new Error(stderr);
    }

    console.log(`Execution output file path: ${outputFileName}`); // Log for debugging

    // Execute the compiled file
    const { stdout: executionOutput, stderr: executionError } = await execAsync(`"${outputFileName}"`);

    if (executionError) {
      throw new Error(executionError);
    }

    res.status(200).json({ output: executionOutput });

  } catch (error: any) {
    console.error('Error:', error); // Log error for debugging
    res.status(500).json({ error: error.message });
  } finally {
    // Clean up files
    try {
      await unlinkAsync(filePath);
      await unlinkAsync(outputFileName);
    } catch (err) {
      console.error('Error cleaning up files:', err);
    }
  }
}
