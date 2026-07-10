# Como Utilizar o Componente BancaCard

O componente `BancaCard` foi criado para padronizar e reutilizar a exibicao de cards de bancas na pagina de bancas e em listagens relacionadas. Ele substitui codigo duplicado de layout e comportamento.

## Localizacao

```
src/components/BancaCard/
- BancaCard.jsx    # Componente principal
- index.js         # Arquivo de exportacao
```

## Importacao

```jsx
import BancaCard from "../../components/BancaCard";
```

## Propriedades Disponiveis

| Propriedade | Tipo | Padrao | Descricao |
|-------------|------|--------|-----------|
| `banca` | Object | **Obrigatorio** | Dados da banca |
| `index` | number | 0 | Indice para animacao |
| `showAdminControls` | boolean | false | Mostrar controles de admin |
| `showVendedoresDropdown` | boolean | true | Mostrar dropdown de vendedores |
| `onEditBanca` | Function | - | Funcao para editar banca (admin) |
| `onDeleteBanca` | Function | - | Funcao para deletar banca (admin) |
| `onSelectVendedores` | Function | - | Funcao para selecionar vendedores |
| `selectedBanca` | string | - | ID da banca selecionada |
| `whatsappMessage` | string | Mensagem padrao | Mensagem para WhatsApp |
| `acessarBancaText` | string | "Acessar Banca" | Texto do botao |
| `verVendedoresText` | string | "Ver Vendedores" | Texto do botao |
| `fecharVendedoresText` | string | "Fechar Vendedores" | Texto do botao |

## Estrutura de Dados da Banca

```javascript
const banca = {
  id: "banca_id",
  nome: "Nome da Banca",
  vendedores: [
    {
      id: "vendedor_id",
      nome: "Nome do Vendedor",
      cidade: "Cidade do Vendedor",
      whatsapp: "5538999999999",
      images: [
        {
          url: "https://exemplo.com/imagem.jpg"
        }
      ]
    }
  ]
};
```

## Exemplos de Uso

### 1. **Uso Basico (Pagina Principal)**

```jsx
import BancaCard from "../../components/BancaCard";

const PaginaPrincipal = () => {
  const [bancas, setBancas] = useState([]);
  const [selectedBanca, setSelectedBanca] = useState(null);

  const handleSelectVendedores = (bancaId) => {
    setSelectedBanca(selectedBanca === bancaId ? null : bancaId);
  };

  return (
    <article className="grid grid-cols-1 mt-6 gap-8 md:grid-cols-3 lg:grid-cols-3 mx-2">
      {bancas.map((banca, index) => (
        <BancaCard
          key={banca.id}
          banca={banca}
          index={index}
          showAdminControls={false}
          showVendedoresDropdown={true}
          onSelectVendedores={handleSelectVendedores}
          selectedBanca={selectedBanca}
          whatsappMessage="Ola! Vi sua banca no site da Feira de Buritizeiro e fiquei interessado!"
          acessarBancaText="Acessar banca"
          verVendedoresText="Ver Vendedores"
          fecharVendedoresText="Fechar Vendedores"
        />
      ))}
    </article>
  );
};
```

### 2. **Com Controles de Admin (Pagina de Bancas)**

```jsx
import BancaCard from "../../../components/BancaCard";

const Bancas = () => {
  const { user } = useContext(AuthContext);
  const [selectedBanca, setSelectedBanca] = useState(null);
  const [selectedBancaToEdit, setSelectedBancaToEdit] = useState(null);
  const [selectedBancaToDelete, setSelectedBancaToDelete] = useState(null);

  const handleSelectVendedores = (bancaId) => {
    setSelectedBanca(selectedBanca === bancaId ? null : bancaId);
  };

  return (
    <article className="grid grid-cols-1 mt-6 gap-8 md:grid-cols-3 lg:grid-cols-3 mx-2">
      {filteredBancas.map((banca, index) => (
        <BancaCard
          key={banca.id}
          banca={banca}
          index={index}
          showAdminControls={user && user.role === "admin"}
          showVendedoresDropdown={true}
          onEditBanca={(banca) => {
            setSelectedBancaToEdit(banca);
            setNewBancaName(banca.nome);
          }}
          onDeleteBanca={(banca) => setSelectedBancaToDelete(banca)}
          onSelectVendedores={handleSelectVendedores}
          selectedBanca={selectedBanca}
          whatsappMessage={`Ola! Vi essa ${banca?.nome} no site da Feira de Buritizeiro e fiquei interessado!`}
          acessarBancaText="Acessar Banca"
          verVendedoresText="Ver Vendedores"
          fecharVendedoresText="Fechar Vendedores"
        />
      ))}
    </article>
  );
};
```

