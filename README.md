# FinControl — versão para SPCK

## 1. Como instalar
1. Abra o SPCK Editor.
2. Crie uma pasta/projeto chamado `FinControl`.
3. Crie estes arquivos:
   - `index.html`
   - `style.css`
   - `app.js`
4. Cole o conteúdo correspondente de cada arquivo.
5. Abra `index.html` no preview do SPCK.

## 2. O que já funciona
- Dashboard responsivo para celular.
- Receitas, despesas e saldo do mês.
- Taxa de economia.
- Gráfico de fluxo de caixa.
- Gráfico por categoria.
- Lançamentos com filtros.
- Orçamentos por categoria.
- Metas financeiras com aportes.
- Lançamentos recorrentes.
- Relatório anual.
- Exportação CSV.
- Tema claro/escuro.
- Dados salvos no localStorage do navegador.
- Dois planos de assinatura: mensal e anual.
- Layout preparado para expansão.

## 3. Configurar os pagamentos
No topo do `app.js` existe:

const PAYMENT_LINKS = {
  monthly: "COLE_AQUI_SEU_LINK_DE_PAGAMENTO_MENSAL",
  annual: "COLE_AQUI_SEU_LINK_DE_PAGAMENTO_ANUAL"
};

Substitua os textos pelos links reais de checkout/assinatura do seu provedor.

IMPORTANTE:
- Não coloque Access Token, Client Secret ou qualquer chave privada no `app.js`.
- O frontend é público.
- Para integração direta via API, use um backend/servidor.

## 4. Mercado Pago
O Mercado Pago possui recursos de planos e assinaturas recorrentes. Você pode criar um plano mensal e um anual e colocar os respectivos links na configuração acima.

Documentação oficial:
https://www.mercadopago.com.br/developers/pt/docs/subscription-plans/overview
https://www.mercadopago.com.br/developers/pt/docs/subscriptions/overview

## 5. Próxima evolução recomendada
Para transformar isso em um SaaS real:
- Login por usuário.
- Banco de dados.
- Backend Node.js/Express.
- Autenticação.
- Mercado Pago via backend.
- Webhooks para confirmar pagamentos.
- Bloqueio/desbloqueio do plano Pro.
- Sincronização em nuvem.
- Criptografia e políticas de privacidade.
- Conexão bancária via Open Finance usando provedor compatível.

A versão atual é uma aplicação financeira local, ótima para prototipagem e uso pessoal.
