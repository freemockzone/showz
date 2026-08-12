/* =========================================================
   SHOWZ - CORE APPLICATION SCRIPT
   ========================================================= */

// Global State
let allMovies = [];
let filteredMovies = [];
const itemsPerPage = 30; // STRICT LIMIT: Only load 30 items per page
let currentPage = 1;

// DOM Elements
const movieGrid = document.getElementById('movie-grid');
const paginationContainer = document.getElementById('pagination');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const genreDropdown = document.getElementById('genre-dropdown');
const categoryTitle = document.getElementById('current-category-title');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');
const backToTopBtn = document.getElementById("backToTopBtn");

/* =========================================================
   1. FETCH JSON DATA
   ========================================================= */
async function fetchMovies() {
    try {
        // Ensure your JSON file is named 'movies.json' in your directory
        const response = await fetch('movies.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        allMovies = await response.json();
        filteredMovies = [...allMovies];
        
        setupGenres();
        renderPage(currentPage);
    } catch (error) {
        console.error("Error loading JSON data:", error);
        if (movieGrid) {
            movieGrid.innerHTML = `
                <div style="text-align: center; width: 100%; color: #ff4d4d; padding: 40px 0; grid-column: 1 / -1;">
                    <h3>Failed to load movies</h3>
                    <p style="color: #aaa; font-size: 14px;">Ensure your JSON file is named 'movies.json' and is valid.</p>
                </div>
            `;
        }
    }
}

/* =========================================================
   2. DYNAMIC ALPHABETICAL GENRE POPULATION
   ========================================================= */
function setupGenres() {
    if (!genreDropdown) return;
    
    let genresSet = new Set();
    
    // Extract unique genres from all items
    allMovies.forEach(item => {
        if (Array.isArray(item.genres)) {
            item.genres.forEach(g => genresSet.add(g.trim()));
        }
    });

    // Sort alphabetically
    const sortedGenres = Array.from(genresSet).sort();

    genreDropdown.innerHTML = ''; // Clear container

    sortedGenres.forEach(genre => {
        const a = document.createElement('a');
        a.href = '#';
        a.innerText = genre;
        a.setAttribute('role', 'button');
        
        a.addEventListener('click', (e) => {
            e.preventDefault();
            filterByGenre(genre);
            closeMobileMenu();
        });
        
        genreDropdown.appendChild(a);
    });
}

/* =========================================================
   3. FILTERING & CATEGORY HANDLERS
   ========================================================= */
function filterByCategory(category) {
    if (category === 'home') {
        filteredMovies = [...allMovies];
        categoryTitle.innerText = "Latest HD Uploads";
    } else {
        filteredMovies = allMovies.filter(item => 
            Array.isArray(item.category) && 
            item.category.some(c => c.toLowerCase() === category.toLowerCase())
        );
        categoryTitle.innerText = `${category} Collection`;
    }
    
    currentPage = 1; // Reset to page 1
    renderPage(currentPage);
}

function filterByGenre(genre) {
    filteredMovies = allMovies.filter(item => 
        Array.isArray(item.genres) && item.genres.includes(genre)
    );
    categoryTitle.innerText = `Genre: ${genre}`;
    currentPage = 1;
    renderPage(currentPage);
}

/* =========================================================
   4. LIVE SEARCH FUNCTIONALITY
   ========================================================= */
function handleLiveSearch() {
    if (!searchInput) return;
    
    const query = searchInput.value.toLowerCase().trim();

    if (query === '') {
        filteredMovies = [...allMovies];
        if(categoryTitle) categoryTitle.innerText = "Latest HD Uploads";
    } else {
        filteredMovies = allMovies.filter(item => {
            const titleMatch = item.title && item.title.toLowerCase().includes(query);
            const yearMatch = item.year && item.year.toString().includes(query);
            const genreMatch = Array.isArray(item.genres) && item.genres.some(g => g.toLowerCase().includes(query));
            const categoryMatch = Array.isArray(item.category) && item.category.some(c => c.toLowerCase().includes(query));
            
            // Keyword match for organic search improvements
            const keywordMatch = Array.isArray(item.keywords) && item.keywords.some(k => k.toLowerCase().includes(query));

            return titleMatch || yearMatch || genreMatch || categoryMatch || keywordMatch;
        });

        if(categoryTitle) categoryTitle.innerText = `Search Results for "${query}" (${filteredMovies.length})`;
    }

    currentPage = 1; // Reset to page 1 for search results
    renderPage(currentPage);
}

if (searchInput) {
    searchInput.addEventListener('input', handleLiveSearch);
}

if (searchBtn) {
    searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleLiveSearch();
    });
}

