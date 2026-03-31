const express = require('express');
const router = express.Router();
const { obterResumoCliente, obterFilaTesouraria } = require('../controllers/dashboard.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/cliente', verifyToken, obterResumoCliente);
router.get('/admin/tesouraria', verifyToken, obterFilaTesouraria);

module.exports = router;
