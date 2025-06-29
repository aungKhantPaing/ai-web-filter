// Smooth scrolling for navigation links
document.addEventListener("DOMContentLoaded", function () {
  // Smooth scrolling for anchor links
  const links = document.querySelectorAll('a[href^="#"]');

  links.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = this.getAttribute("href");
      const targetSection = document.querySelector(targetId);

      if (targetSection) {
        const offsetTop = targetSection.offsetTop - 80; // Account for fixed navbar

        window.scrollTo({
          top: offsetTop,
          behavior: "smooth",
        });
      }
    });
  });

  // Intersection Observer for animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, observerOptions);

  // Observe elements for animation
  const animatedElements = document.querySelectorAll(
    ".feature-card, .step, .hero-content, .hero-visual"
  );
  animatedElements.forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(30px)";
    el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    observer.observe(el);
  });

  // Navbar background on scroll
  const navbar = document.querySelector(".navbar");
  let lastScrollTop = 0;

  window.addEventListener("scroll", function () {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Add background when scrolled
    if (scrollTop > 50) {
      navbar.style.background = "rgba(255, 255, 255, 0.98)";
      navbar.style.boxShadow = "0 2px 20px rgba(0, 0, 0, 0.1)";
    } else {
      navbar.style.background = "rgba(255, 255, 255, 0.95)";
      navbar.style.boxShadow = "none";
    }

    lastScrollTop = scrollTop;
  });

  // Counter animation for stats
  const stats = document.querySelectorAll(".stat-number");
  const statsObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target;
          const finalValue = target.textContent;

          // Reset for animation
          if (target.textContent.includes("+")) {
            target.textContent = "0+";
          } else if (target.textContent.includes("%")) {
            target.textContent = "0%";
          } else if (target.textContent === "Real-time") {
            return; // Skip animation for text
          }

          // Animate numbers
          if (target.textContent !== "Real-time") {
            animateCounter(target, finalValue);
          }

          statsObserver.unobserve(target);
        }
      });
    },
    { threshold: 0.5 }
  );

  stats.forEach((stat) => statsObserver.observe(stat));

  // Mobile navigation toggle (if needed)
  const mobileNavToggle = document.querySelector(".mobile-nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (mobileNavToggle) {
    mobileNavToggle.addEventListener("click", function () {
      navLinks.classList.toggle("active");
    });
  }

  // Button hover effects
  const buttons = document.querySelectorAll(".btn");
  buttons.forEach((button) => {
    button.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-2px)";
    });

    button.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0)";
    });
  });

  // Feature card hover effects
  const featureCards = document.querySelectorAll(".feature-card");
  featureCards.forEach((card) => {
    card.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-8px)";
    });

    card.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0)";
    });
  });

  // Demo button functionality
  const demoButton = document.querySelector('a[href="#demo"]');
  if (demoButton) {
    demoButton.addEventListener("click", function (e) {
      e.preventDefault();
      showDemoModal();
    });
  }

  // Download button functionality
  const downloadButtons = document.querySelectorAll(".btn-primary");
  downloadButtons.forEach((button) => {
    if (button.textContent.includes("Install")) {
      button.addEventListener("click", function (e) {
        e.preventDefault();
        showInstallInstructions();
      });
    }
  });
});

// Counter animation function
function animateCounter(element, finalValue) {
  const duration = 2000;
  const startTime = performance.now();

  function updateCounter(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    let currentValue;
    if (finalValue.includes("+")) {
      const number = parseInt(finalValue);
      currentValue = Math.floor(progress * number) + "+";
    } else if (finalValue.includes("%")) {
      const number = parseFloat(finalValue);
      currentValue = (progress * number).toFixed(1) + "%";
    }

    element.textContent = currentValue;

    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    }
  }

  requestAnimationFrame(updateCounter);
}

