# Sobre este Projeto

Esta é uma API REST Node.js/Express para simular parcelas de consórcio. O objetivo principal é receber os dados de uma simulação, e com base na administradora (`admin`), delegar o cálculo para o módulo de calculadora correspondente.

A API é documentada usando a especificação OpenAPI, que é a fonte da verdade para os contratos de dados.

## Arquitetura

O fluxo de uma requisição é o seguinte:

1.  **Ponto de Entrada**: `main.js` configura o servidor Express, o middleware e as rotas.
2.  **Documentação**: A rota `/api-docs` usa `swagger-ui-express` para renderizar a documentação a partir de `openapi.yaml`.
3.  **Autenticação**: Todas as rotas sob `/api` são protegidas pelo middleware `api/middleware/auth.js`, que valida um token de autenticação.
4.  **Roteamento**: `api/routes/simulador_routes.js` define o endpoint principal `POST /api/simular`.
5.  **Controlador Principal**: `api/controller/simuladorController.js` atua como um despachante. Ele lê a propriedade `admin` do corpo da requisição.
6.  **Calculadoras Específicas**: Com base no valor de `admin` (ex: 'porto', 'yamaha'), ele chama o método `calcular` do módulo correspondente em `api/controller/calculadoras/`.

## Fluxo de Trabalho do Desenvolvedor

-   **Para instalar as dependências**:
    ```bash
    npm install
    ```

-   **Para rodar em modo de desenvolvimento (com recarregamento automático)**:
    ```bash
    npm run dev
    ```
    O servidor estará disponível em `http://localhost:8080`.

-   **Para rodar com Docker**:
    ```bash
    docker-compose up
    ```

-   **Testes**: O projeto atualmente não possui um framework de testes configurado. O script `npm test` apenas exibe uma mensagem de erro.

-   **Variáveis de Ambiente**: O projeto utiliza um arquivo `.env` para gerenciar variáveis de ambiente, como as chaves para autenticação. Certifique-se de criar este arquivo na raiz do projeto ao configurar o ambiente.

## Padrões e Convenções Chave

### 1. Adicionando uma Nova Calculadora de Administradora

Este é o padrão de extensão mais importante no projeto. Para adicionar suporte a uma nova administradora (ex: 'bradesco'):

1.  Crie um novo arquivo em `api/controller/calculadoras/simulador_bradesco.js`.
2.  Este arquivo deve exportar uma função `calcular(dadosCredito, dadosLanceInput)` que implementa a lógica de negócio específica para a Bradesco e retorna um objeto JSON com o resultado.
3.  Importe o novo módulo em `api/controller/simuladorController.js`.
4.  Adicione um novo `case` ao `switch` para a administradora 'bradesco', chamando a função de cálculo recém-criada.

Exemplo em `simuladorController.js`:

```javascript
// ...
const bradescoController = require('./calculadoras/simulador_bradesco.js');

// ...
    switch (dadosCredito.admin) {
        case 'porto':
            // ...
        case 'yamaha':
            // ...
        case 'itau':
            // ...
        case 'bradesco': // Novo caso
            const resultadoBradesco = bradescoController.calcular(dadosCredito, dadosLanceInput);
            return res.status(200).json(resultadoBradesco);

        default:
            // ...
    }
// ...
```

### 2. Contrato da API via OpenAPI

Qualquer alteração na estrutura de dados da requisição ou resposta do endpoint `/api/simular` deve ser feita primeiro no arquivo `openapi.yaml`. Este arquivo é a documentação central e define os schemas que a API espera e retorna.
