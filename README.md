# Catálogo Web

**Versão atual:** `2.2.1` — carrinho multi-banca, pedidos por WhatsApp e persistência local.

Catálogo online para divulgação de feirantes e seus produtos, com fluxo de pedidos via WhatsApp. Desenvolvido com React, Tailwind CSS e Firebase.

## ✨ Funcionalidades

- Listagem de bancas, vendedores e produtos
- Catálogo por categorias (somente visualização dos produtos disponíveis)
- Carrinho de compras multi-banca com persistência local (`localStorage`)
- Pedidos separados por banca, cada um com vendedor e WhatsApp próprios
- Página dedicada do carrinho (`/carrinho`) com ajuste de quantidades e envio de pedido
- Botão fixo de carrinho no topo com contagem total de itens
- Pedido com mensagem automática no WhatsApp do vendedor
- Preço por produto definido na banca
- Tipo de venda por item (unidade, kg, g, litro, ml, dúzia, maço, bandeja)
- Gestão administrativa de produtos por banca (adicionar, editar preço/unidade e remover)
- Login com Firebase Authentication (Google)
- Carrossel e imagens com fallback visual para melhor experiência

## 🚀 Tecnologias Utilizadas

- **React**
- **Tailwind CSS**
- **Firebase Authentication**
- **Firebase Firestore**
- **React Router**
- **Context API** (Auth e Carrinho)
- **Vercel** (deploy)

## 🛒 Fluxo de preço e carrinho

1. As **categorias** funcionam como catálogo geral de itens.
2. O **preço** e o **tipo de venda** (kg, un, etc.) são configurados na **banca**.
3. O cliente adiciona itens na página da banca (`/bancas/:bancaId`).
4. Produtos de **bancas diferentes** permanecem no carrinho, agrupados por banca.
5. Na página `/carrinho`, cada banca aparece em um bloco com:
   - produtos e subtotal da banca;
   - seleção do vendedor (WhatsApp);
   - envio do pedido apenas daquela banca.
6. O pedido inclui produto, quantidade, unidade, preço e subtotal por item, além do total da banca.

### Rotas relacionadas

| Rota | Descrição |
|------|-----------|
| `/bancas` | Listagem de bancas |
| `/bancas/:bancaId` | Página da banca (adicionar produtos ao carrinho) |
| `/carrinho` | Carrinho com pedidos agrupados por banca |

## ⚙️ Como rodar localmente

```bash
npm install
npm run dev
```

Para gerar build de produção:

```bash
npm run build
```

Para verificar lint:

```bash
npm run lint
```

## 📚 Documentação Técnica

- `docs/BANCA_CARD_USAGE.md` — Guia do componente de card de bancas.
- `docs/CARRINHO_USAGE.md` — Fluxo do carrinho multi-banca, estrutura de dados, unidade por item e WhatsApp.
- `src/components/MenuTopo/README.md` — Estrutura modular do menu superior (inclui botão do carrinho).

## 📦 Acesse o Projeto

🔗 [Site publicado](https://feiralivre.vercel.app/)

📂 Repositório: [github.com/Wendley007/catalogo-web](https://github.com/Wendley007/catalogo-web)

## 🙋‍♂️ Autor

Desenvolvido por **Wendley Santos**  
[GitHub](https://github.com/Wendley007) | [LinkedIn](https://www.linkedin.com/in/wendley-santos-248159219)

---

> “Construindo com código, sonhando com propósito.”
