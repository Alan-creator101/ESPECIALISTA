# Especialista AI — SaaS de Otimização de Anúncios de Marketplace

Este repositório agora inclui um **modo funcional sem dependências externas** para você ver o SaaS rodando imediatamente no navegador.


## Se você ficou preso na tela “Welcome to Node.js”

Você abriu o **Node.js REPL**. Essa tela é só para testar JavaScript, não é o terminal correto para rodar `npm install` ou `npm run dev`.

Faça assim no Windows:

1. Na tela preta que mostra `Welcome to Node.js`, digite:

```text
.exit
```

ou aperte `Ctrl + C` duas vezes.

2. Abra o **Prompt de Comando**, **PowerShell** ou **Terminal do Windows**.
3. Entre na pasta do projeto. Exemplo:

```bat
cd C:\caminho\para\ESPECIALISTA
```

4. Rode:

```bat
npm install
npm run dev
```

5. Abra no navegador:

```text
http://localhost:3000
```

### Forma mais fácil no Windows

Também adicionei o arquivo:

```text
INICIAR_WINDOWS.bat
```

No Windows, você pode dar **duplo clique** nele. Ele instala/prepara o projeto, abre o navegador e inicia o servidor automaticamente.


## Erro: `'INICIAR_WINDOWS.bat' não é reconhecido`

Esse erro acontece quando você está no terminal em uma pasta diferente da pasta do projeto. Na imagem, o terminal está em:

```text
C:\Users\anafl
```

Mas o arquivo `INICIAR_WINDOWS.bat` só funciona se você estiver **dentro da pasta `ESPECIALISTA`** ou se der duplo clique nele pelo Explorador de Arquivos.

### O jeito mais fácil

1. Abra o **Explorador de Arquivos**.
2. Encontre a pasta **ESPECIALISTA** onde você baixou/salvou o projeto.
3. Entre na pasta.
4. Dê duplo clique em:

```text
INICIAR_WINDOWS.bat
```

### Se quiser usar o terminal

Primeiro entre na pasta correta. Exemplos:

```bat
cd %USERPROFILE%\Downloads\ESPECIALISTA
INICIAR_WINDOWS.bat
```

ou, se estiver na Área de Trabalho:

```bat
cd %USERPROFILE%\Desktop\ESPECIALISTA
INICIAR_WINDOWS.bat
```

Também adicionei o arquivo `COMO_ABRIR_WINDOWS.txt` com esses passos em formato simples para abrir no Bloco de Notas.

## Como ver funcionando

```bash
npm install
npm run dev
```

Abra:

```text
http://localhost:3000
```

Login demo admin:

```text
admin@especialista.ai
Admin123!
```

> O banco local é um arquivo JSON em `data/db.json`, criado automaticamente na primeira execução.

## O que funciona no demo

- Frontend completo em uma SPA servida pelo Node.
- Backend HTTP em Node puro, sem pacotes externos.
- Autenticação com cookie de sessão HTTP-only.
- Cadastro de usuário com bônus de 10 créditos.
- Login admin demo com 50 créditos.
- Sistema de créditos:
  - etapa 1 consome 1 crédito;
  - etapa 2 consome 2 créditos;
  - plano pago mock adiciona créditos.
- Planos pagos mock no painel.
- Painel admin para criar planos.
- Área RAG para salvar documentos/base de conhecimento.
- Geração da etapa 1 com exatamente 4 versões resumidas:
  - Dor;
  - Benefício;
  - Diferencial;
  - Uso específico.
- Expansão da etapa 2 somente após escolha da versão.
- Cálculo de margem com custo, comissão, frete, embalagem, ads e impostos.
- Classificação de margem: Lucrativo, Sustentação ou Destruidor de margem.
- Exportação do anúncio em Markdown.

## Fluxo obrigatório implementado

1. Usuário informa produto e dados essenciais:
   - nome do produto;
   - custo;
   - preço de venda;
   - marketplace;
   - frete;
   - comissão;
   - ads;
   - impostos;
   - embalagem;
   - diferencial;
   - público;
   - concorrência;
   - logística.
2. O sistema gera apenas a etapa 1 com 4 versões resumidas.
3. Usuário escolhe uma versão.
4. O sistema gera a etapa 2 com anúncio completo.
5. O anúncio fica salvo no banco JSON.
6. Créditos são descontados no ledger local.
7. O anúncio pode ser exportado.

## Teste automatizado

```bash
npm test
```

O teste sobe o servidor, faz login, salva documento RAG, gera etapa 1, expande etapa 2 e valida exportação.

## Observação sobre OpenAI/Next/Prisma

A versão anterior tinha scaffold Next.js/Prisma/OpenAI, mas o ambiente bloqueou instalação de dependências (`403` no registry para `@prisma/client`). Para atender ao pedido de ver em funcionamento, adicionei este modo Node puro executável imediatamente. Os arquivos do scaffold continuam no repositório como base para uma evolução com dependências reais quando o registry estiver liberado.
