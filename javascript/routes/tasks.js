// routes/tasks.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// Get tasks with filters
router.get('/', async (req, res) => {
  const { status, project_id, assigned_to } = req.query;
  let query = `
    SELECT t.*, 
           u.name as assigned_to_name,
           p.name as project_name,
           creator.name as created_by_name
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN users creator ON t.created_by = creator.id
    WHERE t.project_id IN (
      SELECT project_id FROM project_members WHERE user_id = $1
    )
  `;
  let params = [req.user.id];
  let paramCount = 1;

  if (status) {
    paramCount++;
    query += ` AND t.status = $${paramCount}`;
    params.push(status);
  }
  if (project_id) {
    paramCount++;
    query += ` AND t.project_id = $${paramCount}`;
    params.push(project_id);
  }
  if (assigned_to) {
    paramCount++;
    query += ` AND t.assigned_to = $${paramCount}`;
    params.push(assigned_to);
  }

  query += ' ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC';

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create task
router.post('/', [
  body('title').notEmpty().trim(),
  body('project_id').isInt(),
  body('assigned_to').optional().isInt(),
  body('due_date').optional().isDate(),
  body('priority').optional().isIn(['low', 'medium', 'high']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, project_id, assigned_to, due_date, priority = 'medium' } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO tasks (title, description, project_id, assigned_to, due_date, priority, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, description, project_id, assigned_to, due_date, priority, req.user.id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task status
router.patch('/:id/status', [
  body('status').isIn(['pending', 'in_progress', 'completed']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const result = await pool.query(
      'UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [req.body.status, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Dashboard stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status != 'completed') as overdue
      FROM tasks
      WHERE project_id IN (
        SELECT project_id FROM project_members WHERE user_id = $1
      )
    `, [req.user.id]);
    
    res.json(stats.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;