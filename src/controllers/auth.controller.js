const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const register = async (req, res) => {
    try {
        const { nome, cpf, whatsapp, senha } = req.body;
        
        if (!nome || !cpf || !senha) {
            return res.status(400).json({ error: 'Campos nome, cpf e senha são obrigatórios.' });
        }

        // Verifica CPF
        const [existing] = await db.query('SELECT id FROM usuarios WHERE cpf = ?', [cpf]);
        if (existing.length > 0) return res.status(409).json({ error: 'CPF já cadastrado.' });

        const id = crypto.randomUUID();
        const hash = await bcrypt.hash(senha, 10);

        await db.query(
            'INSERT INTO usuarios (id, nome, cpf, telefone, senha_hash) VALUES (?, ?, ?, ?, ?)',
            [id, nome, cpf, whatsapp || '', hash]
        );

        // Gera JWT
        const token = jwt.sign(
            { id, nome, cpf },
            process.env.JWT_SECRET || 'segredo_padrao',
            { expiresIn: '7d' }
        );

        return res.status(201).json({ message: 'Usuário registrado com sucesso', token, usuario: { id, nome } });
    } catch (error) {
        console.error('[Auth Register] Error:', error);
        return res.status(500).json({ error: 'Erro interno ao registrar usuário.' });
    }
};

const login = async (req, res) => {
    try {
        const { cpf, senha } = req.body;

        if (!cpf || !senha) {
            return res.status(400).json({ error: 'CPF e senha são obrigatórios.' });
        }

        const [users] = await db.query('SELECT id, nome, cpf, senha_hash FROM usuarios WHERE cpf = ?', [cpf]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const user = users[0];
        const senhaCorreta = await bcrypt.compare(senha, user.senha_hash);

        if (!senhaCorreta) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        // Gera JWT
        const token = jwt.sign(
            { id: user.id, nome: user.nome, cpf: user.cpf },
            process.env.JWT_SECRET || 'segredo_padrao',
            { expiresIn: '7d' }
        );

        return res.status(200).json({ message: 'Login realizado com sucesso', token, usuario: { id: user.id, nome: user.nome } });
    } catch (error) {
        console.error('[Auth Login] Error:', error);
        return res.status(500).json({ error: 'Erro interno ao realizar login.' });
    }
};

module.exports = {
    register,
    login
};
