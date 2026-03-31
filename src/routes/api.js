const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Importar todas as rotas modulares
const authRoutes = require('./auth.routes');
const contratoRoutes = require('./contrato.routes');
const dashboardRoutes = require('./dashboard.routes');
const pagamentoRoutes = require('./pagamento.routes');

// Definir os sub-roteadores da API (/api/...)
router.use('/auth', authRoutes);
router.use('/contratos', contratoRoutes);
router.use('/dashboards', dashboardRoutes);
router.use('/pagamentos', pagamentoRoutes);

// =========================================================
// ROTAS ANTIGAS OU DE SISTEMAS (WEBHOOK) MANTIDAS
// =========================================================

// Webhook da Veopag 
router.post('/veopag', async (req, res) => {
  try {
    const payload = req.body;
    
    // Verificação de segurança (Opcional se configurado no portal)
    // const signature = req.headers['x-webhook-signature'];
    
    // De acordo com a DOC: type pode ser "Deposit" ou "Withdrawal"
    if (payload.type !== 'Deposit') {
      return res.status(200).send('Ignoring non-deposit event');
    }

    const transactionId = payload.transaction_id;
    const status = payload.status; // PENDING, PROCESSING, COMPLETED, FAILED

    if (!transactionId) return res.status(400).json({ error: 'transaction_id missing' });

    if (status === 'COMPLETED') {
      // Localizar parcela pelo transactionId da Veopag (que salvamos no controller)
      const [parcelas] = await db.query('SELECT id, contrato_id FROM parcelas WHERE txid_veopag = ?', [transactionId]);
      
      if(parcelas.length > 0) {
        const parcelaId = parcelas[0].id;
        const contratoId = parcelas[0].contrato_id;
        
        // 1. Marcar parcela como Paga
        await db.query(
          "UPDATE parcelas SET status_pagamento = 'PAGO', data_pagamento = NOW() WHERE id = ?",
          [parcelaId]
        );
        
        // 2. Se for a primeira parcela, atualizar status do contrato para liberar no admin (PENDENTE -> PIX_1_PAGO)
        await db.query(
          "UPDATE contratos SET status = 'PIX_1_PAGO' WHERE id = ? AND status = 'PENDENTE'",
          [contratoId]
        );

        console.log(`[Webhook success] Parcela ${parcelaId} liquidada via Veopag.`);
      } else {
        console.warn(`[Webhook warn] TransactionId ${transactionId} não encontrado no banco.`);
      }
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('[Veopag Webhook] Error:', error);
    return res.status(500).send('Internal Error');
  }
});

// Endpoint para polling inteligente do front-end
router.get('/contratos/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT status FROM contratos WHERE id = ?', [id]);
    if(rows.length === 0) return res.status(404).json({ error: 'Not found' });
    return res.json({ status: rows[0].status });
  } catch (e) {
    return res.status(500).json({ error: 'Internal Error' });
  }
});

module.exports = router;
