import { writable } from 'svelte/store';

export const materialLight = {
    base: '#ffffff',
    mantle: '#f5f5f5',
    crust: '#e0e0e0',
    text: '#212121',
    subtext: '#757575',
    overlay: '#9e9e9e',
    surface0: '#eeeeee',
    surface1: '#e0e0e0',
    surface2: '#bdbdbd',
    blue: '#2196f3',
    lavender: '#7e57c2',
    sapphire: '#00bcd4',
    green: '#4caf50',
    yellow: '#ffeb3b',
    peach: '#ff9800',
    red: '#f44336',
    maroon: '#e91e63',
    pink: '#e91e63',
    flamingo: '#ff5722',
    rosewater: '#ff8a80',
};

export const materialDark = {
    base: '#121212',
    mantle: '#1e1e1e',
    crust: '#242424',
    text: '#ffffff',
    subtext: '#b0b0b0',
    overlay: '#5c5c5c',
    surface0: '#2c2c2c',
    surface1: '#363636',
    surface2: '#404040',
    blue: '#64b5f6',
    lavender: '#b39ddb',
    sapphire: '#4dd0e1',
    green: '#81c784',
    yellow: '#fff176',
    peach: '#ffb74d',
    red: '#e57373',
    maroon: '#f06292',
    pink: '#f06292',
    flamingo: '#ff8a65',
    rosewater: '#ffab91',
};

export const catppuccinMocha = {
    base: '#1e1e2e',
    mantle: '#181825',
    crust: '#11111b',
    text: '#cdd6f4',
    subtext: '#a6adc8',
    overlay: '#6c7086',
    surface0: '#313244',
    surface1: '#45475a',
    surface2: '#585b70',
    blue: '#89b4fa',
    lavender: '#b4befe',
    sapphire: '#74c7ec',
    green: '#a6e3a1',
    yellow: '#f9e2af',
    peach: '#fab387',
    red: '#f38ba8',
    maroon: '#eba0ac',
    pink: '#f5c2e7',
    flamingo: '#f2cdcd',
    rosewater: '#f5e0dc',
};

export type Theme = {
    base: string;
    mantle: string;
    crust: string;
    text: string;
    subtext: string;
    overlay: string;
    surface0: string;
    surface1: string;
    surface2: string;
    blue: string;
    lavender: string;
    sapphire: string;
    green: string;
    yellow: string;
    peach: string;
    red: string;
    maroon: string;
    pink: string;
    flamingo: string;
    rosewater: string;
};

export type ThemeOption = {
    name: string;
    theme: Theme;
};

export const themes: ThemeOption[] = [
    { name: 'Material Light', theme: materialLight },
    { name: 'Material Dark', theme: materialDark },
    { name: 'Catppuccin Mocha', theme: catppuccinMocha },
];

function getSavedTheme(): ThemeOption {
    if (typeof localStorage !== 'undefined') {
        const savedTheme = localStorage.getItem('baobox-theme');
        if (savedTheme) {
            const theme = themes.find(t => t.name === savedTheme);
            if (theme) return theme;
        }
    }
    return themes[2]; // Default to Catppuccin Mocha
}

// Create the theme store
function createThemeStore() {
    const { subscribe, set } = writable<ThemeOption>(getSavedTheme());

    return {
        subscribe,
        setTheme: (theme: ThemeOption) => {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('baobox-theme', theme.name);
            }
            applyTheme(theme.theme);
            set(theme);
        }
    };
}

// Apply theme to document
function applyTheme(theme: Theme) {
    if (typeof document === 'undefined') return;

    // Apply CSS variables
    Object.entries(theme).forEach(([key, value]) => {
        document.documentElement.style.setProperty(`--${key}`, value);
    });

    // Set background colors
    document.documentElement.style.backgroundColor = theme.mantle;
    document.body.style.backgroundColor = theme.mantle;
}

// Export the theme store
export const currentTheme = createThemeStore();

// Initialize theme when the module loads
if (typeof window !== 'undefined') {
    const theme = getSavedTheme();
    applyTheme(theme.theme);
}
