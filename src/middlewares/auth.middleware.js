const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Pegar o token do header
    const tokenHeader = req.headers['authorization'];
    
    if (!tokenHeader) {
        return res.status(403).json({ error: 'Nenhum token fornecido. Acesso negado.' });
    }

    // Formato esperado: "Bearer <token>"
    const token = tokenHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ error: 'Token mal formatado.' });
    }

    try {
        // Verificar a validade do token
        // Use uma variável de ambiente na produção, fallback para "segredo_padrao" no desenvolvimento
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'segredo_padrao');
        
        // Injetar os dados do usuário na requisição para uso nos próximos controllers
        req.user = decoded;
        
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
};

module.exports = {
    verifyToken
};
