let menu = document.querySelector('#menu-icon');
let navbar = document.querySelector('.hero nav ul');

// menu sandwich operation //
menu.onclick = () => {
    menu.classList.toggle('bx-x');
    navbar.classList.toggle('open');
}

// // ANIMATIONS //

// trigger the animations when the user scrolls down the page

window.onscroll = function() {
  var scrollPos = window.pageYOffset;
  
  if (scrollPos >= 0 && scrollPos < 230) {
    document.getElementById("profile-pic").className = "hidden";
    document.getElementById("main-about").className = "hidden";
  } else if (scrollPos >= 230 && scrollPos < 460) {
    document.getElementById("profile-pic").className = "fade-in-left";
    document.getElementById("main-about").className = "about-text fade-in-right";
    document.getElementById("box-id").className = "hidden";
  } else if (scrollPos >= 460 && scrollPos < 690) {
    console.log("Actived >= 460px");
    document.getElementById("box-id").className = "box scale-in-center";
  }
  // continúa con el resto de las posiciones y animaciones
};