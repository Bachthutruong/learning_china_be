import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import BlogPost from '../models/BlogPost';
import User from '../models/User';

// Get all blog posts (public - only published)
export const getBlogPosts = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    let query: any = { status: 'published' };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } }
      ];
    }

    const posts = await BlogPost.find(query)
      .populate('author', 'name email')
      .sort({ publishedAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .select('-__v');

    const total = await BlogPost.countDocuments(query);

    res.json({
      posts,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      total
    });
  } catch (error) {
    console.error('Get blog posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single blog post by ID or slug
export const getBlogPost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    let post;
    if (mongoose.Types.ObjectId.isValid(id)) {
      post = await BlogPost.findById(id).populate('author', 'name email');
    } else {
      post = await BlogPost.findOne({ slug: id, status: 'published' })
        .populate('author', 'name email');
    }

    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    // Increment views
    post.views += 1;
    await post.save();

    res.json(post);
  } catch (error) {
    console.error('Get blog post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Get all blog posts (including drafts)
export const getAllBlogPosts = async (req: any, res: Response) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    
    let query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } }
      ];
    }

    const posts = await BlogPost.find(query)
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .select('-__v');

    const total = await BlogPost.countDocuments(query);

    res.json({
      posts,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      total
    });
  } catch (error) {
    console.error('Get all blog posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Get single blog post by ID
export const getBlogPostById = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    
    const post = await BlogPost.findById(id).populate('author', 'name email');

    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error('Get blog post by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Create blog post
export const createBlogPost = async (req: any, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      content,
      excerpt,
      featuredImage,
      status,
      tags
    } = req.body;

    // Handle file upload if present
    let featuredImageUrl = featuredImage;
    if (req.files && req.files.image && req.files.image[0]) {
      featuredImageUrl = req.files.image[0].path; // Cloudinary URL
    }

    // Generate excerpt from content if not provided
    let finalExcerpt = excerpt;
    if (!finalExcerpt && content) {
      // Remove HTML tags and get first 200 characters
      const textContent = content.replace(/<[^>]*>/g, '').substring(0, 200);
      finalExcerpt = textContent + (textContent.length >= 200 ? '...' : '');
    }

    const post = new BlogPost({
      title,
      content,
      excerpt: finalExcerpt,
      featuredImage: featuredImageUrl,
      author: req.user._id,
      status: status || 'draft',
      tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : []
    });

    await post.save();
    
    const populatedPost = await BlogPost.findById(post._id)
      .populate('author', 'name email');

    res.status(201).json({
      message: 'Blog post created successfully',
      post: populatedPost
    });
  } catch (error) {
    console.error('Create blog post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Update blog post
export const updateBlogPost = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      content,
      excerpt,
      featuredImage,
      status,
      tags
    } = req.body;

    // Handle file upload if present
    let featuredImageUrl = featuredImage;
    if (req.files && req.files.image && req.files.image[0]) {
      featuredImageUrl = req.files.image[0].path; // Cloudinary URL
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (featuredImageUrl) updateData.featuredImage = featuredImageUrl;
    if (status) updateData.status = status;
    if (tags) {
      updateData.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    }

    // If status is being changed to published, set publishedAt
    if (status === 'published') {
      const existingPost = await BlogPost.findById(id);
      if (existingPost && existingPost.status !== 'published') {
        updateData.publishedAt = new Date();
      }
    }

    const post = await BlogPost.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'name email');

    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    res.json({
      message: 'Blog post updated successfully',
      post
    });
  } catch (error) {
    console.error('Update blog post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Delete blog post
export const deleteBlogPost = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    
    const post = await BlogPost.findByIdAndDelete(id);

    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Delete blog post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

