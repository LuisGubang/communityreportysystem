/* Theme Switcher JavaScript */
// Add this to your HTML before the closing </body> tag
// or include it as a separate file

class ThemeSwitcher {
    constructor() {
        this.themes = {
            'apple-light': 'css/theme-apple-light.css',
            'apple-dark': 'css/theme-apple-dark.css',
            'glassmorphism': 'css/theme-glassmorphism.css',
            'vscode-premium': 'css/theme-vscode-premium.css'
        };
        this.currentTheme = localStorage.getItem('selectedTheme') || 'vscode-premium';
        this.init();
    }

    init() {
        this.loadTheme(this.currentTheme);
        this.createThemeSwitcher();
    }

    loadTheme(themeName) {
        if (!this.themes[themeName]) {
            console.warn(`Theme ${themeName} not found`);
            return;
        }

        // Remove old theme CSS if exists
        const oldLink = document.getElementById('theme-css');
        if (oldLink) oldLink.remove();

        // Create new theme link
        const link = document.createElement('link');
        link.id = 'theme-css';
        link.rel = 'stylesheet';
        link.href = this.themes[themeName];
        document.head.appendChild(link);

        // Save to localStorage
        localStorage.setItem('selectedTheme', themeName);
        this.currentTheme = themeName;

        // Update UI if switcher exists
        const buttons = document.querySelectorAll('.theme-btn');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.theme === themeName) {
                btn.classList.add('active');
            }
        });
    }

    createThemeSwitcher() {
        // Create theme switcher container
        const container = document.createElement('div');
        container.className = 'theme-switcher-container';
        container.innerHTML = `
            <style>
                .theme-switcher-container {
                    position: fixed;
                    bottom: 30px;
                    right: 30px;
                    z-index: 1000;
                    background: rgba(0,0,0,0.8);
                    border-radius: 12px;
                    padding: 12px;
                    backdrop-filter: blur(10px);
                }

                .theme-switcher {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                    max-width: 200px;
                }

                .theme-btn {
                    padding: 8px 12px;
                    border: 2px solid #666;
                    border-radius: 6px;
                    background: transparent;
                    color: #fff;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                }

                .theme-btn:hover {
                    border-color: #007acc;
                }

                .theme-btn.active {
                    background: #007acc;
                    border-color: #007acc;
                }
            </style>
            <div class="theme-switcher">
                <button class="theme-btn" data-theme="apple-light">🍎 Light</button>
                <button class="theme-btn" data-theme="apple-dark">🌙 Dark</button>
                <button class="theme-btn" data-theme="glassmorphism">✨ Glass</button>
                <button class="theme-btn" data-theme="vscode-premium">💻 Code</button>
            </div>
        `;

        document.body.appendChild(container);

        // Attach event listeners
        const buttons = container.querySelectorAll('.theme-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.loadTheme(btn.dataset.theme);
            });
        });

        // Set active button
        const activeBtn = container.querySelector(`[data-theme="${this.currentTheme}"]`);
        if (activeBtn) activeBtn.classList.add('active');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ThemeSwitcher();
    });
} else {
    new ThemeSwitcher();
}
