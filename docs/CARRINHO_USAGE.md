# Como Utilizar o Carrinho

Este guia documenta o fluxo de carrinho disponivel na pagina de `Vendedor` e na pagina dedicada `Carrinho`.

## Localizacao

```txt
src/contexts/CartContext.jsx
src/Pages/Perfis/Vendedor/Vendedor.jsx
src/Pages/Carrinho/Carrinho.jsx
src/components/MenuTopo/MenuTopo.jsx
src/Rotas.jsx
```

## Fluxo Atual

1. O usuario adiciona itens na pagina da banca (`/bancas/:bancaId`).
2. Produtos de bancas diferentes permanecem no carrinho, **agrupados por banca**.
3. O botao fixo no topo (`MenuTopo`) mostra a quantidade total de itens (todas as bancas).
4. No mobile, o botao fixo mostra apenas icone + quantidade.
5. A pagina `/carrinho` exibe cada banca em um bloco separado com:
   - lista de produtos da banca;
   - subtotal da banca;
   - link para voltar aos produtos da banca;
   - selecao de vendedor (WhatsApp) daquela banca;
   - botao para enviar pedido apenas daquela banca;
   - opcao de limpar apenas aquela banca.
6. No rodape do carrinho:
   - total geral de todas as bancas;
   - botao **Voltar as bancas** (`/bancas`);
   - botao para limpar o carrinho inteiro.

## Dados do Item no Carrinho

Cada item salvo no carrinho contem:

```js
{
  id: "produto_id",
  nome: "Nome do Produto",
  preco: 12.5,
  unidade: "kg", // un, kg, g, l, ml, dz, maco, bandeja
  quantity: 1
}
```

## Estrutura por Banca

O carrinho persiste um array de bancas:

```js
{
  bancas: [
    {
      bancaId: "id_da_banca",
      bancaNome: "Nome da Banca",
      vendedores: [{ id, nome, whatsapp, ... }],
      selectedWhatsapp: "5538999999999",
      items: [/* itens da banca */]
    }
  ]
}
```

## API do CartContext

| Metodo / valor | Descricao |
|----------------|-----------|
| `cart` | Estado completo com array `bancas` |
| `cartCount` | Soma de quantidades de todos os itens |
| `cartTotal` | Soma dos subtotais de todas as bancas |
| `addItem({ bancaId, bancaNome, vendedores, item })` | Adiciona ou incrementa item na banca |
| `setQuantity(bancaId, itemId, quantity)` | Altera quantidade; remove item se `quantity <= 0` |
| `removeItem(bancaId, itemId)` | Remove item da banca |
| `clearBanca(bancaId)` | Remove todos os itens de uma banca |
| `clearCart()` | Limpa todo o carrinho |
| `setSelectedWhatsapp(bancaId, phone)` | Define vendedor para envio da banca |
| `updateBancaContext({ bancaId, bancaNome, vendedores })` | Atualiza dados da banca ja presente no carrinho |

## Regra de Unidade por Item

- A unidade e definida na banca ao adicionar/editar o produto.
- A unidade aparece:
  - no card do produto da banca;
  - no resumo do carrinho;
  - na mensagem enviada ao WhatsApp.

## Mensagem de WhatsApp

Cada banca envia um pedido **separado** ao vendedor selecionado, contendo:

- nome do produto
- quantidade
- unidade
- preco unitario
- subtotal por item
- total do pedido da banca

O botao de envio fica desabilitado ate que um vendedor seja selecionado. Se o usuario tentar enviar sem vendedor, uma mensagem de aviso e exibida.

## Persistencia

- O carrinho e persistido em `localStorage` usando a chave `feira_cart_v2`.
- Carrinhos antigos (`feira_cart_v1`) sao migrados automaticamente na primeira leitura.
- Ao recarregar a pagina, os itens permanecem salvos.

## Observacoes

- Este arquivo cobre apenas o fluxo de carrinho.
- Regras de listagem de bancas e `BancaCard` permanecem em `BANCA_CARD_USAGE.md`.
