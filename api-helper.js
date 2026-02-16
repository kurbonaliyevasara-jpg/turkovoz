// API Helper - Intercepts and updates all API calls
// ==========================================

// Store original fetch
const originalFetch = window.fetch;

// Override fetch to add JWT token to all API requests
window.fetch = function(...args) {
    let url = args[0];
    let options = args[1] || {};
    
    // Convert http://localhost:3001 URLs to CONFIG.API_URL
    if (typeof url === 'string' && url.includes('localhost:3001')) {
        url = url.replace('http://localhost:3001/api', CONFIG.API_URL);
    }
    
    // Add JWT token to headers
    if (typeof url === 'string' && url.includes('/api')) {
        options.headers = options.headers || {};
        const token = CONFIG.getToken();
        
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Ensure Content-Type is set for JSON requests
        if (options.body && !options.headers['Content-Type']) {
            options.headers['Content-Type'] = 'application/json';
        }
    }
    
    // Handle 401/403 responses (unauthorized/forbidden)
    return originalFetch.call(this, url, options).then(response => {
        if (response.status === 401 || response.status === 403) {
            // Token invalid or expired - clear session and redirect to login
            CONFIG.logout();
        }
        return response;
    });
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Only redirect for main app (index.html), not for admin.html or login.html
    const currentPage = window.location.pathname;
    
    if (currentPage === '/' || currentPage.includes('index.html')) {
        // Check if user has valid token for main app
        const token = CONFIG.getToken();
        const user = CONFIG.getUser();
        
        if (!token || !user) {
            // Redirect to login if no token
            window.location.href = '/login.html';
        }
    }
});
