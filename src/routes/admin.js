const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');

router.post('/login', async (req, res) => {
    const { login, senha } = req.body;
    try {
        const [rows] = await db.query('SELECT id, login, senha_hash FROM admins WHERE login = ?', [login]);
        if(rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        
        const valid = await bcrypt.compare(senha, rows[0].senha_hash);
        if(!valid) return res.status(401).json({ error: 'Invalid credentials' });

        return res.json({ token: 'simulated-admin-token-12345', message: 'Logged in' }); 
    } catch(e) {
        return res.status(500).json({ error: 'Internal error' });
    }
});

const authMiddleware = (req, res, next) => {
   const token = req.headers['authorization'];
   if(token !== 'Bearer simulated-admin-token-12345') return res.status(401).json({ error: 'Unauthorized' });
   next();
};

router.get('/contratos-pagos', authMiddleware, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM contratos WHERE status = 'PIX_1_PAGO'");
        return res.json(rows);
    } catch(e) {
        return res.status(500).json({ error: 'Internal error' });
    }
});

router.post('/liquidar-contrato/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query("UPDATE contratos SET status = 'BOLETO_LIQUIDADO_TESOURARIA' WHERE id = ?", [id]);
        if(result.affectedRows === 0) return res.status(404).json({ error: 'Contrato não encontrado ou sem alteração' });
        return res.json({ success: true, message: 'Boleto liquidado na tesouraria!' });
    } catch(e) {
        return res.status(500).json({ error: 'Internal error' });
    }
});

module.exports = router;
