// Enhanced Scroll Functionality
const scrollProgress = document.getElementById("scrollProgress");
const backToTop = document.getElementById("backToTop");
const mainHeader = document.getElementById("mainHeader");

// Scroll Progress Bar
window.addEventListener("scroll", () => {
  const winScroll =
    document.body.scrollTop || document.documentElement.scrollTop;
  const height =
    document.documentElement.scrollHeight -
    document.documentElement.clientHeight;
  const scrolled = (winScroll / height) * 100;
  scrollProgress.style.width = scrolled + "%";

  // Back to Top Button
  if (winScroll > 300) {
    backToTop.classList.add("visible");
    mainHeader.classList.add("scrolled");
  } else {
    backToTop.classList.remove("visible");
    mainHeader.classList.remove("scrolled");
  }
});

// Back to Top with smooth scroll
backToTop.addEventListener("click", (e) => {
  e.preventDefault();
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});

// Enhanced scroll reveal animations
const scrollReveals = document.querySelectorAll(".scroll-reveal");

const revealOnScroll = () => {
  scrollReveals.forEach((element) => {
    const elementTop = element.getBoundingClientRect().top;
    const elementVisible = 150;

    if (elementTop < window.innerHeight - elementVisible) {
      element.classList.add("revealed");
    }
  });
};

// Initial check and add scroll event
revealOnScroll();
window.addEventListener("scroll", revealOnScroll);

// Mobile menu toggle
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const navLinks = document.getElementById("navLinks");

mobileMenuBtn.addEventListener("click", () => {
  navLinks.classList.toggle("active");
});

// Close mobile menu when clicking outside
document.addEventListener("click", (e) => {
  if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
    navLinks.classList.remove("active");
  }
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();

    const targetId = this.getAttribute("href");
    if (targetId === "#") return;

    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      // Close mobile menu if open
      navLinks.classList.remove("active");

      // Smooth scroll to target
      window.scrollTo({
        top: targetElement.offsetTop - 80,
        behavior: "smooth",
      });
    }
  });
});

// Update active navigation link based on scroll
const sections = document.querySelectorAll("section[id]");

function updateActiveNavLink() {
  let current = "";
  const scrollPosition = window.pageYOffset + 100;

  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;

    if (
      scrollPosition >= sectionTop &&
      scrollPosition < sectionTop + sectionHeight
    ) {
      current = section.getAttribute("id");
    }
  });

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("active");
    if (link.getAttribute("href") === `#${current}`) {
      link.classList.add("active");
    }
  });
}

window.addEventListener("scroll", updateActiveNavLink);
updateActiveNavLink(); // Initialize on load

// Chat functionality
const chatPreview = document.getElementById("chatPreview");
const chatInput = document.getElementById("chatInput");
const sendButton = document.getElementById("sendButton");

// Response mapping
const responseMap = {
  reminder: `To set up medication reminders, please visit our <a href="/templates/setting.html" class="action-link">Settings page</a> and go to the "Medication Reminders" section. You can configure time, frequency, and refill alerts there.`,
  medication: `Manage your medications through our <a href="/templates/setting.html" class="action-link">Settings page</a>. You can set reminders, configure refill alerts, and customize notification preferences.`,
  symptom: `Track and monitor your health symptoms in our <a href="/templates/setting.html" class="action-link">Settings page</a>. Enable symptom tracking, set daily check-ins, and monitor patterns over time.`,
  track: `To track symptoms, visit our <a href="/templates/setting.html" class="action-link">Settings page</a> and enable "Symptom Tracking". You can customize what symptoms to monitor and set up daily check-ins.`,
  setting: `All your preferences can be managed in our comprehensive <a href="/templates/setting.html" class="action-link">Settings page</a>. This includes medication reminders, symptom tracking, chatbot preferences, notifications, and privacy settings.`,
  chat: `Start chatting with our AI assistant by visiting the <a href="/templates/chatbot.html" class="action-link">Chat Assistant page</a>. You can ask health questions, get medication advice, and receive personalized recommendations.`,
  help: `I can help direct you to the right features on our website:
                     <div class="message-actions">
                         <a href="/templates/chatbot.html" class="action-link">💬 Chat Assistant</a>
                         <a href="/templates/setting.html" class="action-link">⚙️ Settings</a>
                         <a href="#features" class="action-link">✨ Features</a>
                     </div>`,
  hello: `Hello! I'm here to guide you through MediTrack+ features. What would you like to know about?`,
  hi: `Hi there! How can I help you navigate MediTrack+ today?`,
  hey: `Hey! I'm your MediTrack+ assistant. Ask me about features or how to get started.`,
};

// Default responses
const defaultResponses = [
  `I can help you navigate MediTrack+ features. Try asking about medication reminders, symptom tracking, or accessing the settings.`,
  `You can manage all features through our website. Visit the <a href="/templates/setting.html" class="action-link">Settings page</a> to configure medication reminders and symptom tracking.`,
  `For detailed assistance, please check our <a href="/templates/setting.html" class="action-link">Settings page</a> or start a conversation in the <a href="/templates/chatbot.html" class="action-link">Chat Assistant</a>.`,
];

