// menu consts
const menu = document.querySelector("#menu-icon");
const navbar = document.querySelector(".hero nav ul");

// menu sandwich handler
if (menu && navbar) {
  menu.onclick = () => {
    menu.classList.toggle("bx-x");
    navbar.classList.toggle("open");
  };
}

// lógica para detectar cambios en el switch de idioma
const checkbox = document.getElementById("checkboxInput");

if (checkbox) {
  checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
      // Cambia el texto al idioma español
      window.location.href = "index-es.html";
    } else {
      // Cambiar el texto al idioma inglés
      window.location.href = "index.html";
    }
  });

  // Verificar el estado inicial basado en la URL actual
  if (window.location.href.includes("index-es.html")) {
    checkbox.checked = true;
  }
}

// Intersection Observer for reveal animations (optimized for performance)
const reveals = document.querySelectorAll(".reveal");

const observerOptions = {
  root: null,
  rootMargin: "-150px",
  threshold: 0
};

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("active");
      // Dejar de observar el elemento una vez animado
      revealObserver.unobserve(entry.target);
    }
  });
}, observerOptions);

reveals.forEach((el) => revealObserver.observe(el));

// Portfolio Overlay Handler
const portfolioLinks = document.querySelectorAll('.portfolio-link');
let activeOverlay = null;
let activePortfolioItem = null;

// Función para mostrar los botones sobre la imagen
portfolioLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Cerrar cualquier overlay activo
    if (activeOverlay) {
      activeOverlay.classList.remove('active');
    }

    // Obtener el overlay del item actual
    const portfolioItem = link.closest('.portfolio-item');
    const overlay = portfolioItem.querySelector('.portfolio-overlay');

    // Mostrar el overlay
    overlay.classList.add('active');
    activeOverlay = overlay;
    activePortfolioItem = portfolioItem;
  });
});

// Detectar clics en cualquier parte del documento
document.addEventListener('click', (e) => {
  // Si hay un overlay activo
  if (activeOverlay && activePortfolioItem) {
    // Si el clic NO fue dentro del portfolio-item, cerrar el overlay
    if (!activePortfolioItem.contains(e.target)) {
      activeOverlay.classList.remove('active');
      activeOverlay = null;
      activePortfolioItem = null;
    }
  }
});
