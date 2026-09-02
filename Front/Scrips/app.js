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

    const proyectos = [
        {
            id: 1,
            titulo: 'Vivienda Moderna',
            imagen: 'Imagenes/imagenCasaProyecto1.jpeg',
            tipo: 'Residencial',
            superficie: '180 m²',
            ubicacion: 'San Luis',
            anio: '2026',
            descripcion: 'Proyecto residencial de estilo moderno, diseñado para aprovechar al máximo los espacios y la iluminación natural.',
            concepto: 'La propuesta organiza los ambientes con una mirada clara y contemporánea, priorizando la relación entre los espacios interiores y la entrada de luz natural. La materialidad y las proporciones acompañan una arquitectura sobria, funcional y pensada para la vida cotidiana.',
            galeria: ['Imagenes/imagenCasaProyecto1.jpeg']
        },
        {
            id: 2,
            titulo: 'Casa Familiar',
            imagen: 'Imagenes/imagenCasaProyecto2.jpeg',
            tipo: 'Residencial',
            superficie: '220 m²',
            ubicacion: 'San Luis',
            anio: '2025',
            descripcion: 'Vivienda diseñada para una familia, priorizando espacios amplios, funcionales y cómodos.',
            concepto: 'El proyecto parte de la necesidad de reunir a la familia en espacios generosos y flexibles. La distribución busca equilibrar los momentos compartidos con áreas de mayor intimidad, construyendo una vivienda cómoda, luminosa y adaptable.',
            galeria: ['Imagenes/imagenCasaProyecto2.jpeg']
        },
        {
            id: 3,
            titulo: 'Vivienda Unifamiliar',
            imagen: 'Imagenes/imagenCasaProyecto3.jpeg',
            tipo: 'Residencial',
            superficie: '160 m²',
            ubicacion: 'San Luis',
            anio: '2025',
            descripcion: 'Proyecto de vivienda unifamiliar pensado para combinar funcionalidad, confort y diseño.',
            concepto: 'La arquitectura se resuelve a partir de una organización eficiente y de ambientes que acompañan distintos usos. El diseño combina confort y funcionalidad mediante una propuesta simple, equilibrada y vinculada con las necesidades de sus habitantes.',
            galeria: ['Imagenes/imagenCasaProyecto3.jpeg']
        },
        {
            id: 4,
            titulo: 'Casa Contemporánea',
            imagen: 'Imagenes/imagenCasaProyecto4.jpeg',
            tipo: 'Residencial',
            superficie: '200 m²',
            ubicacion: 'San Luis',
            anio: '2024',
            descripcion: 'Proyecto residencial de arquitectura contemporánea con espacios abiertos y una estética minimalista.',
            concepto: 'La propuesta contemporánea se apoya en la continuidad visual y en la apertura de los ambientes. La reducción de elementos formales permite que la luz, las proporciones y la conexión entre espacios definan una experiencia doméstica serena y minimalista.',
            galeria: ['Imagenes/imagenCasaProyecto4.jpeg']
        }
    ];

    const paginaProyecto = document.querySelector('[data-pagina-proyecto]');
    if (paginaProyecto) {
        const id = Number(new URLSearchParams(window.location.search).get('id'));
        const proyecto = proyectos.find((item) => item.id === id);
        const contenido = document.querySelector('[data-proyecto-contenido]');
        const error = document.querySelector('[data-proyecto-error]');

        if (!proyecto) {
            contenido.hidden = true;
            error.hidden = false;
        } else {
            document.title = `${proyecto.titulo} | Accetta Equipamiento`;
            document.querySelector('[data-proyecto-titulo]').textContent = proyecto.titulo;
            document.querySelector('[data-proyecto-concepto]').textContent = proyecto.concepto;

            const imagenPrincipal = document.querySelector('[data-proyecto-imagen]');
            imagenPrincipal.src = proyecto.imagen;
            imagenPrincipal.alt = proyecto.titulo;

            document.querySelector('[data-proyecto-tipo]').textContent = proyecto.tipo;
            document.querySelector('[data-proyecto-superficie]').textContent = proyecto.superficie;
            document.querySelector('[data-proyecto-ubicacion]').textContent = proyecto.ubicacion;
            document.querySelector('[data-proyecto-anio]').textContent = proyecto.anio;

            const galeria = document.querySelector('[data-proyecto-track]');
            proyecto.galeria.forEach((imagen, indice) => {
                const figura = document.createElement('figure');
                figura.className = 'proyecto-carrusel-slide';
                figura.innerHTML = `<img src="${imagen}" alt="${proyecto.titulo}, vista ${indice + 1}">`;
                galeria.appendChild(figura);
            });

            const carrusel = document.querySelector('[data-proyecto-carrusel]');
            const botonAnterior = document.querySelector('[data-proyecto-prev]');
            const botonSiguiente = document.querySelector('[data-proyecto-next]');
            let indiceImagen = 0;

            function moverImagen(direccion) {
                indiceImagen = (indiceImagen + direccion + proyecto.galeria.length) % proyecto.galeria.length;
                galeria.style.transform = `translateX(-${indiceImagen * 100}%)`;
            }

            botonAnterior.addEventListener('click', () => moverImagen(-1));
            botonSiguiente.addEventListener('click', () => moverImagen(1));

            if (proyecto.galeria.length < 2) {
                botonAnterior.hidden = true;
                botonSiguiente.hidden = true;
            }
        }
    }