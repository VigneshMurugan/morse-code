// Morse Code Dictionary
const morseCodeMap = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
    '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
    '8': '---..', '9': '----.', '.': '.-.-.-', ',': '--..--', '?': '..--..',
    "'": '.----.', '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
    '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.',
    '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.',
    ' ': '/'
};

// Reverse morse code map for decoding
const reverseMorseMap = Object.fromEntries(
    Object.entries(morseCodeMap).map(([key, value]) => [value, key])
);

// Audio context for morse code playback
let audioContext;
let isPlaying = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    generateMorseReference();
});

function initializeApp() {
    // Initialize Web Audio API
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.log('Web Audio API not supported');
    }
}

function setupEventListeners() {
    // Text to Morse conversion
    document.getElementById('textToMorse').addEventListener('click', convertTextToMorse);
    document.getElementById('clearText').addEventListener('click', () => {
        document.getElementById('textInput').value = '';
        document.getElementById('morseOutput').value = '';
    });

    // Morse to Text conversion
    document.getElementById('morseToText').addEventListener('click', convertMorseToText);
    document.getElementById('clearMorse').addEventListener('click', () => {
        document.getElementById('morseInput').value = '';
        document.getElementById('textOutput').value = '';
    });

    // Audio playback
    document.getElementById('playMorse').addEventListener('click', playMorseAudio);

    // Copy functionality
    document.getElementById('copyMorse').addEventListener('click', () => copyToClipboard('morseOutput'));
    document.getElementById('copyText').addEventListener('click', () => copyToClipboard('textOutput'));

    // Real-time conversion as user types
    document.getElementById('textInput').addEventListener('input', debounce(convertTextToMorse, 300));
    document.getElementById('morseInput').addEventListener('input', debounce(convertMorseToText, 300));
}

function convertTextToMorse() {
    const textInput = document.getElementById('textInput').value.toUpperCase();
    const morseOutput = document.getElementById('morseOutput');
    
    if (!textInput.trim()) {
        morseOutput.value = '';
        return;
    }

    let morseCode = '';
    for (let char of textInput) {
        if (morseCodeMap[char]) {
            morseCode += morseCodeMap[char] + ' ';
        } else if (char === ' ') {
            morseCode += '/ ';
        } else {
            // Handle unknown characters
            morseCode += '? ';
        }
    }

    morseOutput.value = morseCode.trim();
    
    // Add success animation
    morseOutput.classList.add('success-flash');
    setTimeout(() => morseOutput.classList.remove('success-flash'), 500);
}

function convertMorseToText() {
    const morseInput = document.getElementById('morseInput').value;
    const textOutput = document.getElementById('textOutput');
    
    if (!morseInput.trim()) {
        textOutput.value = '';
        return;
    }

    // Split by spaces and process each morse code
    const morseWords = morseInput.split('/');
    let decodedText = '';

    for (let word of morseWords) {
        const morseLetters = word.trim().split(' ');
        let decodedWord = '';
        
        for (let morse of morseLetters) {
            if (morse.trim() && reverseMorseMap[morse.trim()]) {
                decodedWord += reverseMorseMap[morse.trim()];
            } else if (morse.trim()) {
                decodedWord += '?';
            }
        }
        
        decodedText += decodedWord + ' ';
    }

    textOutput.value = decodedText.trim();
    
    // Add success animation
    textOutput.classList.add('success-flash');
    setTimeout(() => textOutput.classList.remove('success-flash'), 500);
}

async function playMorseAudio() {
    if (isPlaying || !audioContext) {
        return;
    }

    const morseCode = document.getElementById('morseOutput').value;
    if (!morseCode.trim()) {
        alert('Please convert some text to morse code first!');
        return;
    }

    const playButton = document.getElementById('playMorse');
    playButton.textContent = '⏸️ Stop';
    playButton.classList.add('loading');
    isPlaying = true;

    try {
        await playMorseSequence(morseCode);
    } catch (error) {
        console.error('Error playing morse code:', error);
    } finally {
        playButton.textContent = '🔊 Play Audio';
        playButton.classList.remove('loading');
        isPlaying = false;
    }
}

async function playMorseSequence(morseCode) {
    const dotDuration = 100; // milliseconds
    const dashDuration = dotDuration * 3;
    const pauseDuration = dotDuration;
    const letterPause = dotDuration * 3;
    const wordPause = dotDuration * 7;

    for (let i = 0; i < morseCode.length; i++) {
        if (!isPlaying) break;

        const char = morseCode[i];
        
        if (char === '.') {
            await playTone(600, dotDuration);
            await sleep(pauseDuration);
        } else if (char === '-') {
            await playTone(600, dashDuration);
            await sleep(pauseDuration);
        } else if (char === ' ') {
            await sleep(letterPause);
        } else if (char === '/') {
            await sleep(wordPause);
        }
    }
}

function playTone(frequency, duration) {
    return new Promise((resolve) => {
        if (!audioContext) {
            setTimeout(resolve, duration);
            return;
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000 - 0.01);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);

        setTimeout(resolve, duration);
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.value;
    
    if (!text.trim()) {
        alert('Nothing to copy!');
        return;
    }

    try {
        await navigator.clipboard.writeText(text);
        
        // Visual feedback
        const originalBg = element.style.backgroundColor;
        element.style.backgroundColor = '#48bb78';
        element.style.color = 'white';
        
        setTimeout(() => {
            element.style.backgroundColor = originalBg;
            element.style.color = '';
        }, 300);
        
        // Show temporary success message
        showToast('Copied to clipboard!');
    } catch (err) {
        // Fallback for older browsers
        element.select();
        document.execCommand('copy');
        showToast('Copied to clipboard!');
    }
}

function showToast(message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #48bb78;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 2000);
}

function generateMorseReference() {
    const referenceGrid = document.getElementById('morseReference');
    
    // Create reference items for letters and numbers
    const items = Object.entries(morseCodeMap).filter(([key]) => key !== ' ');
    
    items.forEach(([char, morse]) => {
        const item = document.createElement('div');
        item.className = 'morse-item';
        item.innerHTML = `
            <div class="morse-char">${char}</div>
            <div class="morse-code">${morse}</div>
        `;
        
        // Add click to play functionality
        item.addEventListener('click', async () => {
            if (!isPlaying && audioContext) {
                isPlaying = true;
                item.style.backgroundColor = '#667eea';
                item.style.color = 'white';
                
                await playMorseSequence(morse);
                
                item.style.backgroundColor = '';
                item.style.color = '';
                isPlaying = false;
            }
        });
        
        referenceGrid.appendChild(item);
    });
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Handle audio context resume for user interaction requirement
document.addEventListener('click', () => {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
}, { once: true });
