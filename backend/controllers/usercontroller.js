import User from '../models/user.js';
import bcrypt from 'bcryptjs';

export const registerUser = async (req, res) => {
  try {
    const { name, email, mobile, location, gender, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      mobile,
      location,
      gender,
      password: hashedPassword, role: role || 'user'
    });

    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
