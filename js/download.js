const cards = document.querySelectorAll(".card");
const requirements = document.querySelectorAll(".requirement");
const gallery = document.querySelectorAll(".gallery img");
const heroImage = document.querySelector(".hero-image img");
const downloadButton = document.querySelector(".download-button");
const downloadBtn = document.querySelector(".download-btn");

const observer = new IntersectionObserver(
    (entries) => {

        entries.forEach((entry) => {

            if (entry.isIntersecting) {

                entry.target.classList.add("show");

            }

        });

    },
    {
        threshold: 0.15
    }
);

cards.forEach((card) => {

    card.classList.add("hidden");
    observer.observe(card);

});

requirements.forEach((item) => {

    item.classList.add("hidden");
    observer.observe(item);

});

gallery.forEach((image) => {

    image.classList.add("hidden");
    observer.observe(image);

});

if (heroImage) {

    heroImage.addEventListener("mousemove", (e) => {

        const rect = heroImage.getBoundingClientRect();

        const x = ((e.clientX - rect.left) / rect.width) - 0.5;

        const y = ((e.clientY - rect.top) / rect.height) - 0.5;

        heroImage.style.transform = `rotateY(${x * 12}deg) rotateX(${y * -12}deg) translateY(-8px)`;

    });

    heroImage.addEventListener("mouseleave", () => {

        heroImage.style.transform = "rotateY(0deg) rotateX(0deg) translateY(0px)";

    });

}

function iniciarDownload() {

    window.location.href = "../downloads/StudyPlusDesktop.exe";

}

if (downloadButton) {

    downloadButton.addEventListener("click", (e) => {

        e.preventDefault();

        iniciarDownload();

    });

}

if (downloadBtn) {

    downloadBtn.addEventListener("click", (e) => {

        e.preventDefault();

        iniciarDownload();

    });

}

window.addEventListener("scroll", () => {

    const header = document.querySelector("header");

    if (window.scrollY > 30) {

        header.style.background = "rgba(8,24,17,.95)";

    } else {

        header.style.background = "rgba(8,24,17,.75)";

    }

});

const style = document.createElement("style");

style.innerHTML = `

.hidden{

opacity:0;

transform:translateY(60px);

transition:all .8s ease;

}

.show{

opacity:1;

transform:translateY(0);

}

`;

document.head.appendChild(style);