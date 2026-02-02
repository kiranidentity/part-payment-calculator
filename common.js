document.addEventListener("DOMContentLoaded", function () {
    // 1. Inject Header (Navigation)
    const headerContainer = document.getElementById("shared-header");
    if (headerContainer) {
        headerContainer.innerHTML = `
            <nav class="navbar">
                <div class="nav-container">
                    <a href="index.html" class="nav-logo">
                        Part Payment <span class="highlight">Calculator</span>
                    </a>
                    <ul class="nav-links">
                        <li><a href="index.html" id="nav-home">Calculator</a></li>
                        <li><a href="guide.html" id="nav-guide">Guide & Benefits</a></li>
                        <li><a href="faq.html" id="nav-faq">FAQ</a></li>
                    </ul>
                    <div class="nav-toggle" id="mobile-menu">
                        <span class="bar"></span>
                        <span class="bar"></span>
                        <span class="bar"></span>
                    </div>
                </div>
            </nav>
        `;
    }

    // 2. Inject Footer
    const footerContainer = document.getElementById("shared-footer");
    if (footerContainer) {
        footerContainer.innerHTML = `
            <footer class="site-footer">
                <div class="disclaimer">
                    <h4>Disclaimer</h4>
                    <p>The results provided by this calculator are estimates based on the data entered. Actual results
                        may vary depending on your bank's specific calculation methods, changes in interest rates, and
                        other factors. Please consult your financial advisor or bank before making major financial
                        decisions.</p>
                </div>
                <div class="copyright">
                    &copy; ${new Date().getFullYear()} Part Payment Calculator. All rights reserved.
                </div>
            </footer>
        `;
    }

    // 3. Highlight Active Link
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const navIds = {
        "index.html": "nav-home",
        "guide.html": "nav-guide",
        "faq.html": "nav-faq"
    };

    const activeId = navIds[currentPage];
    if (activeId) {
        const activeLink = document.getElementById(activeId);
        if (activeLink) activeLink.classList.add("active");
    }

    // 4. Mobile Menu Toggle
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function () {
            navLinks.classList.toggle('active');
            menuToggle.classList.toggle('is-active');
        });
    }
});
