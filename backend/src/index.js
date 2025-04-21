require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3001;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Middleware
app.use(cors());
app.use(express.json());

// Check and create read column if it doesn't exist
async function ensureReadColumn() {
  try {
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'chats' AND column_name = 'read'
    `);
    
    if (result.rows.length === 0) {
      await pool.query('ALTER TABLE chats ADD COLUMN read BOOLEAN DEFAULT FALSE');
      console.log('Added read column to chats table');
    }
  } catch (err) {
    console.error('Error checking/creating read column:', err);
  }
}

// Call the function when server starts
ensureReadColumn();

// Routes
app.get('/api/chats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, 
             (SELECT MAX(created_at) FROM messages WHERE chat_id = c.id) as last_message_at,
             (SELECT COUNT(*) FROM messages WHERE chat_id = c.id) as message_count
      FROM chats c
      ORDER BY last_message_at DESC NULLS LAST
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/chats/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM chats WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/chats', async (req, res) => {
  const { uuid, waiting, ai } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO chats (uuid, waiting, ai) VALUES ($1, $2, $3) RETURNING *',
      [uuid, waiting, ai]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/chats/:id', async (req, res) => {
  const { id } = req.params;
  const { waiting, ai, read } = req.body;
  try {
    const result = await pool.query(
      'UPDATE chats SET waiting = COALESCE($1, waiting), ai = COALESCE($2, ai), read = COALESCE($3, read) WHERE id = $4 RETURNING *',
      [waiting, ai, read, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/messages/:chatId', async (req, res) => {
  const { chatId } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at',
      [chatId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/messages', async (req, res) => {
  const { chat_id, message, message_type, ai } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO messages (chat_id, message, message_type, ai) VALUES ($1, $2, $3, $4) RETURNING *',
      [chat_id, message, message_type, ai]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 