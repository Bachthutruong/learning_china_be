import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { validationResult } from 'express-validator';

const generateToken = (userId: string) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET || "42efe91fb379e199daabd7637640a03125b3173d33f0d5c437f8dee5f1c2d8771474cb754851434a5d5c62aecbda1ffdcf343b4813743f130a23b67afa331e6a3c59aa1fc0a4e20978778b56859f62071e9efa9edb4ce12bd69ea9bf0232165f227eedf32da81c207eef3a81b0bf39f4bcb9d36dfbb923b48eb0a7129f8e1a052f4dd7b6d7edfa25894b68217056b69270608cdbc41efcc0732ded697a7bafe9ad67d993aa30cc87d3d6ade051faf9e8967df71330e9fc716828cb030a68f0b619b8f249d096de632867c4d22fa84e506ba0ad4cedc40e2d888c8adc6c39bf05a5b7e5a0e216a3b16770431d0ac0c05058d990067e3d6a672a06caa621e97818", 
    { expiresIn: 7 * 24 * 60 * 60 } // 7 days in seconds
  );
};

export const register = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      name
    });

    await user.save();

    const token = generateToken((user._id as any).toString());

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        level: user.level,
        experience: user.experience,
        coins: user.coins,
        streak: user.streak
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken((user._id as any).toString());

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        level: user.level,
        experience: user.experience,
        coins: user.coins,
        streak: user.streak
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProfile = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req: any, res: Response) => {
  try {
    const { name } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
