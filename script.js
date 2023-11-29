// menu consts
let menu = document.querySelector("#menu-icon");
let navbar = document.querySelector(".hero nav ul");

// menu sandwich handler
menu.onclick = () => {
  menu.classList.toggle("bx-x");
  navbar.classList.toggle("open");
};

// lógica para detectar cambios en el switch de idioma
const checkbox = document.getElementById("checkboxInput");

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

window.addEventListener("scroll", reveal);

// To check the scroll position on page load
reveal();

// Function to target elements to be animated
function reveal() {
  var reveals = document.querySelectorAll(".reveal");
  for (var i = 0; i < reveals.length; i++) {
    var windowHeight = window.innerHeight;
    var elementTop = reveals[i].getBoundingClientRect().top;
    var elementVisible = 150;
    if (elementTop < windowHeight - elementVisible) {
      reveals[i].classList.add("active");
    } else {
      reveals[i].classList.remove("active");
    }
  }
}