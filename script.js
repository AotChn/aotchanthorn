const themeToggle = document.getElementById('theme-toggle');
const themeStylesheet = document.getElementById('theme-stylesheet');

const currentTheme = localStorage.getItem('theme');
if (currentTheme) {
    themeStylesheet.href = currentTheme; 
}

themeToggle.addEventListener('click', () => {
    const newTheme = themeStylesheet.href.includes('alt.css') ? 'css/styles.css' : 'css/alt.css';
    themeStylesheet.href = newTheme;
    localStorage.setItem('theme', newTheme);
});
