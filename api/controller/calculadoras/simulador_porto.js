// A função original 'realizarCalculoSimulacao', agora chamada 'calcular'
function calcular(dadosCredito, dadosLanceInput) {
    try {
        // Constantes específicas da Porto
        const PORTO_LANCE_FIXO_PERCENTUAL = 0.4;
        const PORTO_EMBUTIDO_IMOVEL_PERCENTUAL = 0.3;
        // As constantes de outras administradoras foram removidas para manter o arquivo limpo.

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

        const valorCreditoOriginal = parseFloat(valorCreditoStr) || 0;
        const prazoTotalConsorcio = parseInt(numeroParcelasStr, 10) || 0;
        const taxaAdmTotalPercent = parseFloat(taxaAdmStr) || 0;
        const fundoReservaTotalPercent = parseFloat(fundoReservaStr) || 0;
        const seguroVidaMensalInformadoPercent = parseFloat(seguroVidaStr) || 0;
        let percentualRedutorAplicado;

        // Verifica se a chave 'redutorParcela' foi enviada na requisição
        if (dadosCredito.redutorParcela !== undefined) {
            // Se foi enviada, usa o valor dela (convertido para número), mesmo que seja 0.
            percentualRedutorAplicado = parseFloat(dadosCredito.redutorParcela) || 0;
        } else {
            if (tipoBem === 'imovel') {
                percentualRedutorAplicado = 25; // Padrão para imóvel quando nada é informado
            } else {
                percentualRedutorAplicado = 0; // Padrão para outros tipos de bem
            }
        }

        const percentualAdesaoInput = parseFloat(adesaoStr) || 0;
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
            // Para Porto, a base de cálculo do seguro é o saldo devedor original
            const baseCalculoSeguro = saldoDevedorOriginal;
            seguroVidaMensalFixo =
                baseCalculoSeguro * (seguroVidaMensalInformadoPercent / 100.0);
        }

        let adesaoMensal = 0.0;
        let numeroParcelasAdesao = 0;
        let mesesRestantesAdesao = 0;
        if (
            admin === "porto" &&
            tipoBem === "imovel" &&
            percentualAdesaoInput > 0
        ) {
            const valorTotalAdesao =
                valorCreditoOriginal * (percentualAdesaoInput / 100.0);
            numeroParcelasAdesao = parseInt(formaPagamentoAdesao, 10) || 1;
            if (numeroParcelasAdesao > 0) {
                adesaoMensal = valorTotalAdesao / numeroParcelasAdesao;
            }
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
        if (numeroParcelasAdesao > 0) {
            mesesRestantesAdesao = Math.max(
                0,
                numeroParcelasAdesao - mesesPagosAntesLance
            );
        }

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
        if (tipoLanceSelecionado && tipoLanceSelecionado !== "nenhum") {
            let parteEmbutidaReais = 0;
            let partePropriaReais = 0;
            const baseCalculoLance = saldoDevedorVigente; // Porto sempre usa saldo devedor

            if (admin === "porto") {
                switch (tipoLanceSelecionado) {
                    case "livre":
                        if (dadosLanceInput.usarEmbutido) {
                            const maxEmbutidoPerc =
                                tipoBem === "imovel"
                                    ? PORTO_EMBUTIDO_IMOVEL_PERCENTUAL
                                    : parseFloat(portoAutoPercEmbutidoInput) || 0;
                            const maxEmbutidoReais = valorCreditoOriginal * maxEmbutidoPerc;
                            const valorEmbutidoDigitado =
                                parseFloat(dadosLanceInput.valorEmbutido) || 0;
                            parteEmbutidaReais = Math.min(
                                valorEmbutidoDigitado,
                                maxEmbutidoReais
                            );
                        }
                        const valorLanceLivreReais =
                            parseFloat(dadosLanceInput.valorLanceLivre) || 0;
                        const percLanceLivre =
                            parseFloat(dadosLanceInput.percentualLanceLivre) || 0;
                        if (valorLanceLivreReais > 0) {
                            partePropriaReais = valorLanceLivreReais;
                        } else if (percLanceLivre > 0) {
                            partePropriaReais = baseCalculoLance * (percLanceLivre / 100.0);
                        }
                        break;

                    case "auto_embutido":
                        const percentualEmbutidoEscolhido = parseFloat(dadosLanceInput.porcentagemEmbutido) || 0;
                        const percentuaisValidos = [0.15, 0.20, 0.25, 0.30];

                        if (!percentuaisValidos.includes(percentualEmbutidoEscolhido)) {
                            console.warn("Percentual de lance embutido inválido para 'auto_embutido'.");
                            parteEmbutidaReais = 0;
                            partePropriaReais = 0;
                        } else {
                            parteEmbutidaReais = valorCreditoOriginal * percentualEmbutidoEscolhido;
                            partePropriaReais = 0;
                        }
                        break;

                    case "fixo":
                        // 1. O valor total do lance é sempre 40% da base de cálculo.
                        const valorTotalFixo = baseCalculoLance * 0.40;

                        // 2. Verifica se o cliente quer usar o lance embutido opcional.
                        if (dadosLanceInput.usarEmbutido) {
                            // O máximo embutido permitido é 30% do valor do crédito.
                            const maxEmbutidoReais = valorCreditoOriginal * 0.30;

                            // A parte embutida será o máximo permitido, mas não pode ultrapassar o valor total do lance fixo.
                            parteEmbutidaReais = Math.min(valorTotalFixo, maxEmbutidoReais);
                        }

                        // 3. O valor do bolso é a diferença.
                        partePropriaReais = valorTotalFixo - parteEmbutidaReais;

                        break;
                    // ================================================================

                    default:
                        console.warn(`Tipo de lance '${tipoLanceSelecionado}' não reconhecido para a Porto.`);
                }
            }

            if (tipoLanceSelecionado === "auto_embutido") {
                lanceCalculadoObj.formaAbatimento = "reduzir_valor_parcela";
            }

            const valorTotalLance = partePropriaReais + parteEmbutidaReais;
            lanceCalculadoObj.valorCalculado = Math.max(0, valorTotalLance);
            lanceCalculadoObj.valorEmbutido = Math.max(0, parteEmbutidaReais);
            lanceCalculadoObj.valorDoBolso = Math.max(0, partePropriaReais);

            const baseDeCalculoFinalDoPercentual = saldoDevedorVigente;
            if (baseDeCalculoFinalDoPercentual > 0) {
                lanceCalculadoObj.percentualOfertado =
                    (lanceCalculadoObj.valorCalculado / baseDeCalculoFinalDoPercentual) *
                    100.0;
            }
        }

        // Cálculos pós-lance
        const creditoLiquidoAposEmbutido =
            valorCreditoOriginal - lanceCalculadoObj.valorEmbutido;
        let parcelaPosContemplacaoFinal = parcelaComRedutorCompleta;
        let prazoFinalResultado = prazoRestanteVigente;

        if (tipoLanceSelecionado && tipoLanceSelecionado !== "nenhum") {
            if (lanceCalculadoObj.formaAbatimento === "reduzir_valor_parcela") {
                const seguroTotalEstimado = seguroVidaMensalFixo * prazoTotalConsorcio;
                const saldoDevedorBruto = saldoDevedorOriginal + seguroTotalEstimado;
                const saldoAposLance =
                    saldoDevedorBruto - lanceCalculadoObj.valorCalculado;

                if (
                    tipoBem === "imovel" ||
                    (admin === "porto" && tipoBem === "automovel")
                ) {
                    const saldoFinalParaDividir =
                        saldoAposLance - parcelaComRedutorCompleta;
                    prazoFinalResultado =
                        prazoRestanteVigente > 1 ? prazoRestanteVigente - 1 : 1;
                    parcelaPosContemplacaoFinal =
                        prazoFinalResultado > 0
                            ? saldoFinalParaDividir / prazoFinalResultado
                            : 0;
                } else {
                    prazoFinalResultado = prazoRestanteVigente;
                    parcelaPosContemplacaoFinal =
                        prazoFinalResultado > 0 ? saldoAposLance / prazoFinalResultado : 0;
                }
            } else if (lanceCalculadoObj.formaAbatimento === "reduzir_prazo_final") {
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
            // A mágica acontece aqui:
            ...(tipoBem === 'imovel' && {
                adesaoMensal: round(adesaoMensal),
                mesesRestantesAdesao: mesesRestantesAdesao
            })
        };
    } catch (e) {
        console.error("Erro na simulação:", e);
        return { erro: `Erro interno no cálculo: ${e.message}`, traceback: e.stack };
    }
}

module.exports = {
    calcular,
};