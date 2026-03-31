const db = require('../config/db');
const axios = require('axios'); // Para requisições externas para API Veopag

const gerarPixParcela = async (req, res) => {
    try {
        const { parcela_id } = req.body;
        const usuario_id = req.user.id; // Vem do verifyToken middleware

        if (!parcela_id) {
            return res.status(400).json({ error: 'parcela_id é obrigatório.' });
        }

        // Busca dados da parcela + contrato + usuario para o objeto 'payer' da Veopag
        const [rows] = await db.query(`
            SELECT 
                p.*, 
                u.nome as payer_name, 
                u.cpf as payer_doc,
                u.telefone as payer_phone
            FROM parcelas p
            JOIN contratos c ON p.contrato_id = c.id
            JOIN usuarios u ON c.usuario_id = u.id
            WHERE p.id = ? AND u.id = ?
        `, [parcela_id, usuario_id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Parcela não encontrada.' });
        }

        const data = rows[0];
        
        if (data.status_pagamento === 'PAGO') {
            return res.status(400).json({ error: 'Parcela já liquidada.' });
        }

        // Credenciais fornecidas pelo usuário
        const clientId = 'samanthalotufolentedomingos_L0FYMTWZ';
        const clientSecret = '5vpC1GUD331STKL1vbAzNIKeZ7yuO9WCYtk5gQ7knmb5RHDlj2qRfVuaxJxgi61OY6duGibXaxPXtDBeJ3NEw0S9UiEwbkKRqVgN';

        try {
            // 1. Autenticação Oficial (Bearer Token)
            const authRes = await axios.post('https://api.veopag.com/api/auth/login', {
                client_id: clientId,
                client_secret: clientSecret
            });

            const veopagToken = authRes.data.token;

            // 2. Geração de Depósito (Pix In)
            // Documentação exige: amount, external_id, payer {name, email, document}
            const depositRes = await axios.post('https://api.veopag.com/api/payments/deposit', {
                amount: parseFloat(data.valor_parcela),
                external_id: `PARCELA_${data.id}_${Date.now()}`, // Garantir unicidade
                payer: {
                    name: data.payer_name,
                    email: (data.payer_phone || 'billing') + '@finanflex.com', // Fallback se não tiver email
                    document: data.payer_doc.replace(/\D/g, '') // Somente números
                }
            }, {
                headers: { 'Authorization': `Bearer ${veopagToken}` }
            });

            const veopagData = depositRes.data.qrCodeResponse;
            console.log('[Veopag Success Response]:', veopagData);

            let qrText = veopagData.brCode || veopagData.brcode;
            let qrImage = veopagData.qrcode;

            // Heurística: Se 'qrcode' começar com 000201, ele é o texto (BRCode), não a imagem base64
            if (qrImage && qrImage.startsWith('000201')) {
                qrText = qrImage;
                // Gerar um link de QR Code se não tivermos o base64 real
                qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrText)}`;
            }

            // Atualizar status no banco com o transactionId da Veopag
            await db.query('UPDATE parcelas SET txid_veopag = ? WHERE id = ?', 
                [veopagData.transactionId, parcela_id]);

            return res.json({
                message: 'Pix gerado com sucesso.',
                transactionId: veopagData.transactionId,
                qrcode_base64: qrImage, 
                brCode: qrText,
                amount: veopagData.amount,
                simulated: false
            });

        } catch (apiError) {
            console.error('[Veopag API Error]:', apiError.response?.data || apiError.message);
            
            // Simulação de Fallback em caso de erro na API/Chaves Inválidas durante o desenvolvimento
            const mockTxid = 'simulated_' + Math.random().toString(36).substring(7);
            return res.json({
                message: 'Pix gerado (MODO SIMULADO - API INDISPONÍVEL)',
                transactionId: mockTxid,
                qrcode_base64: null, 
                brCode: '00020126360014br.gov.bcb.pix0114+5511999999999...SIMULACAO_VEOPAG',
                qrCodeLink: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=SIMULADO',
                simulated: true
            });
        }

    } catch (error) {
        console.error('[Pagamento Controller] Dev Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    gerarPixParcela
};
