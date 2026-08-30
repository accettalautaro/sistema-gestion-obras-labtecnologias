const hamburguer = document.getElementById('hamburguer');
const link = document.getElementById('links');

hamburguer.addEventListener('click', () => {
    link.classList.toggle('active');
});
const header = document.querySelector('header');

    window.addEventListener('scroll', () => {
        // Si el usuario hace scroll hacia abajo más de 50px
        if (window.scrollY > 50) {
            header.classList.add('header-scrolled');
        } else {
            // Si vuelve arriba, vuelve a ser transparente
            header.classList.remove('header-scrolled');
        }
    });
    const track = document.getElementById('carruselTrack');
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const slides = document.querySelectorAll('.carrusel-slide');
    let indiceActual = 0;
    const totalSlides = slides.length;
    // Función para mover el carrusel
    function moverCarrusel(direccion) {
        if (direccion === 'siguiente') {
            indiceActual++;
            if (indiceActual >= totalSlides) {
                indiceActual = 0; // Si llega a la última, vuelve a la primera
            }
        } else if (direccion === 'anterior') {
            indiceActual--;
            if (indiceActual < 0) {
                indiceActual = totalSlides - 1; // Si está en la primera, va a la última
            }
        }
        
        // Calcula cuánto porcentaje debe moverse en el eje X
        const desplazamiento = -(indiceActual * 100);
        track.style.transform = `translateX(${desplazamiento}%)`;
    }
    // Eventos para los clics en los botones
    btnNext.addEventListener('click', () => moverCarrusel('siguiente'));
    btnPrev.addEventListener('click', () => moverCarrusel('anterior'));