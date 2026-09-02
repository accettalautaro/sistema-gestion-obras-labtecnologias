const hamburguer = document.getElementById('hamburguer');
const link = document.getElementById('links');

if (hamburguer && link) {
    hamburguer.addEventListener('click', () => {
        link.classList.toggle('active');
    });
}
/*SCROLL HEADER */
const header = document.querySelector('header');
const nav = document.querySelector('.navegacion');
const logo = document.querySelector('.imagen-izquierda');
const logoInstagram = document.querySelector('.instagram-logo');
    window.addEventListener('scroll', () => {
        // Si el usuario hace scroll hacia abajo más de 50px
        if (window.scrollY > 50) {
            header.classList.add('header-scrolled');
            nav.classList.add('scrolled');
            if (logo) logo.src = 'Imagenes/logoAccettaSinMargenes.png';
            if (logoInstagram) logoInstagram.src='Imagenes/instagramlogo.png';
        } else {
            // Si vuelve arriba, vuelve a ser transparente
            
            header.classList.remove('header-scrolled');
            nav.classList.remove('scrolled');
            if (logo) logo.src = 'Imagenes/logoAccettaSinMargenesBlanco.png';
            if (logoInstagram) logoInstagram.src='Imagenes/instagramlogoBlanco.png';
        }
    });

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -10% 0px'
    });

    document.querySelectorAll('.reveal').forEach((element) => {
        revealObserver.observe(element);
    });

    /*CARRUCEL */
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
        if (track) {
            track.style.transform = `translateX(${desplazamiento}%)`;
        }
    }
    // Eventos para los clics en los botones
    if (btnNext) {
        btnNext.addEventListener('click', () => moverCarrusel('siguiente'));
    }
    if (btnPrev) {
        btnPrev.addEventListener('click', () => moverCarrusel('anterior'));
    }

    // El CSS deja el hero debajo de la primera seccion; aqui solo animamos
    // el titulo para reforzar la sensacion de profundidad durante el scroll.
    const hero = document.querySelector('.hero-reveal');
    const heroContent = hero?.querySelector('.carrusel-contenido');
    let scrollFrame;

    function actualizarHero() {
        const progreso = Math.min(window.scrollY / window.innerHeight, 1);

        if (heroContent) {
            heroContent.style.opacity = String(1 - progreso);
            heroContent.style.transform = `translate(-50%, calc(-50% - ${progreso * 24}px))`;
        }

        scrollFrame = undefined;
    }

    if (heroContent) {
        window.addEventListener('scroll', () => {
            if (!scrollFrame) {
                scrollFrame = window.requestAnimationFrame(actualizarHero);
            }
        }, { passive: true });

        actualizarHero();
    }

    /* VALIDACION DNI - Máximo 8 dígitos */
    const dniInput = document.getElementById('dni');
    if (dniInput) {
        dniInput.addEventListener('input', function() {
            if (this.value.length > 8) {
                this.value = this.value.slice(0, 8);
            }
        });
    }