const express = require('express');
const router = express.Router();
const { criarContrato } = require('../controllers/contrato.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/criar', verifyToken, criarContrato);

module.exports = router;
