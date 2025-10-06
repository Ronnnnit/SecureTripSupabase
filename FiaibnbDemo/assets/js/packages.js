// Packages page functionality
document.addEventListener('DOMContentLoaded', () => {
    initializePackagesPage();
});

let filteredPackages = [...packages];

function initializePackagesPage() {
    setupFilters();
    renderPackages(packages);
    setupModal();
}

// Setup filter functionality
function setupFilters() {
    const searchInput = document.getElementById('search-input');
    const locationFilter = document.getElementById('location-filter');
    const priceFilter = document.getElementById('price-filter');
    
    // Populate location filter
    const locations = [...new Set(packages.map(pkg => pkg.location))];
    locations.forEach(location => {
        const option = document.createElement('option');
        option.value = location;
        option.textContent = location;
        locationFilter.appendChild(option);
    });
    
    // Add event listeners
    searchInput.addEventListener('input', applyFilters);
    locationFilter.addEventListener('change', applyFilters);
    priceFilter.addEventListener('change', applyFilters);
}

// Apply all filters
function applyFilters() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const selectedLocation = document.getElementById('location-filter').value;
    const selectedPriceRange = document.getElementById('price-filter').value;
    
    filteredPackages = packages.filter(pkg => {
        // Search filter
        const matchesSearch = pkg.title.toLowerCase().includes(searchTerm) ||
                            pkg.location.toLowerCase().includes(searchTerm) ||
                            pkg.description.toLowerCase().includes(searchTerm);
        
        // Location filter
        const matchesLocation = !selectedLocation || pkg.location === selectedLocation;
        
        // Price filter
        const matchesPrice = checkPriceRange(pkg.price, selectedPriceRange);
        
        return matchesSearch && matchesLocation && matchesPrice;
    });
    
    renderPackages(filteredPackages);
}

// Check if price matches selected range
function checkPriceRange(price, range) {
    if (!range) return true;
    
    switch (range) {
        case '0-500':
            return price <= 500;
        case '500-1000':
            return price > 500 && price <= 1000;
        case '1000-2000':
            return price > 1000 && price <= 2000;
        case '2000+':
            return price > 2000;
        default:
            return true;
    }
}

// Render packages grid
function renderPackages(packagesList) {
    const packagesGrid = document.getElementById('packages-grid');
    
    if (packagesList.length === 0) {
        packagesGrid.innerHTML = `
            <div class="packages-empty">
                <h2>No packages found</h2>
                <p>Try adjusting your filters or search terms.</p>
            </div>
        `;
        return;
    }
    
    packagesGrid.innerHTML = packagesList.map(pkg => `
        <div class="package-card">
            <div class="package-image" style="background-image: url('${pkg.image}')">
                <div class="package-price">${formatCurrency(pkg.price)}</div>
            </div>
            <div class="package-content">
                <h3>${pkg.title}</h3>
                <p class="package-location">${pkg.location}</p>
                <p class="package-description">${pkg.description}</p>
                <div class="package-actions">
                    <button class="view-details-btn" onclick="showPackageModal(${pkg.id})">
                        View Details
                    </button>
                    <button class="add-to-cart-btn" onclick="addToCart(${pkg.id})">
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Setup modal functionality
function setupModal() {
    const modal = document.getElementById('package-modal');
    const closeBtn = document.querySelector('.close');
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Show package details in modal
function showPackageModal(packageId) {
    const pkg = packages.find(p => p.id === packageId);
    if (!pkg) return;
    
    const modal = document.getElementById('package-modal');
    const modalBody = document.getElementById('modal-body');
    
    modalBody.innerHTML = `
        <div class="package-modal-content">
            <img src="${pkg.image}" alt="${pkg.title}">
            <h2>${pkg.title}</h2>
            <p class="location">${pkg.location}</p>
            <p class="price">${formatCurrency(pkg.price)}</p>
            <p class="description">${pkg.description}</p>
            <button class="cta-button" onclick="addToCart(${pkg.id}); document.getElementById('package-modal').style.display='none';">
                Add to Cart
            </button>
        </div>
    `;
    
    modal.style.display = 'block';
}