/* =========================================================
   5. NAVIGATION CLICKS
   ========================================================= */
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const filter = e.target.getAttribute('data-filter');
        if (filter) {
            filterByCategory(filter);
            closeMobileMenu();
        }
    });
});

const logoLink = document.querySelector('.logo');
if (logoLink) {
    logoLink.addEventListener('click', (e) => {
        e.preventDefault();
        filterByCategory('home');
        closeMobileMenu();
    });
}

/* =========================================================
   6. GRID & STRICT PAGINATION RENDERER
   ========================================================= */
function renderPage(page) {
    if (!movieGrid) return;
    movieGrid.innerHTML = ''; // Clear current grid

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToShow = filteredMovies.slice(startIndex, endIndex);

    if (itemsToShow.length === 0) {
        movieGrid.innerHTML = `
            <div style="text-align: center; width: 100%; color: var(--text-muted); grid-column: 1 / -1; padding: 60px 0;">
                <p style="font-size: 18px;">No movies or series found matching your criteria.</p>
            </div>
        `;
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    // Render cards
    itemsToShow.forEach(item => {
        // Change from div to anchor <a> tag for perfect SEO and hover preview links
        const card = document.createElement('a');
        card.classList.add('movie-card');
        card.href = item.pageurl || '#'; // Assign URL directly to the href attribute
        card.title = `Watch ${item.title}`;

        card.innerHTML = `
            <div class="type-badge">${item.type || 'Movie'}</div>
            <div class="imdb-badge">★ ${item.imdb || 'N/A'}</div>
            <img src="${item.poster || 'https://via.placeholder.com/300x450/222/fff?text=No+Poster'}" alt="${item.title} Poster" loading="lazy">
            <div class="movie-info">
                <div class="movie-title">${item.title}</div>
                <div class="movie-meta">${item.year}</div>
            </div>
        `;

        movieGrid.appendChild(card);
    });

    renderPagination();
}

function renderPagination() {
    if (!paginationContainer) return;
    paginationContainer.innerHTML = '';
    const totalPages = Math.ceil(filteredMovies.length / itemsPerPage);

    if (totalPages <= 1) return; // Hide pagination if only 1 page exists

    // Previous Page Button
    const prevBtn = document.createElement('button');
    prevBtn.classList.add('page-btn');
    prevBtn.innerText = '« Prev';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderPage(currentPage);
            scrollToContent();
        }
    });
    paginationContainer.appendChild(prevBtn);

    // Numbered Page Buttons
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.classList.add('page-btn');
        if (i === currentPage) pageBtn.classList.add('active');
        pageBtn.innerText = i;
        pageBtn.addEventListener('click', () => {
            currentPage = i;
            renderPage(currentPage);
            scrollToContent();
        });
        paginationContainer.appendChild(pageBtn);
    }

    // Next Page Button
    const nextBtn = document.createElement('button');
    nextBtn.classList.add('page-btn');
    nextBtn.innerText = 'Next »';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderPage(currentPage);
            scrollToContent();
        }
    });
    paginationContainer.appendChild(nextBtn);
}

function scrollToContent() {
    const mainSection = document.querySelector('.main-content');
    if (mainSection) {
        mainSection.scrollIntoView({ behavior: 'smooth' });
    }
}

/* =========================================================
   7. MOBILE HAMBURGER MENU & DROPDOWN TOGGLES
   ========================================================= */
function closeMobileMenu() {
    if (navLinks) navLinks.classList.remove('active');
}

if (hamburger) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}

// Mobile Dropdown Toggle for Genres
const dropBtn = document.querySelector('.dropbtn');
if (dropBtn) {
    dropBtn.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            e.preventDefault();
            dropBtn.parentElement.classList.toggle('active');
        }
    });
}

/* =========================================================
   8. BACK TO TOP BUTTON LOGIC
   ========================================================= */
if (backToTopBtn) {
    window.addEventListener("scroll", () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add("show");
        } else {
            backToTopBtn.classList.remove("show");
        }
    });

    backToTopBtn.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}

/* =========================================================
   INITIALIZE APP
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
    // Only fetch movies if we are on a page with the movie grid (like index.html)
    if (document.getElementById('movie-grid')) {
        fetchMovies();
    }
});