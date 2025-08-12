// const themeToggle = document.getElementById('theme-toggle');
// const themeStylesheet = document.getElementById('theme-stylesheet');

// const currentTheme = localStorage.getItem('theme');
// if (currentTheme) {
//     themeStylesheet.href = currentTheme; 
// }

// themeToggle.addEventListener('click', () => {
//     const newTheme = themeStylesheet.href.includes('alt.css') ? 'css/styles.css' : 'css/alt.css';
//     themeStylesheet.href = newTheme;
//     localStorage.setItem('theme', newTheme);
// });

function populateListFromFile(filePath) {
    return fetch(filePath)  
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load file');
            }
            return response.text();  
        })
        .then(fileContent => {
            const list = fileContent.split('\n').map(item => item.trim()).filter(item => item !== ''); 
            return list;
        })
        .catch(error => {
            console.error('Error loading the file:', error);
        });
}

async function makeProjectBlock() {
    //get list from file 
    const proj_title = await populateListFromFile('assets/content/proj_title.txt');
    const proj_tech = await populateListFromFile("assets/content/proj_tech.txt");
    const k = proj_title.length;  

    const Container = document.querySelector('.home-content .right');

    for (let i = 0; i < k; i++) {
        const block = document.createElement('button');
        block.classList.add('project-block');

        const title = document.createElement('div');
        title.classList.add('project-title');
        title.textContent = proj_title[i]; 

        const desc = document.createElement('div');
        desc.classList.add('project-tech');
        desc.textContent = proj_tech[i]; 

        block.appendChild(title);
        block.appendChild(desc);
        Container.appendChild(block);
    }
}


async function init() {
    makeProjectBlock();
}

document.addEventListener('DOMContentLoaded', init);
