const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // --- ADICIONE ESTAS DUAS LINHAS PARA DEBUG ---
    console.log('Token Recebido do Cliente:', token);
    console.log('Token Esperado pelo Servidor (.env):', process.env.API_TOKEN);
    // -------------------------------------------

    if (token == null) {
        return res.sendStatus(401);
    }

    if (token === process.env.API_TOKEN) {
        next();
    } else {
        return res.sendStatus(403);
    }
};

module.exports = authenticateToken;