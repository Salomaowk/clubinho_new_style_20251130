// Sample data for demonstration
const sampleData = [
    {
        id: 1,
        title: 'Clube de Leitura Aventura',
        category: 'clubs',
        description: 'Um espaço acolhedor para amantes de livros discutirem suas obras favoritas.',
        icon: '📚'
    },
    {
        id: 2,
        title: 'Clube de Fotografia',
        category: 'clubs',
        description: 'Explore o mundo através das lentes e compartilhe suas melhores capturas.',
        icon: '📷'
    },
    {
        id: 3,
        title: 'Festival de Música 2025',
        category: 'events',
        description: 'Grande evento com as melhores bandas locais e internacionais.',
        icon: '🎵'
    },
    {
        id: 4,
        title: 'Workshop de Programação',
        category: 'events',
        description: 'Aprenda as melhores práticas de desenvolvimento web moderno.',
        icon: '💻'
    },
    {
        id: 5,
        title: 'Maria Silva',
        category: 'members',
        description: 'Coordenadora do Clube de Leitura, apaixonada por literatura brasileira.',
        icon: '👤'
    },
    {
        id: 6,
        title: 'João Santos',
        category: 'members',
        description: 'Fotógrafo profissional e líder do Clube de Fotografia.',
        icon: '👤'
    },
    {
        id: 7,
        title: 'Clube de Culinária',
        category: 'clubs',
        description: 'Descubra novos sabores e aprenda receitas incríveis com chefs amadores.',
        icon: '🍳'
    },
    {
        id: 8,
        title: 'Torneio de Xadrez',
        category: 'events',
        description: 'Competição amistosa para jogadores de todos os níveis.',
        icon: '♟️'
    },
    {
        id: 9,
        title: 'Ana Costa',
        category: 'members',
        description: 'Organizadora de eventos e entusiasta de atividades ao ar livre.',
        icon: '👤'
    },
    {
        id: 10,
        title: 'Clube de Corrida',
        category: 'clubs',
        description: 'Grupo de corrida para todos os níveis, com treinos semanais.',
        icon: '🏃'
    }
];

// State management
let currentFilter = 'all';
let searchQuery = '';

// DOM elements
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const resultsContainer = document.getElementById('resultsContainer');
const resultsCount = document.getElementById('resultsCount');
const emptyState = document.getElementById('emptyState');
const filterButtons = document.querySelectorAll('.filter-btn');

// Initialize the app
function init() {
    setupEventListeners();
    displayResults(sampleData);
}

// Setup event listeners
function setupEventListeners() {
    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('input', handleSearchInput);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    filterButtons.forEach(btn => {
        btn.addEventListener('click', handleFilterClick);
    });
}

// Handle search input
function handleSearchInput(e) {
    searchQuery = e.target.value.toLowerCase();
    if (searchQuery === '') {
        const filteredData = filterData(sampleData);
        displayResults(filteredData);
    }
}

// Handle search button click
function handleSearch() {
    searchQuery = searchInput.value.toLowerCase();
    const filteredData = filterData(sampleData);
    displayResults(filteredData);
}

// Handle filter button click
function handleFilterClick(e) {
    const filter = e.target.dataset.filter;
    currentFilter = filter;

    // Update active state
    filterButtons.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');

    // Filter and display results
    const filteredData = filterData(sampleData);
    displayResults(filteredData);
}

// Filter data based on current filter and search query
function filterData(data) {
    let filtered = data;

    // Apply category filter
    if (currentFilter !== 'all') {
        filtered = filtered.filter(item => item.category === currentFilter);
    }

    // Apply search query
    if (searchQuery) {
        filtered = filtered.filter(item => {
            return item.title.toLowerCase().includes(searchQuery) ||
                   item.description.toLowerCase().includes(searchQuery);
        });
    }

    return filtered;
}

// Display results
function displayResults(data) {
    // Clear previous results
    resultsContainer.innerHTML = '';

    // Show/hide empty state
    if (data.length === 0) {
        emptyState.classList.remove('hidden');
        emptyState.querySelector('h2').textContent = 'Nenhum resultado encontrado';
        emptyState.querySelector('p').textContent = 'Tente ajustar sua busca ou filtros';
        resultsCount.textContent = '';
        return;
    } else {
        emptyState.classList.add('hidden');
    }

    // Update results count
    const countText = data.length === 1 ? '1 resultado encontrado' : `${data.length} resultados encontrados`;
    resultsCount.textContent = countText;

    // Create and append result cards
    data.forEach(item => {
        const card = createResultCard(item);
        resultsContainer.appendChild(card);
    });
}

// Create a result card element
function createResultCard(item) {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.onclick = () => handleResultClick(item);

    const categoryLabels = {
        clubs: 'Clube',
        events: 'Evento',
        members: 'Membro'
    };

    card.innerHTML = `
        <div class="result-header">
            <div class="result-icon ${item.category}">
                ${item.icon}
            </div>
            <div class="result-info">
                <h3 class="result-title">${highlightText(item.title, searchQuery)}</h3>
                <span class="result-category">${categoryLabels[item.category]}</span>
            </div>
        </div>
        <p class="result-description">${highlightText(item.description, searchQuery)}</p>
    `;

    return card;
}

// Highlight search query in text
function highlightText(text, query) {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<strong style="background-color: rgba(99, 102, 241, 0.2); font-weight: 600;">$1</strong>');
}

// Handle result card click
function handleResultClick(item) {
    console.log('Result clicked:', item);
    alert(`Você clicou em: ${item.title}\n\nCategoria: ${item.category}\n\nDescrição: ${item.description}`);
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export functions for potential use in other modules
window.ClubinhoBuscas = {
    addData: (newData) => {
        sampleData.push(...newData);
        const filteredData = filterData(sampleData);
        displayResults(filteredData);
    },
    clearSearch: () => {
        searchInput.value = '';
        searchQuery = '';
        const filteredData = filterData(sampleData);
        displayResults(filteredData);
    },
    setFilter: (filter) => {
        currentFilter = filter;
        const button = Array.from(filterButtons).find(btn => btn.dataset.filter === filter);
        if (button) {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        }
        const filteredData = filterData(sampleData);
        displayResults(filteredData);
    }
};
