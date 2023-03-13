let menu = document.querySelector('#menu-icon');
let navbar = document.querySelector('.hero nav ul');

// menu sandwich handler
menu.onclick = () => {
    menu.classList.toggle('bx-x');
    navbar.classList.toggle('open');
}

// check for background-image load
window.onload = function() {

  var images = document.querySelectorAll('.hero');
  var imagesLoaded = 0;

  for (var i = 0; i < images.length; i++) {
    var imageSrc = window.getComputedStyle(images[i], null).backgroundImage;
    var image = new Image();
    image.src = imageSrc.slice(4, -1).replace(/"/g, "");

    image.onload = function() {
      imagesLoaded++;
      if (imagesLoaded === images.length) {
        // All background-image were loaded correctly
        // start home animation
        document.getElementById("home").className = "hero slide-in-bck-center";
        document.getElementById("content-id").className = "content text-focus-in";

        // trigger the animations when the user scrolls down the page
        window.onscroll = function() {
          var scrollPos = window.pageYOffset;

          if (scrollPos >= 0 && scrollPos < 230) {  // Main Section
            document.getElementById("profile-pic").className = "hidden";
            document.getElementById("main-about").className = "hidden";

          } else if (scrollPos >= 230 && scrollPos < 460) {  // About Section
            document.getElementById("profile-pic").className = "fade-in-left";
            document.getElementById("main-about").className = "about-text fade-in-right";
            document.getElementById("box-id").className = "hidden";

          } else if (scrollPos >= 460 && scrollPos < 2100) {  // Web Services Section
            document.getElementById("box-id").className = "box scale-in-center";
            document.getElementById("box-skills-1").className = "hidden";
            document.getElementById("box-skills-2").className = "hidden";
            document.getElementById("box-skills-3").className = "hidden";
            document.getElementById("box-skills-4").className = "hidden";

          } else if (scrollPos >= 2100 && scrollPos < 2920) {  // Skills Section
            document.getElementById("box-skills-1").className = "box-skills fade-in-bottom";
            document.getElementById("box-skills-2").className = "box-skills fade-in-bottom";
            document.getElementById("box-skills-3").className = "box-skills fade-in-bottom";
            document.getElementById("box-skills-4").className = "box-skills fade-in-bottom";
          }
        };
      };
    }
  };
};