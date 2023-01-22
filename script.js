let menu = document.querySelector('#menu-icon');
let navbar = document.querySelector('.hero nav ul');
let info = document.querySelector('body');

menu.onclick = () => {
    menu.classList.toggle('bx-x');
    navbar.classList.toggle('open');
}

info.onload = () => {
    alert('This site is still under construction, thanks for your visit!');
}