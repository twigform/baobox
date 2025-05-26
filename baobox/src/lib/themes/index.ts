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

export const gruvbox = {
    base: '#282828',
    mantle: '#1d2021',
    crust: '#1b1b1b',
    text: '#ebdbb2',
    subtext: '#a89984',
    overlay: '#928374',
    surface0: '#32302f',
    surface1: '#3c3836',
    surface2: '#504945',
    blue: '#83a598',
    lavender: '#d3869b',
    sapphire: '#458588',
    green: '#b8bb26',
    yellow: '#fabd2f',
    peach: '#fe8019',
    red: '#fb4934',
    maroon: '#cc241d',
    pink: '#d3869b',
    flamingo: '#fe8019',
    rosewater: '#ebdbb2',
};

export const catppuccinLatte = {
    base: '#eff1f5',
    mantle: '#e6e9ef',
    crust: '#dce0e8',
    text: '#4c4f69',
    subtext: '#5c5f77',
    overlay: '#6c6f85',
    surface0: '#ccd0da',
    surface1: '#bcc0cc',
    surface2: '#acb0be',
    blue: '#1e66f5',
    lavender: '#7287fd',
    sapphire: '#209fb5',
    green: '#40a02b',
    yellow: '#df8e1d',
    peach: '#fe640b',
    red: '#d20f39',
    maroon: '#e64553',
    pink: '#ea76cb',
    flamingo: '#dd7878',
    rosewater: '#dc8a78',
};

export const dracula = {
    base: '#282a36',
    mantle: '#1e1f29',
    crust: '#191a21',
    text: '#f8f8f2',
    subtext: '#6272a4',
    overlay: '#44475a',
    surface0: '#343746',
    surface1: '#44475a',
    surface2: '#4d5066',
    blue: '#6272a4',
    lavender: '#bd93f9',
    sapphire: '#8be9fd',
    green: '#50fa7b',
    yellow: '#f1fa8c',
    peach: '#ffb86c',
    red: '#ff5555',
    maroon: '#ff79c6',
    pink: '#ff79c6',
    flamingo: '#ffb86c',
    rosewater: '#ffb86c',
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
    { name: 'Catppuccin Latte', theme: catppuccinLatte },
    { name: 'Gruvbox Dark', theme: gruvbox },
    { name: 'Dracula', theme: dracula },
];

function getSavedTheme(): ThemeOption {    if (typeof localStorage !== 'undefined') {
        const savedTheme = localStorage.getItem('baobox-theme');
        if (savedTheme) {
            const theme = themes.find(t => t.name === savedTheme);
            if (theme) return theme;
        }
    }
    return themes[1]; // Default to Material Dark
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