### 3. **Sem Dropdown de Vendedores**

```jsx
<BancaCard
  banca={banca}
  index={index}
  showAdminControls={false}
  showVendedoresDropdown={false}
  whatsappMessage="Mensagem personalizada para WhatsApp"
/>
```

### 4. **Com Mensagem Personalizada**

```jsx
<BancaCard
  banca={banca}
  index={index}
  whatsappMessage="Ola! Vi sua banca no site e gostaria de fazer um pedido!"
  acessarBancaText="Ver Detalhes"
  verVendedoresText="Ver Todos"
  fecharVendedoresText="Fechar"
/>
```

## Funcionalidades Automaticas

O componente `BancaCard` inclui automaticamente:

### **Animacoes**
- Animacao de entrada com delay baseado no indice
- Hover effects com scale
- Animacoes suaves no dropdown

### **Responsividade**
- Layout responsivo com grid
- Adaptacao para diferentes tamanhos de tela

### **Acessibilidade**
- Titulos e descricoes para screen readers
- Navegacao por teclado
- Contraste adequado

### **Funcionalidades**
- Dropdown de vendedores adicionais
- Links para WhatsApp
- Navegacao para pagina da banca
- Controles de admin (quando habilitado)

## Personalizacao

### **Estilos Customizados**

O componente usa classes do Tailwind CSS. Para personalizar:

```jsx
// No componente BancaCard.jsx
className="bg-white rounded-xl shadow-xl hover:shadow-xl transition-all duration-300 transform hover:scale-105"
```

### **Mensagens Personalizadas**

```jsx
<BancaCard
  banca={banca}
  whatsappMessage="Mensagem personalizada para WhatsApp"
  acessarBancaText="Ver Detalhes"
  verVendedoresText="Ver Todos"
  fecharVendedoresText="Fechar"
/>
```

### **Controles Condicionais**

```jsx
<BancaCard
  banca={banca}
  showAdminControls={user?.role === "admin"}
  showVendedoresDropdown={banca.vendedores.length > 1}
/>
```

## Funcionalidades do Dropdown

### **Vendedores Adicionais**
- Mostra vendedores alem do principal
- Botao WhatsApp individual para cada vendedor
- Fechamento automatico ao clicar fora

### **Controles de Admin**
- Botoes de editar e excluir
- Integracao com modais de confirmacao
- Atualizacao automatica da lista

## Tratamento de Erros

O componente trata automaticamente:

- **Vendedores sem imagem**: Usa imagem padrao
- **Vendedores sem WhatsApp**: Nao mostra botao WhatsApp
- **Bancas sem vendedores**: Mostra mensagem informativa
- **Dados incompletos**: Fallbacks para campos obrigatorios

## Checklist de Implementacao

Para usar o componente `BancaCard`:

- [ ] Importar o componente
- [ ] Definir estado para `selectedBanca` (se usar dropdown)
- [ ] Criar funcao `handleSelectVendedores` (se usar dropdown)
- [ ] Passar dados da banca no formato correto
- [ ] Configurar props conforme necessidade
- [ ] Testar responsividade
- [ ] Verificar funcionalidades de admin (se aplicavel)

## Migracao de Codigo Existente

Para migrar codigo existente:

1. **Substituir o JSX do card** pelo componente `BancaCard`
2. **Manter as funcoes** de estado e handlers
3. **Passar as props** necessarias
4. **Remover codigo duplicado** de animacoes e estilos
5. **Testar funcionalidades** especificas de cada pagina

## Beneficios

- **Codigo reutilizavel** e padronizado
- **Manutencao simplificada**
- **Consistencia visual**
- **Performance otimizada**
- **Funcionalidades centralizadas**
- **Facil personalizacao**

## Escopo Deste Guia

- Este arquivo documenta apenas o uso do `BancaCard` na experiencia de bancas.
- Regras de carrinho, pedido, preco e categoria devem ser documentadas em arquivos proprios.
- Para carrinho, consulte: `docs/CARRINHO_USAGE.md`.