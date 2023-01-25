let menu = document.querySelector('#menu-icon');
let navbar = document.querySelector('.hero nav ul');

// menu sandwich operation //
menu.onclick = () => {
    menu.classList.toggle('bx-x');
    navbar.classList.toggle('open');
}

// ANIMATIONS //
// About me Section //
// window.onscroll = () => {
//   if (document.documentElement.scrollTop > 220) {
//     document.getElementById("profile-pic").className = "fade-in-left";
//     document.getElementById("main-about").className = "about-text fade-in-right";
//   } else {
//     document.getElementById("profile-pic").className = "hidden";
//     document.getElementById("main-about").className = "hidden";
//   }
// }

// Web Services //
// window.onscroll = () => {
//     if (document.documentElement.scrollTop > 500) {
//       document.getElementById("tittle-id").className = "fade-in-left";
//     } else {
//       document.getElementById("tittle-id").className = "hidden";
//     }
//   }

window.onscroll = function() {animation()};

function animation() {
    if (document.body.scrollTop > 230 || document.documentElement.scrollTop > 230) {
        document.getElementById("profile-pic").className = "fade-in-left";
        document.getElementById("main-about").className = "about-text fade-in-right";

    } else if (document.body.scrollTop > 550 || document.documentElement.scrollTop > 550) {
        document.getElementById("tittle-id").className = "tittle scale-in-center";
    }

    else {
        document.getElementById("profile-pic").className = "hidden";
        document.getElementById("main-about").className = "hidden";
    }
}