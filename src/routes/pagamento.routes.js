const express = require('express');
const router = express.Router();
const { gerarPixParcela } = require('../controllers/pagamento.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/gerar-pix-parcela', verifyToken, gerarPixParcela);

module.exports = router;
