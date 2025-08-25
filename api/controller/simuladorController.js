// api/controller/simuladorController.js

const portoController = require('./calculadoras/simulador_porto.js');
const yamahaController = require('./calculadoras/simulador_yamaha.js');
const itauController = require('./calculadoras/simulador_itau.js');

const realizarSimulacao = (req, res) => {
    const { dadosCredito, dadosLanceInput } = req.body;

    if (!dadosCredito || !dadosCredito.admin) {
        return res.status(400).json({
            erro: "Dados de crédito inválidos ou administradora não informada."
        });
    }
    

    switch (dadosCredito.admin) {
        case 'porto':
            const resultadoPorto = portoController.calcular(dadosCredito, dadosLanceInput);
            return res.status(200).json(resultadoPorto);

        case 'yamaha':
            const resultadoYamaha = yamahaController.calcular(dadosCredito, dadosLanceInput);
            return res.status(200).json(resultadoYamaha);

        case 'itau':
            const resultadoItau = itauController.calcular(dadosCredito, dadosLanceInput);
            return res.status(200).json(resultadoItau);

        default:
            return res.status(400).json({
                erro: `Administradora '${dadosCredito.admin}' não é reconhecida pelo sistema.`
            });
    }
};

module.exports = {
    realizarSimulacao,
};