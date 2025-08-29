document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    // This function applies the correct theme and bulb icon
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            body.backroundimage = "url('pimg1.jpg')";
            themeToggleBtn.src = 'bulbon.png';
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('dark-mode');
            themeToggleBtn.src = 'bulboff.png';
            localStorage.setItem('theme', 'light');
        }
    };

    // Check for a saved theme in localStorage when the page loads
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    // Add a click event listener to the button
    themeToggleBtn.addEventListener('click', () => {
        // Check the current theme by looking at localStorage, then toggle
        const currentTheme = localStorage.getItem('theme') === 'dark' ? 'light' : 'dark';
        applyTheme(currentTheme);
    });
});
