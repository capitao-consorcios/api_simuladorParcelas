const express = require('express');
const simuladorRoutes = require('./api/routes/simulador_routes.js');

const app = express();
const PORT = process.env.PORT || 3000; // Porta do ambiente 3000 como padrão.

// ler json que vem das requisições. Middlewares
app.use(express.json());

// Rotas para acessar começando com o /api.
app.use('/api', simuladorRoutes);


// Rota simples para sair a raiz da API, para testar o servidor.
app.get('/', (req, res) => {
    res.send('API do Simulador de Consórcio do ar!');
});


// inicialização do Servidor1
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta http://localhost:${PORT}`);
})