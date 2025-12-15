const API_BASE = 'https://aiagent.invordigital.com';
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const chatMessages = document.getElementById('chat-messages');
const scheduleSection = document.getElementById('schedule-section');
const suggestionList = document.getElementById('suggestion-list');
const suggestionsDiv = document.getElementById('suggestions');
const suggestionsCloseBtn = document.getElementById('suggestions-close-btn');
const themeToggle = document.getElementById('theme-toggle');
const scheduleExpandBtn = document.getElementById('schedule-expand-btn');
const schedulePanel = document.querySelector('.schedule-panel');

let conversationHistory = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await getCsrfToken(); // Fetch CSRF token once on page load
    loadChatTips();
    initThemeToggle();
    initScheduleToggle();
    initSuggestionsClose();
});

// Suggestions close behavior: remember user preference in localStorage
function initSuggestionsClose() {
    try {
        const hidden = localStorage.getItem('suggestionsHidden') === 'true';
        if (hidden && suggestionsDiv) {
            suggestionsDiv.classList.add('hidden');
        }

        if (suggestionsCloseBtn && suggestionsDiv) {
            suggestionsCloseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // small fade then hide
                suggestionsDiv.classList.add('fade-out');
                setTimeout(() => {
                    suggestionsDiv.classList.add('hidden');
                    suggestionsDiv.classList.remove('fade-out');
                }, 180);
                localStorage.setItem('suggestionsHidden', 'true');
            });
        }
    } catch (err) {
        // silent
        console.warn('suggestions init error', err);
    }
}

// Theme Toggle
function initThemeToggle() {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    document.body.setAttribute('data-theme', saved);
    updateThemeIcon(saved);

    themeToggle?.addEventListener('click', () => {
        const current = document.body.getAttribute('data-theme');
        const newTheme = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
}

function updateThemeIcon(theme) {
    if (themeToggle) {
        themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

// Schedule Toggle
function initScheduleToggle() {
    if (!scheduleExpandBtn || !schedulePanel) return;

    const saved = localStorage.getItem('scheduleExpanded') === 'true';
    setScheduleExpanded(saved);

    scheduleExpandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = schedulePanel.getAttribute('data-expanded') === 'true';
        setScheduleExpanded(!isExpanded);
        localStorage.setItem('scheduleExpanded', !isExpanded);
    });
}

function setScheduleExpanded(expanded) {
    if (!schedulePanel || !scheduleSection || !scheduleExpandBtn) return;

    schedulePanel.setAttribute('data-expanded', expanded ? 'true' : 'false');
    scheduleExpandBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');

    if (expanded && !scheduleSection.classList.contains('hidden')) {
        scheduleSection.classList.remove('hidden');
    } else if (!expanded) {
        scheduleSection.classList.add('hidden');
    }
}

// Event listeners
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

async function loadChatTips() {
    try {
        const response = await fetch(`${API_BASE}/chat-tips`);
        const data = await response.json();

        // Show first 3 tips as suggestion buttons (create DOM nodes to avoid escaping bugs)
        if (data.tips && suggestionList) {
            const hidden = localStorage.getItem('suggestionsHidden') === 'true';
            // clear existing
            suggestionList.innerHTML = '';
            const tips = data.tips.slice(0, 3);
            for (const tip of tips) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'suggestion-btn';
                btn.textContent = tip;
                btn.addEventListener('click', () => fillMessage(tip));
                suggestionList.appendChild(btn);
            }
            if (!hidden && suggestionsDiv) {
                suggestionsDiv.classList.remove('hidden');
            }
        }
    } catch (error) {
        console.error('Error loading tips:', error);
    }
}

function fillMessage(text) {
    if (!messageInput) return;
    messageInput.focus();
    const sanitize = (s) => {
        if (!s) return s;
        let out = s.trim();
        out = out.replace(/^[^A-Za-z0-9]*try[:\s-]*/i, '');
        out = out.trim();
        out = out.replace(/\*\*/g, '');
        if ((out.startsWith('"') && out.endsWith('"')) || (out.startsWith("'") && out.endsWith("'"))) {
            out = out.slice(1, -1).trim();
        }
        return out;
    };

    messageInput.value = sanitize(text);
    const len = messageInput.value.length;
    try { messageInput.setSelectionRange(len, len); } catch (e) { /* ignore */ }
}

let CSRF_TOKEN = '';

async function getCsrfToken() {
    try {
        const res = await fetch(`${API_BASE}/csrf-token`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });
        const data = await res.json();
        CSRF_TOKEN = data.csrf_token;
        console.log('CSRF token fetched:', CSRF_TOKEN ? 'Success' : 'Failed');
        console.log('Token value:', CSRF_TOKEN);
    } catch (error) {
        console.error('Error fetching CSRF token:', error);
    }
}

