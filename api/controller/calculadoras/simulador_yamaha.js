// api/controller/calculadoras/simulador_yamaha.js

function calcular(dadosCredito, dadosLanceInput) {
    try {
        // Constantes específicas de cada administradora
        const PORTO_LANCE_FIXO_PERCENTUAL = 0.4;
        const PORTO_EMBUTIDO_IMOVEL_PERCENTUAL = 0.3;
        const YAMAHA_LANCE_FIXO_IMOVEL_SALDO_DEVEDOR_PERCENTUAL = 0.3;
        const YAMAHA_EMBUTIDO_LIVRE_IMOVEL_CREDITO_PERCENTUAL = 0.25;
        const YAMAHA_EMBUTIDO_LIVRE_AUTO_CREDITO_PERCENTUAL = 0.15;
        const ITAU_EMBUTIDO_MAX_PERCENTUAL = 0.3;

        // Desestruturação dos dados de entrada do crédito
        const {
            admin,
            tipoBem,
            tipoCliente,
            valorCredito: valorCreditoStr = "0",
            numeroParcelas: numeroParcelasStr = "0",
            taxaAdm: taxaAdmStr = "0",
            fundoReserva: fundoReservaStr = "0",
            seguroVida: seguroVidaStr = "0",
            redutorParcela: redutorParcelaStr = "0",
            adesao: adesaoStr = "0",
            formaPagamentoAdesao,
            mesesPagosAntesLance: mesesPagosAntesLanceStr = "0",
            portoAutomovelPercentualEmbutido: portoAutoPercEmbutidoInput = 0,
        } = dadosCredito;

        // Conversão e validação dos dados de entrada
        const valorCreditoOriginal = parseFloat(valorCreditoStr) || 0;
        const prazoTotalConsorcio = parseInt(numeroParcelasStr, 10) || 0;
        const taxaAdmTotalPercent = parseFloat(taxaAdmStr) || 0;
        const fundoReservaTotalPercent = parseFloat(fundoReservaStr) || 0;
        const seguroVidaMensalInformadoPercent = parseFloat(seguroVidaStr) || 0;
        const percentualRedutorAplicado = parseFloat(redutorParcelaStr) || 0;
        const mesesPagosAntesLance = parseInt(mesesPagosAntesLanceStr, 10) || 0;

        if (valorCreditoOriginal <= 0 || prazoTotalConsorcio <= 0) {
            return {
                erro: "Valor do crédito e/ou Número de Parcelas são inválidos.",
            };
        }

        // Cálculos iniciais
        const taxaAdmTotalValor =
            valorCreditoOriginal * (taxaAdmTotalPercent / 100.0);
        const fundoReservaTotalValor =
            valorCreditoOriginal * (fundoReservaTotalPercent / 100.0);
        const saldoDevedorOriginal =
            valorCreditoOriginal + taxaAdmTotalValor + fundoReservaTotalValor;

        let seguroVidaMensalFixo = 0.0;
        if (tipoCliente === "cpf" && seguroVidaMensalInformadoPercent > 0) {
            const baseCalculoSeguro = ["porto", "yamaha"].includes(admin)
                ? saldoDevedorOriginal
                : valorCreditoOriginal;
            seguroVidaMensalFixo =
                baseCalculoSeguro * (seguroVidaMensalInformadoPercent / 100.0);
        }

        const parcelaBaseSemSeguro =
            prazoTotalConsorcio > 0 ? saldoDevedorOriginal / prazoTotalConsorcio : 0;
        const parcelaComRedutorSemSeguro =
            parcelaBaseSemSeguro * (1.0 - percentualRedutorAplicado / 100.0);
        const parcelaOriginalCompleta = parcelaBaseSemSeguro + seguroVidaMensalFixo;
        const parcelaComRedutorCompleta =
            parcelaComRedutorSemSeguro + seguroVidaMensalFixo;

        const saldoDevedorVigente =
            saldoDevedorOriginal - parcelaComRedutorSemSeguro * mesesPagosAntesLance;
        const prazoRestanteVigente = prazoTotalConsorcio - mesesPagosAntesLance;

        // Inicialização do objeto de lance
        const lanceCalculadoObj = {
            tipo: dadosLanceInput.tipo || "nenhum",
            valorCalculado: 0.0,
            percentualOfertado: 0.0,
            valorEmbutido: 0.0,
            valorDoBolso: 0.0,
            formaAbatimento: dadosLanceInput.formaAbatimento,
        };
        const tipoLanceSelecionado = dadosLanceInput.tipo;

        // Lógica de cálculo do lance
        if (tipoLanceSelecionado !== "nenhum") {
            let parteEmbutidaReais = 0;
            let partePropriaReais = 0;
            const baseCalculoLance =
                admin === "itau" ? valorCreditoOriginal : saldoDevedorVigente;

            if (admin === "yamaha") {
                if (dadosLanceInput.usarEmbutido) {
                    const maxEmbutidoPerc =
                        tipoBem === "imovel"
                            ? YAMAHA_EMBUTIDO_LIVRE_IMOVEL_CREDITO_PERCENTUAL
                            : YAMAHA_EMBUTIDO_LIVRE_AUTO_CREDITO_PERCENTUAL;
                    const maxEmbutidoReais = valorCreditoOriginal * maxEmbutidoPerc;
                    const valorEmbutidoDigitado =
                        parseFloat(dadosLanceInput.valorEmbutido) || 0;
                    parteEmbutidaReais = Math.min(
                        valorEmbutidoDigitado,
                        maxEmbutidoReais
                    );
                }

                if (tipoLanceSelecionado === "livre_yamaha") {
                    const valorLanceLivreReais =
                        parseFloat(dadosLanceInput.valorLanceLivre) || 0;
                    const percLanceLivre =
                        parseFloat(dadosLanceInput.percentualLanceLivre) || 0;
                    if (valorLanceLivreReais > 0) {
                        partePropriaReais = valorLanceLivreReais;
                    } else if (percLanceLivre > 0) {
                        partePropriaReais = baseCalculoLance * (percLanceLivre / 100.0);
                    }
                } else if (tipoLanceSelecionado.includes("fixo_yamaha")) {
                    const valorTotalFixo =
                        baseCalculoLance *
                        YAMAHA_LANCE_FIXO_IMOVEL_SALDO_DEVEDOR_PERCENTUAL;
                    partePropriaReais = valorTotalFixo - parteEmbutidaReais;
                }
            }
            // Adicione outras lógicas de admin se necessário (ex: 'porto', 'itau')
            // Esta função está focada na Yamaha, mas a estrutura original foi mantida

            const valorTotalLance = partePropriaReais + parteEmbutidaReais;
            lanceCalculadoObj.valorCalculado = Math.max(0, valorTotalLance);
            lanceCalculadoObj.valorEmbutido = Math.max(0, parteEmbutidaReais);
            lanceCalculadoObj.valorDoBolso = Math.max(0, partePropriaReais);

            const baseDeCalculoFinalDoPercentual =
                admin === "itau" ? valorCreditoOriginal : saldoDevedorVigente;
            if (baseDeCalculoFinalDoPercentual > 0) {
                lanceCalculadoObj.percentualOfertado =
                    (lanceCalculadoObj.valorCalculado / baseDeCalculoFinalDoPercentual) *
                    100.0;
            }
        }

        // Cálculos pós-lance (genéricos, aplicam-se a todos)
        const creditoLiquidoAposEmbutido =
            valorCreditoOriginal - lanceCalculadoObj.valorEmbutido;
        let parcelaPosContemplacaoFinal = parcelaComRedutorCompleta;
        let prazoFinalResultado = prazoRestanteVigente;

        if (tipoLanceSelecionado !== "nenhum") {
            if (lanceCalculadoObj.formaAbatimento === "reduzir_prazo_final") {
                parcelaPosContemplacaoFinal = parcelaOriginalCompleta;
                let numParcelasQuitadas = 0;
                if (parcelaOriginalCompleta > 0) {
                    numParcelasQuitadas = Math.floor(
                        lanceCalculadoObj.valorCalculado / parcelaOriginalCompleta
                    );
                }
                const parcelasPagas = Math.max(1, mesesPagosAntesLance);
                prazoFinalResultado =
                    prazoTotalConsorcio - parcelasPagas - numParcelasQuitadas;
            }
            // Adicione a lógica para "reduzir_valor_parcela" se necessário
        }

        // Função para arredondar para 2 casas decimais
        const round = (num) => parseFloat(num.toFixed(2));

        // Objeto de retorno completo
        return {
            parcelaOriginal: round(parcelaOriginalCompleta),
            parcelaComRedutor: round(parcelaComRedutorCompleta),
            valorSeguroVidaMensalOriginal: round(seguroVidaMensalFixo),
            percentualRedutor: round(percentualRedutorAplicado),
            lance: {
                ...lanceCalculadoObj,
                valorCalculado: round(lanceCalculadoObj.valorCalculado),
                percentualOfertado: round(lanceCalculadoObj.percentualOfertado),
                valorEmbutido: round(lanceCalculadoObj.valorEmbutido),
                valorDoBolso: round(lanceCalculadoObj.valorDoBolso),
            },
            creditoLiquido: round(creditoLiquidoAposEmbutido),
            prazoComLance: prazoFinalResultado,
            parcelaPosContemplacao: round(parcelaPosContemplacaoFinal),
        };
    } catch (e) {
        console.error("Erro na simulação Yamaha:", e);
        return { erro: `Erro interno no cálculo: ${e.message}` };
    }
}

// Exporta a função 'calcular' para ser usada pelo simuladorController.js
module.exports = {
    calcular,
};