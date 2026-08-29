const hamburguer = document.getElementById('hamburguer');
const link = document.getElementById('links');

hamburguer.addEventListener('click', () => {
    link.classList.toggle('active');
});