// Helper function to get cookie value
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}


async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    // Add user message to chat
    addMessageToChat(message, 'user');
    messageInput.value = '';

    // Add to history
    conversationHistory.push({
        role: 'user',
        content: message
    });

    // Show loading
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message agent loading';
    loadingDiv.innerHTML = '<div class="bubble loading"><div class="typing"><span></span><span></span><span></span></div></div>';
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        // Prepare URL parameters for GET request
        const params = new URLSearchParams({
            message: message,
            history: JSON.stringify(conversationHistory)
        });

        const response = await fetch(`${API_BASE}/chat?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': CSRF_TOKEN
            },
        });

        const result = await response.json();
        loadingDiv.remove();

        console.log(result);


        if (result.error) {
            addMessageToChat(`❌ Error: ${result.error}`, 'agent');
        } else {
            const sanitizedResponse = result.agent_response.replace(/\*\*/g, '').replace(/-/g, ' ');
            addMessageToChat(sanitizedResponse, 'agent');

            // Add to history
            conversationHistory.push({
                role: 'assistant',
                content: result.agent_response
            });

            // If schedule ready, display it
            if (result.status === 'schedule_ready' && result.schedule) {
                displaySchedule(result.schedule, result.metadata);
            }

            // If clarification needed, show questions
            if (result.status === 'clarification_needed' && result.questions) {
                const questionsDiv = document.createElement('div');
                questionsDiv.className = 'clarification-questions';
                questionsDiv.innerHTML = '<p><strong>Please provide more info:</strong></p>' +
                    result.questions.map(q => `<div class="question">• ${q}</div>`).join('');
                chatMessages.appendChild(questionsDiv);
            }
        }
    } catch (error) {
        loadingDiv.remove();
        addMessageToChat(`❌ Error: ${error.message}`, 'agent');
    }

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addMessageToChat(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender} slide-in`;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    messageDiv.innerHTML = `<div class="bubble"><p>${text}</p><small class="time">${time}</small></div>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function displaySchedule(schedule, metadata) {
    scheduleSection.classList.remove('hidden');
    if (schedulePanel) {
        setScheduleExpanded(true);
        localStorage.setItem('scheduleExpanded', 'true');
    }

    let html = `
        <h2>📅 Your Personalized Study Schedule</h2>
        <div class="schedule-metadata">
            <p><strong>Exam Date:</strong> ${new Date(metadata.exam_date).toDateString()}</p>
            <p><strong>Days to Prepare:</strong> ${metadata.days_until_exam} days</p>
            <p><strong>Study Status:</strong> ${metadata.status}</p>
        </div>
    `;

    const sortedDates = Object.keys(schedule).sort();
    for (const date of sortedDates) {
        const dateObj = new Date(date + 'T00:00:00');
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        html += `<div class="schedule-day">
            <h3>${dayName}, ${formattedDate}</h3>`;

        const topics = schedule[date];
        let totalHours = 0;

        for (const topic of topics) {
            totalHours += topic.hours;
            html += `
                <div class="schedule-topic">
                    <strong>📖 ${topic.topic}</strong>
                    <span class="difficulty ${topic.difficulty}">${topic.difficulty}</span>
                    <span class="hours">⏱ ${topic.hours} hrs</span>
                </div>
            `;
        }

        html += `<p class="total-hours">Total: ${totalHours.toFixed(1)} hours</p></div>`;
    }

    html += `
        <div class="schedule-tips">
            <h3>💡 Tips for Success:</h3>
            <ul>
                ${(metadata.tips || []).map(tip => `<li>${tip}</li>`).join('')}
            </ul>
        </div>
    `;

    scheduleSection.innerHTML = html;
}