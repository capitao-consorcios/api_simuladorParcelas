const express = require('express');
const router = express.Router();

// Importa o controller principal
const simuladorController = require('../controller/simuladorController.js');

// Conecta a rota /simular à função do controller
router.post('/simular', simuladorController.realizarSimulacao);

module.exports = router;