function getResponse(userMessage) {
  const lowerMessage = userMessage.toLowerCase().trim();

  // Check for specific keywords
  for (const [keyword, response] of Object.entries(responseMap)) {
    if (lowerMessage.includes(keyword)) {
      return response;
    }
  }

  // Return random default response
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

function addMessage(sender, message, isHTML = false) {
  const messageDiv = document.createElement("div");
  messageDiv.className = "message";

  if (sender === "user") {
    messageDiv.innerHTML = `
                    <div class="message-avatar user">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </div>
                    <div class="message-bubble user">${message}</div>
                `;
  } else {
    messageDiv.innerHTML = `
                    <div class="message-avatar bot">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <div class="message-bubble bot">${
                      isHTML ? message : message
                    }</div>
                `;
  }

  chatPreview.appendChild(messageDiv);
  // Smooth scroll to bottom with easing
  chatPreview.scrollTo({
    top: chatPreview.scrollHeight,
    behavior: "smooth",
  });

  // Add suggestion buttons after bot messages
  if (sender === "bot" && !message.includes("action-link")) {
    setTimeout(() => {
      addSuggestionButtons();
    }, 100);
  }
}

function addSuggestionButtons() {
  // Remove existing suggestion buttons
  const existingButtons = document.querySelectorAll(".chat-suggestion-buttons");
  existingButtons.forEach((btn) => {
    if (btn.id !== "initialSuggestions") {
      btn.remove();
    }
  });

  const suggestions = [
    {
      text: "💊 Medication Reminders",
      message: "How do I set medication reminders?",
    },
    { text: "📊 Symptom Tracking", message: "I want to track my symptoms" },
    { text: "⚙️ Settings", message: "Where can I find the settings?" },
  ];

  const suggestionsDiv = document.createElement("div");
  suggestionsDiv.className = "chat-suggestion-buttons";
  suggestionsDiv.innerHTML = suggestions
    .map(
      (suggestion) =>
        `<button class="chat-suggestion-btn" data-message="${suggestion.message}">${suggestion.text}</button>`
    )
    .join("");

  const lastBotMessage = chatPreview.querySelector(
    ".message:last-child .message-bubble.bot"
  );
  if (lastBotMessage) {
    lastBotMessage.appendChild(suggestionsDiv);

    // Add event listeners to new suggestion buttons
    suggestionsDiv
      .querySelectorAll(".chat-suggestion-btn")
      .forEach((button) => {
        button.addEventListener("click", function () {
          const message = this.getAttribute("data-message");
          chatInput.value = message;
          sendMessage();
        });
      });
  }
}

function addTypingIndicator() {
  const typingDiv = document.createElement("div");
  typingDiv.className = "typing-indicator";
  typingDiv.innerHTML = `
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            `;

  const messageDiv = document.createElement("div");
  messageDiv.className = "message";
  messageDiv.innerHTML = `
                <div class="message-avatar bot">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                    </svg>
                </div>
                <div class="message-bubble bot"></div>
            `;

  const bubble = messageDiv.querySelector(".message-bubble.bot");
  bubble.appendChild(typingDiv);

  chatPreview.appendChild(messageDiv);
  chatPreview.scrollTop = chatPreview.scrollHeight;

  return messageDiv;
}

function removeTypingIndicator(typingElement) {
  if (typingElement) {
    typingElement.remove();
  }
}

function sendMessage() {
  const userMessage = chatInput.value.trim();
  if (!userMessage) return;

  // Add user message
  addMessage("user", userMessage);
  chatInput.value = "";
  chatInput.focus();

  // Show typing indicator
  const typingElement = addTypingIndicator();

  // Simulate delay for bot response
  setTimeout(() => {
    removeTypingIndicator(typingElement);

    // Remove the typing message container if it's empty
    const bubble = typingElement.querySelector(".message-bubble.bot");
    if (bubble && bubble.children.length === 0) {
      typingElement.remove();
    }

    // Get and add bot response
    const response = getResponse(userMessage);
    const isHTML = response.includes("<a") || response.includes("<div");

    addMessage("bot", response, isHTML);
  }, 800 + Math.random() * 700);
}

// Event listeners for chat
sendButton.addEventListener("click", sendMessage);

chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

// Add event listeners to initial suggestion buttons
document.querySelectorAll(".chat-suggestion-btn").forEach((button) => {
  button.addEventListener("click", function () {
    const message = this.getAttribute("data-message");
    chatInput.value = message;
    sendMessage();
  });
});

// Mouse wheel scroll with momentum
let isScrolling = false;

chatPreview.addEventListener("wheel", (e) => {
  if (!isScrolling) {
    isScrolling = true;

    // Add momentum effect
    chatPreview.style.scrollBehavior = "smooth";

    setTimeout(() => {
      chatPreview.style.scrollBehavior = "auto";
      isScrolling = false;
    }, 300);
  }
});

// Touch scroll for mobile
let touchStartY = 0;
let touchEndY = 0;

chatPreview.addEventListener("touchstart", (e) => {
  touchStartY = e.touches[0].clientY;
});

chatPreview.addEventListener("touchend", (e) => {
  touchEndY = e.changedTouches[0].clientY;

  // Add slight momentum on fast swipes
  if (Math.abs(touchEndY - touchStartY) > 50) {
    chatPreview.style.scrollBehavior = "smooth";
    setTimeout(() => {
      chatPreview.style.scrollBehavior = "auto";
    }, 300);
  }
});

// Initialize all scroll-reveal elements
document.addEventListener("DOMContentLoaded", () => {
  scrollReveals.forEach((el) => {
    if (el.getBoundingClientRect().top < window.innerHeight - 100) {
      el.classList.add("revealed");
    }
  });
});

// Parallax effect on scroll
window.addEventListener("scroll", () => {
  const scrolled = window.pageYOffset;
  const parallaxElements = document.querySelectorAll(
    ".bg-decoration .decoration-circle"
  );

  parallaxElements.forEach((element, index) => {
    const speed = 0.1 * (index + 1);
    element.style.transform = `translateY(${scrolled * speed}px)`;
  });
});
