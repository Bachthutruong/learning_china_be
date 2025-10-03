import { Request, Response } from 'express';
import PaymentConfig from '../models/PaymentConfig';
import { validationResult } from 'express-validator';

// Get payment configuration
export const getPaymentConfig = async (req: any, res: Response) => {
  try {
    const config = await PaymentConfig.findOne({ isActive: true });
    if (!config) {
      return res.status(404).json({ message: 'Payment configuration not found' });
    }
    
    res.json({ config });
  } catch (error) {
    console.error('Get payment config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create or update payment configuration (admin only)
export const createOrUpdatePaymentConfig = async (req: any, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tw, vn } = req.body;
    
    // Deactivate current config if exists
    await PaymentConfig.updateMany({ isActive: true }, { isActive: false });
    
    // Create new config
    const config = new PaymentConfig({ tw, vn, isActive: true });
    
    await config.save();
    
    res.json({
      message: 'Payment configuration updated successfully',
      config
    });
  } catch (error) {
    console.error('Create/update payment config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all payment configurations (admin only)
export const getAllPaymentConfigs = async (req: any, res: Response) => {
  try {
    const configs = await PaymentConfig.find().sort({ createdAt: -1 });
    
    res.json({ configs });
  } catch (error) {
    console.error('Get all payment configs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
