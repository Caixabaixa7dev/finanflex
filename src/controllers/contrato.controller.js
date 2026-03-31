const db = require('../config/db');
const crypto = require('crypto');

const criarContrato = async (req, res) => {
    const { linha_digitavel, valor_boleto, qtd_parcelas } = req.body;

    // O id do usuário vem do Middleware de JWT (req.user)
    const usuario_id = req.user.id;

    if (!linha_digitavel || !valor_boleto || !qtd_parcelas) {
        return res.status(400).json({ error: 'Faltam dados obrigatórios no payload (linha_digitavel, valor_boleto, qtd_parcelas).' });
    }

    const n = parseInt(qtd_parcelas);
    if (n < 1) {
        return res.status(400).json({ error: 'A quantidade de parcelas deve ser maior que zero.' });
    }

    // Buscando uma conexão do pool para suportar transação segura
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Inserir Contrato Principal
        const contrato_id = crypto.randomUUID();
        const ip_aceite_termos = req.ip || '127.0.0.1'; 
        
        await connection.query(`
            INSERT INTO contratos 
            (id, usuario_id, linha_digitavel_boleto, valor_boleto_original, quantidade_parcelas, ip_aceite_termos) 
            VALUES (?, ?, ?, ?, ?, ?)
        `, [contrato_id, usuario_id, linha_digitavel, valor_boleto, qtd_parcelas, ip_aceite_termos]);


        // 2. Cálculo do Valor das Parcelas (Alinhado com o Simulador)
        let valor_total_com_juros;

        if (n === 1) {
            // 10% de Cashback (como desconto direto no primeiro pagamento)
            valor_total_com_juros = parseFloat(valor_boleto) * 0.90;
        } else {
            // Juros compostos baseados no simulador (baseTax = 1.11)
            const baseTax = 1.11;
            valor_total_com_juros = parseFloat(valor_boleto) * Math.pow(baseTax, n);
        }

        const valor_por_parcela = (valor_total_com_juros / n).toFixed(2);

        // 3. Loop: Inserir Parcelas Sequencialmente
        let today = new Date();
        const parcelas_criadas = [];

        for (let i = 1; i <= n; i++) {
            const parcela_id = crypto.randomUUID();
            
            let vencimento = new Date(today);
            vencimento.setDate(vencimento.getDate() + ((i - 1) * 30));
            const vencimento_str = vencimento.toISOString().split('T')[0];

            await connection.query(`
                INSERT INTO parcelas 
                (id, contrato_id, numero_parcela, valor_parcela, data_vencimento) 
                VALUES (?, ?, ?, ?, ?)
            `, [parcela_id, contrato_id, i, valor_por_parcela, vencimento_str]);

            parcelas_criadas.push({ id: parcela_id, numero: i, valor: valor_por_parcela, vencimento: vencimento_str });
        }

        // 4. Efetivar a transação em todos os registros salvos
        await connection.commit();

        return res.status(201).json({
            message: 'Contrato e parcelas criados com sucesso!',
            contratoId: contrato_id,
            parcelas: parcelas_criadas,
            resumo: {
                valor_original: valor_boleto,
                valor_total_com_juros: parseFloat(valor_total_com_juros).toFixed(2),
                quantidade_parcelas: n,
                valor_da_parcela: valor_por_parcela
            }
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('ERRO Transaction criarContrato:', error);
        return res.status(500).json({ error: 'Falha interna ao gerar contrato. Transação cancelada.' });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    criarContrato
};
