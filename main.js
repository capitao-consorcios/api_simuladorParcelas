// main.js

const express = require('express');
const simuladorRoutes = require('./api/routes/simulador_routes.js');
const authenticateToken = require('./api/middleware/auth.js');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./openapi.yaml');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 1. Rota da documentação (pública)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 2. Middleware de autenticação (só se aplica ao que vem depois)
app.use(authenticateToken);

// 3. Rotas da API (protegidas)
app.use('/api', simuladorRoutes);

app.get('/', (req, res) => {
    res.send('API do Simulador de Consórcio no ar!');
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta http://localhost:${PORT}`);
    console.log(`Documentação disponível em http://localhost:${PORT}/api-docs`); // Linha extra para facilitar :)
});