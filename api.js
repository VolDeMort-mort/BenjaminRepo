const productsGrid = document.getElementById('products-grid');
const categoryFilter = document.getElementById('category-filter');
const priceSort = document.getElementById('price-sort');
const API_URL = 'https://dummyjson.com/products?limit=12';
let allProducts = [];
async function loadProducts() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Помилка завантаження');
        
        const data = await response.json();
        allProducts = data.products;
        populateCategories(allProducts);
        renderProducts(allProducts);
    } catch (error) {
        productsGrid.innerHTML = `<div class="error">⚠️ Помилка: ${error.message}</div>`;
    }
}
function renderProducts(products) {
    productsGrid.innerHTML = '';
    if (products.length === 0) {
        productsGrid.innerHTML = '<p>Товарів не знайдено</p>';
        return;
    }
    products.forEach(product => {
        const card = `
            <div class="product-card">
                <div class="image-container">
                    <img src="${product.thumbnail}" alt="${product.title}">
                </div>
                <div class="card-body">
                    <span class="category-badge">${product.category}</span>
                    <h3>${product.title}</h3>
                    <div class="price-row">
                        <span class="price">$${product.price}</span>
                        <button class="buy-btn">Купити</button>
                    </div>
                </div>
            </div>
        `;
        productsGrid.innerHTML += card;
    });
}
function populateCategories(products) {
    const categories = new Set(products.map(p => p.category));
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        categoryFilter.appendChild(option);
    });
}
function applyFilters() {
    let filtered = [...allProducts];
    const selectedCategory = categoryFilter.value;
    if (selectedCategory !== 'all') {
        filtered = filtered.filter(product => product.category === selectedCategory);
    }
    const sortType = priceSort.value;
    if (sortType === 'asc') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (sortType === 'desc') {
        filtered.sort((a, b) => b.price - a.price);
    }
    renderProducts(filtered);
}
categoryFilter.addEventListener('change', applyFilters);
priceSort.addEventListener('change', applyFilters);
loadProducts();