// BACKEND OPCIONAL — não coloque este arquivo como frontend.
// Use Node.js em um servidor. O Access Token do Mercado Pago deve ficar em variável de ambiente.
//
// npm init -y
// npm install express cors dotenv
//
// .env:
// MP_ACCESS_TOKEN=SEU_ACCESS_TOKEN
//
// Este exemplo mostra a estrutura de um endpoint seguro.
// Para produção, valide o usuário, o plano, o preço e implemente webhook.

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_, res) => res.json({ok:true}));

app.post("/api/create-subscription", async (req,res)=>{
  try{
    const { plan, payerEmail } = req.body;
    if(!["monthly","annual"].includes(plan)) return res.status(400).json({error:"Plano inválido"});
    if(!payerEmail) return res.status(400).json({error:"E-mail obrigatório"});

    // Aqui você faria a chamada à API do Mercado Pago no servidor.
    // NÃO exponha process.env.MP_ACCESS_TOKEN ao navegador.
    return res.json({
      message:"Endpoint de exemplo. Configure sua integração de assinatura aqui.",
      plan,
      payerEmail
    });
  }catch(e){
    res.status(500).json({error:"Erro interno"});
  }
});

app.post("/api/webhook/mercadopago", (req,res)=>{
  // Em produção: validar assinatura/headers e consultar o status do pagamento.
  console.log("Webhook recebido:", req.body);
  res.sendStatus(200);
});

app.listen(3000,()=>console.log("API em http://localhost:3000"));
