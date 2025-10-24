// backend/controllers/workercontroller.js
import Worker from '../models/worker.js';
import bcrypt from 'bcryptjs';

export const registerWorker = async (req, res) => {
  try {
    const {
      name, email, mobile, skills, age, location,
      experience, gender, profilePicture, password
    } = req.body;

    const existingWorker = await Worker.findOne({ email });
    if (existingWorker) {
      return res.status(400).json({ error: 'Worker already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const worker = new Worker({
      name, email, mobile, skills, age, location,
      experience, gender, profilePicture, password: hashedPassword
    });

    await worker.save();
    res.status(201).json({ message: 'Worker registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
