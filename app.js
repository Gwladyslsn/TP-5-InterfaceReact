const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = 3000;
const pool = new Pool({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});



app.use(express.json());

// server.js (API)
const cors = require('cors');
// Seul le frontend a le droit d'appeler l'API depuis un navigateur
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
}));


app.get('/', (req, res) => {
    res.send('Hello API TP5');
});

// Routes API

app.post('/tasks', async (req, res) => {
    const { complété = false, titre, assignee } = req.body;
    const result = await pool.query(
        'INSERT INTO tasks (status_task, title_task, assignee) VALUES ($1, $2, $3) RETURNING id_task AS id, status_task AS "complété", title_task AS titre, assignee',
        [complété, titre, assignee]
    );

    res.status(201).json({
        message: 'Post ok',
        task: result.rows[0]
    });
});

app.get('/tasks', async (req, res) => {
    const result = await pool.query(
        'SELECT id_task AS id, status_task AS "complété", title_task AS titre, assignee FROM tasks ORDER BY id_task'
    );

    res.status(200).json({
        message: 'Get ok',
        task: result.rows
    });
});

app.put('/tasks/:id', async (req, res) => {
    const { complété, titre, assignee } = req.body;
    const result = await pool.query(
        'UPDATE tasks SET status_task = $1, title_task = $2, assignee = $3 WHERE id_task = $4 RETURNING id_task AS id, status_task AS "complété", title_task AS titre, assignee',
        [complété, titre, assignee, req.params.id]
    );

    if (result.rowCount === 0) {
        return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json({
        message: 'Put ok',
        task: result.rows[0]
    });
});

app.delete('/tasks/:id', async (req, res) => {
    const result = await pool.query(
        'DELETE FROM tasks WHERE id_task = $1 RETURNING id_task AS id, status_task AS "complété", title_task AS titre, assignee AS assignee',
        [req.params.id]
    );

    if (result.rowCount === 0) {
        return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json({
        message: 'Delete ok',
        task: result.rows[0]
    });
});

// Fonctionnalité A : marquer une tache complétée
app.patch('/tasks/:id', async (req, res) => {
    const result = await pool.query(
        'UPDATE tasks SET status_task = TRUE WHERE id_task = $1 RETURNING id_task AS id, status_task AS "complété", title_task AS titre',
        [req.params.id]
    );

    if (result.rowCount === 0) {
        return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json({
        message: 'tache complétée',
        task: result.rows[0]
    });
});



app.listen(port, () => {
    console.log(`serveur sur http://localhost:${port}`);
});