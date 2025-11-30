# Clubinho Buscas - New Template

Uma interface moderna e responsiva para buscas no Clubinho, com design elegante e funcionalidade completa.

## 🎨 Características

- **Design Moderno**: Interface limpa e profissional com gradientes e animações suaves
- **Responsivo**: Funciona perfeitamente em desktop, tablet e mobile
- **Sistema de Filtros**: Filtre resultados por Clubes, Eventos ou Membros
- **Busca em Tempo Real**: Busque e visualize resultados instantaneamente
- **Highlight de Resultados**: Termos de busca são destacados nos resultados
- **Animações Suaves**: Transições fluidas e feedback visual

## 🚀 Como Usar

1. Abra o arquivo `index.html` em seu navegador
2. Digite sua busca no campo de pesquisa
3. Use os filtros para refinar os resultados
4. Clique em qualquer resultado para ver mais detalhes

## 📁 Estrutura de Arquivos

```
clubinho_new_style_20251130/
├── index.html      # Estrutura HTML principal
├── styles.css      # Estilos e design
├── script.js       # Lógica e funcionalidade
└── README.md       # Documentação
```

## 🎯 Funcionalidades

### Busca
- Busca em títulos e descrições
- Resultados em tempo real
- Destaque dos termos buscados

### Filtros
- **Todos**: Mostra todos os resultados
- **Clubes**: Filtra apenas clubes
- **Eventos**: Filtra apenas eventos
- **Membros**: Filtra apenas membros

### Interface
- Cards de resultados interativos
- Contagem de resultados
- Estado vazio amigável
- Design responsivo

## 🛠️ Personalização

### Cores
As cores principais podem ser alteradas no arquivo `styles.css` na seção `:root`:

```css
:root {
    --primary-color: #6366f1;
    --primary-hover: #4f46e5;
    --secondary-color: #8b5cf6;
    /* ... */
}
```

### Dados
Os dados de exemplo estão em `script.js` na variável `sampleData`. Você pode:
- Adicionar novos itens
- Conectar a uma API real
- Usar a função `window.ClubinhoBuscas.addData()` para adicionar dados dinamicamente

## 📱 Responsividade

O template é totalmente responsivo com breakpoints para:
- Desktop (> 768px)
- Tablet (768px - 481px)
- Mobile (< 480px)

## 🌐 Navegadores Suportados

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📄 Licença

© 2025 Clubinho Buscas. Todos os direitos reservados.
