// main.js

const express = require('express');
const simuladorRoutes = require('./api/routes/simulador_routes.js');
const authenticateToken = require('./api/middleware/auth.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());


app.use(authenticateToken);

// 3. SUAS ROTAS CONTINUAM AQUI
app.use('/api', simuladorRoutes);

app.get('/', (req, res) => {
    res.send('API do Simulador de Consórcio no ar!');
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta http://localhost:${PORT}`);
});