// Demo modal function
function showDemoModal() {
  const modal = document.createElement("div");
  modal.className = "demo-modal";
  modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>AI Web Filter Demo</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="demo-video">
                    <div class="video-placeholder">
                        <i class="fas fa-play-circle"></i>
                        <p>Demo video coming soon!</p>
                    </div>
                </div>
                <div class="demo-description">
                    <h4>See AI Web Filter in Action</h4>
                    <p>Watch how our AI-powered extension automatically detects and filters inappropriate content in real-time, providing a safer browsing experience for you and your family.</p>
                    <ul>
                        <li>Real-time text classification</li>
                        <li>Image content filtering</li>
                        <li>Configurable sensitivity levels</li>
                        <li>Privacy-focused processing</li>
                    </ul>
                </div>
            </div>
        </div>
    `;

  document.body.appendChild(modal);

  // Close modal functionality
  const closeBtn = modal.querySelector(".modal-close");
  closeBtn.addEventListener("click", () => {
    document.body.removeChild(modal);
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

// Install instructions function
function showInstallInstructions() {
  const modal = document.createElement("div");
  modal.className = "install-modal";
  modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Install AI Web Filter</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="install-steps">
                    <div class="install-step">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <h4>Download the Extension</h4>
                            <p>Clone the repository and build the extension:</p>
                            <div class="code-block">
                                <code>git clone https://github.com/aungKhantPaing/ai-web-filter.git</code>
                                <code>cd ai-web-filter</code>
                                <code>npm install</code>
                                <code>npm run build</code>
                            </div>
                        </div>
                    </div>
                    <div class="install-step">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <h4>Load in Chrome</h4>
                            <p>Open Chrome and navigate to the extensions page:</p>
                            <div class="code-block">
                                <code>chrome://extensions/</code>
                            </div>
                            <p>Enable "Developer mode" and click "Load unpacked", then select the <code>build</code> folder.</p>
                        </div>
                    </div>
                    <div class="install-step">
                        <div class="step-number">3</div>
                        <div class="step-content">
                            <h4>Start Browsing Safely</h4>
                            <p>Click the extension icon to configure your settings and start enjoying AI-powered content filtering!</p>
                        </div>
                    </div>
                </div>
                <div class="install-actions">
                    <a href="https://github.com/aungKhantPaing/ai-web-filter" class="btn btn-primary">
                        <i class="fab fa-github"></i>
                        View on GitHub
                    </a>
                </div>
            </div>
        </div>
    `;

  document.body.appendChild(modal);

  // Close modal functionality
  const closeBtn = modal.querySelector(".modal-close");
  closeBtn.addEventListener("click", () => {
    document.body.removeChild(modal);
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

// Add modal styles dynamically
const modalStyles = `
    .demo-modal,
    .install-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(5px);
    }
    
    .modal-content {
        background: white;
        border-radius: 12px;
        max-width: 600px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .modal-header h3 {
        margin: 0;
        color: #1f2937;
    }
    
    .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #6b7280;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.3s ease;
    }
    
    .modal-close:hover {
        background: #f3f4f6;
    }
    
    .modal-body {
        padding: 1.5rem;
    }
    
    .video-placeholder {
        background: #f3f4f6;
        border-radius: 8px;
        padding: 3rem;
        text-align: center;
        color: #6b7280;
    }
    
    .video-placeholder i {
        font-size: 3rem;
        margin-bottom: 1rem;
        color: #9ca3af;
    }
    
    .demo-description h4 {
        margin: 1.5rem 0 1rem;
        color: #1f2937;
    }
    
    .demo-description ul {
        margin: 1rem 0;
        padding-left: 1.5rem;
    }
    
    .demo-description li {
        margin: 0.5rem 0;
        color: #374151;
    }
    
    .install-steps {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }
    
    .install-step {
        display: flex;
        gap: 1rem;
        align-items: flex-start;
    }
    
    .install-step .step-number {
        width: 40px;
        height: 40px;
        background: linear-gradient(45deg, #2563eb, #3b82f6);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        flex-shrink: 0;
    }
    
    .install-step h4 {
        margin: 0 0 0.5rem;
        color: #1f2937;
    }
    
    .install-step p {
        margin: 0.5rem 0;
        color: #6b7280;
    }
    
    .code-block {
        background: #1f2937;
        border-radius: 8px;
        padding: 1rem;
        margin: 1rem 0;
    }
    
    .code-block code {
        display: block;
        color: #e5e7eb;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 0.875rem;
        line-height: 1.5;
        margin: 0.25rem 0;
    }
    
    .install-actions {
        margin-top: 2rem;
        text-align: center;
    }
    
    @media (max-width: 768px) {
        .modal-content {
            width: 95%;
            margin: 1rem;
        }
        
        .install-step {
            flex-direction: column;
            text-align: center;
        }
    }
`;

// Inject modal styles
const styleSheet = document.createElement("style");
styleSheet.textContent = modalStyles;
document.head.appendChild(styleSheet);
