const db = require('../config/db');

const obterResumoCliente = async (req, res) => {
    try {
        const usuario_id = req.user.id;

        // Traz informações dos contratos
        const [contratos] = await db.query(
            "SELECT id, valor_boleto_original, quantidade_parcelas, status, data_criacao FROM contratos WHERE usuario_id = ? ORDER BY data_criacao DESC",
            [usuario_id]
        );

        // Para facilitar no front-end, pegamos também as parcelas pendentes (apenas resumo)
        const [parcelasQuery] = await db.query(
            `SELECT p.id, p.numero_parcela, p.valor_parcela, p.data_vencimento, p.status_pagamento, c.id AS contrato_id
             FROM parcelas p 
             JOIN contratos c ON p.contrato_id = c.id 
             WHERE c.usuario_id = ? AND p.status_pagamento IN ('PENDENTE', 'ATRASADO')
             ORDER BY p.data_vencimento ASC`,
             [usuario_id]
        );

        return res.status(200).json({
            usuario: req.user.nome,
            contratos,
            parcelasPendentes: parcelasQuery
        });

    } catch (error) {
        console.error('[Dashboard Cliente] Error:', error);
        return res.status(500).json({ error: 'Erro ao obter dados do dashboard do cliente.' });
    }
};

const obterFilaTesouraria = async (req, res) => {
    try {
        // Rota destinada a admins. Na vida real, o JWT teria uma propriedade 'role: admin'.
        // Aqui assumiremos que a rota é protegida e válida.

        const [fila] = await db.query(
            "SELECT id, usuario_id, linha_digitavel_boleto, valor_boleto_original, status, data_criacao FROM contratos WHERE status = 'PIX_1_PAGO' ORDER BY data_criacao ASC"
        );

        return res.status(200).json({ fila_liquidacao: fila });
    } catch (error) {
        console.error('[Dashboard Tesouraria] Error:', error);
        return res.status(500).json({ error: 'Erro ao acessar fila da tesouraria.' });
    }
};

module.exports = {
    obterResumoCliente,
    obterFilaTesouraria
};
