document.addEventListener('DOMContentLoaded', () => {
    /* 
    =========================================
       THEME TOGGLE
    =========================================
    */
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const icon = themeToggle.querySelector('i');

    // Function to update icon based on current mode
    function updateIcon() {
        if (body.classList.contains('light-mode')) {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        } else {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        body.classList.add('light-mode');
        updateIcon();
    }

    // Event Listener for toggle
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('light-mode');
        updateIcon();

        // Save preference
        if (body.classList.contains('light-mode')) {
            localStorage.setItem('theme', 'light');
        } else {
            localStorage.setItem('theme', 'dark');
        }
    });

    /* 
    =========================================
       MOBILE MENU
    =========================================
    */
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-menu a');

    // Toggle menu
    hamburger.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');

        // Optimize hamburger animation
        const bars = document.querySelectorAll('.bar');
        if (mobileMenu.classList.contains('active')) {
            bars[0].style.transform = 'rotate(-45deg) translate(-5px, 6px)';
            bars[1].style.opacity = '0';
            bars[2].style.transform = 'rotate(45deg) translate(-5px, -6px)';
        } else {
            bars[0].style.transform = 'none';
            bars[1].style.opacity = '1';
            bars[2].style.transform = 'none';
        }
    });

    // Close menu when a link is clicked
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');

            // Reset hamburger
            const bars = document.querySelectorAll('.bar');
            bars[0].style.transform = 'none';
            bars[1].style.opacity = '1';
            bars[2].style.transform = 'none';
        });
    });

    /* 
    =========================================
       SCROLL ANIMATIONS (INTERSECTION OBSERVER)
    =========================================
    */
    const observerOptions = {
        threshold: 0.15, // Trigger when 15% of the element is visible
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Optional: Stop observing once revealed
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => observer.observe(el));

    /* 
    =========================================
       SMOOTH SCROLLING OFFSET
    =========================================
    */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 70;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });
    /* 
    =========================================
       DYNAMIC CONTENT LOAD (FROM ADMIN)
    =========================================
    */
    const savedContent = JSON.parse(localStorage.getItem('siteContent') || '{}');
    if (savedContent.title) {
        // Specifically targeting the H2 in hero which holds the role title
        const heroTitle = document.querySelector('#hero h2');
        if (heroTitle) heroTitle.innerText = savedContent.title;
    }
    if (savedContent.about) {
        // Targeting the paragraph in about section
        const aboutText = document.querySelector('.about-text p');
        if (aboutText) aboutText.innerText = savedContent.about;
    }

    /* 
    =========================================
       CONTACT FORM HANDLING
    =========================================
    */
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Get values
            const name = contactForm.querySelector('input[type="text"]').value;
            const email = contactForm.querySelector('input[type="email"]').value;
            const msg = contactForm.querySelector('textarea').value;

            // Create message object
            const newMessage = {
                name: name,
                email: email,
                message: msg,
                date: new Date().toLocaleString()
            };

            // Save to LocalStorage
            const messages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
            messages.push(newMessage);
            localStorage.setItem('contactMessages', JSON.stringify(messages));

            // Feedback
            alert('Message Sent! (Simulated backend)');
            contactForm.reset();
        });
    }
});
