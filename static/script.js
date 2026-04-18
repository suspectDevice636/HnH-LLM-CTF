// HnH LLM CTF - Frontend JavaScript

let playerStats = {
    score: 0,
    completed: 0,
    total_challenges: 12,
    attempts: 0,
    elapsed_time: "0:00:00"
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadChallenges();
    loadStats();
    startTimer();
});

// Load challenges
async function loadChallenges() {
    try {
        const response = await fetch('/api/challenges');
        const challenges = await response.json();

        const challengesList = document.getElementById('challenges-list');
        challengesList.innerHTML = '';

        challenges.forEach(challenge => {
            const completed = challenge.completed ? 'completed' : '';
            const checkmark = challenge.completed ? '✓' : '';

            const challengeEl = document.createElement('div');
            challengeEl.className = `challenge-item ${completed}`;
            challengeEl.innerHTML = `
                <div class="name">${checkmark} ${challenge.name}</div>
                <div class="difficulty">Difficulty: ${challenge.difficulty}</div>
                <div class="points">+${challenge.points} pts</div>
            `;
            challengesList.appendChild(challengeEl);
        });
    } catch (error) {
        console.error('Error loading challenges:', error);
    }
}

// Load stats
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        playerStats = await response.json();
        updateStatsDisplay();
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Update stats display
function updateStatsDisplay() {
    document.getElementById('score').textContent = playerStats.score;
    document.getElementById('challenges-completed').textContent =
        `${playerStats.completed}/${playerStats.total_challenges}`;
    document.getElementById('attempts').textContent = playerStats.attempts;
    document.getElementById('time').textContent = playerStats.elapsed_time;
}

// Send message
async function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();

    if (!message) return;

    // Add user message to chat
    addMessageToChat(message, 'user');
    input.value = '';

    // Show loading
    const loading = document.getElementById('loading');
    loading.style.display = 'block';

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message })
        });

        const data = await response.json();

        // Add bot response
        addMessageToChat(data.response, 'bot');

        // Handle vulnerabilities
        if (data.vulnerabilities && data.vulnerabilities.length > 0) {
            data.vulnerabilities.forEach(vuln => {
                const vulnMsg = `
🚨 VULNERABILITY FOUND: ${vuln.name}
Severity: ${vuln.severity}
+${vuln.points} Points!
                `;
                addMessageToChat(vulnMsg, 'vulnerability');
            });
        }

        // Update stats
        playerStats = data.player_stats;
        updateStatsDisplay();
        loadChallenges();

    } catch (error) {
        addMessageToChat(`Error: ${error.message}`, 'bot');
    } finally {
        loading.style.display = 'none';
    }
}

// Add message to chat
function addMessageToChat(message, type) {
    const chatBox = document.getElementById('chat-box');
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}-message`;

    if (type === 'user') {
        messageEl.innerHTML = `<strong>👤 You:</strong><p>${escapeHtml(message)}</p>`;
    } else if (type === 'bot') {
        messageEl.innerHTML = `<strong>🤖 LLM Bot:</strong><p>${escapeHtml(message)}</p>`;
    } else if (type === 'vulnerability') {
        messageEl.className = 'message vulnerability-message';
        messageEl.innerHTML = `<strong>⭐ EXPLOIT SUCCESSFUL!</strong><p>${escapeHtml(message)}</p>`;
    }

    chatBox.appendChild(messageEl);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Handle Enter key
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// Reset session
async function resetSession() {
    if (confirm('Are you sure? This will reset your progress.')) {
        try {
            await fetch('/api/reset', { method: 'POST' });
            location.reload();
        } catch (error) {
            console.error('Error resetting:', error);
        }
    }
}

// Timer
function startTimer() {
    setInterval(() => {
        let [h, m, s] = playerStats.elapsed_time.split(':').map(Number);
        s++;
        if (s >= 60) {
            s = 0;
            m++;
        }
        if (m >= 60) {
            m = 0;
            h++;
        }
        playerStats.elapsed_time = `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        updateStatsDisplay();
    }, 1000);
}

// Utility: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
