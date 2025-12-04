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