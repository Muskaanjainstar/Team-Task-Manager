// routes/projects.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// Get all projects for user
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT p.*, u.name as owner_name 
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.owner_id = $1 OR pm.user_id = $1
      ORDER BY p.created_at DESC
    `, [req.user.id]);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create project
router.post('/', [
  body('name').notEmpty().trim(),
  body('description').optional().trim(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description, req.user.id]
    );
    
    // Add owner as member
    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [result.rows[0].id, req.user.id, 'admin']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get project members
router.get('/:id/members', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, pm.role
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = $1
    `, [req.params.id]);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add member to project
router.post('/:id/members', [
  body('email').isEmail(),
  body('role').optional().isIn(['admin', 'member']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, role = 'member' } = req.body;

  try {
    // Check if user exists
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already a member
    const existing = await pool.query(
      'SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2',
      [req.params.id, userResult.rows[0].id]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'User already a member' });
    }

    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [req.params.id, userResult.rows[0].id, role]
    );
    
    res.status(201).json({ message: 'Member added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;