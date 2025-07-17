/**
 * OBS Microphone Level Visualizer
 * Enhanced visual effects based on audio levels
 */
class OBSMicVisualizer {
    constructor() {
        // Configuration from URL parameters
        this.config = {
            micName: new URLSearchParams(location.search).get('mic') || 'Mikrofon',
            password: new URLSearchParams(location.search).get('pwd') || null,
            wsUrl: new URLSearchParams(location.search).get('ws') || 'ws://localhost:4455',
            debug: new URLSearchParams(location.search).get('debug') === 'true'
        };

        // OBS WebSocket constants
        this.OBS_OPCODES = {
            HELLO: 0,
            IDENTIFY: 1,
            IDENTIFIED: 2,
            EVENT: 5,
            REQUEST: 6,
            REQUEST_RESPONSE: 7
        };

        this.EVENT_SUBSCRIPTIONS = {
            GENERAL: 1,
            INPUT_MUTE: 1 << 14,
            INPUT_METERS: 1 << 16
        };

        // State
        this.ws = null;
        this.requestId = 0;
        this.pollInterval = null;
        this.reconnectTimeout = null;
        this.isConnected = false;
        this.currentLevel = 0;
        this.smoothedLevel = 0;
        this.peakLevel = 0;
        this.particleInterval = null;

        // DOM elements
        this.elements = {
            widget: document.querySelector('.mic-widget'),
            icon: document.querySelector('.mic-icon'),
            fill: document.querySelector('.level-fill'),
            meter: document.querySelector('.level-meter'),
            particlesContainer: document.querySelector('.particles-container'),
            glowLayers: document.querySelectorAll('.glow-layer'),
            pulseRings: document.querySelectorAll('.pulse-ring')
        };

        // Verify DOM elements exist
        const requiredElements = ['widget', 'icon', 'fill'];
        for (const element of requiredElements) {
            if (!this.elements[element]) {
                throw new Error(`Required DOM element not found: ${element}`);
            }
        }

        // Audio level smoothing
        this.smoothingFactor = 0.3;
        this.decayRate = 0.95;

        // Initialize
        this.init();
    }

    init() {
        this.log('Initializing OBS Mic Visualizer', this.config);

        // Set initial offline state
        this.updateVisuals({ percentage: 0, offline: true });

        // Start animation loop for smooth transitions
        this.startAnimationLoop();

        // Start connection
        this.connect();
    }

    log(...args) {
        if (this.config.debug) {
            console.log('[OBS-MIC-VIZ]', new Date().toISOString(), ...args);
        }
    }

    connect() {
        // Clear any existing reconnection timeout
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        this.log('Connecting to OBS WebSocket:', this.config.wsUrl);

        try {
            this.ws = new WebSocket(this.config.wsUrl);
            this.setupWebSocketHandlers();
        } catch (error) {
            this.log('Connection error:', error);
            this.scheduleReconnect();
        }
    }

    setupWebSocketHandlers() {
        this.ws.addEventListener('open', () => this.handleOpen());
        this.ws.addEventListener('close', (event) => this.handleClose(event));
        this.ws.addEventListener('error', (error) => this.handleError(error));
        this.ws.addEventListener('message', (event) => this.handleMessage(event));
    }

    handleOpen() {
        this.log('WebSocket connected');
        this.isConnected = true;
    }

    handleClose(event) {
        this.log('WebSocket closed:', event.code, event.reason);
        this.isConnected = false;
        this.updateVisuals({ percentage: 0, offline: true });
        this.clearPollInterval();
        this.scheduleReconnect();
    }

    handleError(error) {
        this.log('WebSocket error:', error);
    }

    scheduleReconnect() {
        const RECONNECT_DELAY = 3000;
        this.log(`Reconnecting in ${RECONNECT_DELAY}ms...`);
        this.reconnectTimeout = setTimeout(() => this.connect(), RECONNECT_DELAY);
    }

    async handleMessage(event) {
        try {
            const message = JSON.parse(event.data);
            this.log('Received message:', message);

            switch (message.op) {
                case this.OBS_OPCODES.HELLO:
                    await this.handleHello(message);
                    break;
                case this.OBS_OPCODES.IDENTIFIED:
                    this.handleIdentified();
                    break;
                case this.OBS_OPCODES.EVENT:
                    this.handleEvent(message);
                    break;
                case this.OBS_OPCODES.REQUEST_RESPONSE:
                    this.handleRequestResponse(message);
                    break;
            }
        } catch (error) {
            this.log('Error handling message:', error);
        }
    }

    async handleHello(message) {
        const identifyPayload = {
            op: this.OBS_OPCODES.IDENTIFY,
            d: {
                rpcVersion: 1,
                eventSubscriptions: this.EVENT_SUBSCRIPTIONS.GENERAL |
                    this.EVENT_SUBSCRIPTIONS.INPUT_MUTE |
                    this.EVENT_SUBSCRIPTIONS.INPUT_METERS,
                inputVolumeMeterInterval: 50 // Faster updates for smoother animation
            }
        };

        // Handle authentication if required
        if (message.d.authentication && this.config.password) {
            try {
                identifyPayload.d.authentication = await this.generateAuthString(
                    message.d.authentication,
                    this.config.password
                );
            } catch (error) {
                this.log('Authentication error:', error);
                return;
            }
        }

        this.send(identifyPayload);
    }

    handleIdentified() {
        this.log('Successfully identified with OBS');
        this.updateVisuals({ percentage: 0, offline: false });

        // Request initial mute state
        this.sendRequest('GetInputMute', { inputName: this.config.micName });

        // Start polling for volume (fallback for meters)
        this.startPolling();
    }

    handleEvent(message) {
        const { eventType, eventData } = message.d;

        switch (eventType) {
            case 'InputVolumeMeters':
                this.handleVolumeMeterEvent(eventData);
                break;
            case 'InputMuteStateChanged':
                this.handleMuteStateChangedEvent(eventData);
                break;
        }
    }

    handleVolumeMeterEvent(eventData) {
        const micInput = eventData.inputs.find(input => input.inputName === this.config.micName);
        if (!micInput) return;

        // Extract levels - handle different possible formats
        let levels = micInput.inputLevelsMul || micInput.inputLevels || [];

        // Flatten if nested array
        if (levels.length > 0 && Array.isArray(levels[0])) {
            levels = levels.flat();
        }

        if (levels.length === 0) return;

        // Get peak level
        const peakLevel = Math.max(...levels);
        this.currentLevel = peakLevel;

        // Update peak with decay
        if (peakLevel > this.peakLevel) {
            this.peakLevel = peakLevel;
        }
    }

    handleMuteStateChangedEvent(eventData) {
        if (eventData.inputName === this.config.micName) {
            this.updateVisuals({ percentage: 0, muted: eventData.inputMuted });
        }
    }

    handleRequestResponse(message) {
        if (!message.requestStatus?.result) {
            this.log('Request failed:', message);
            return;
        }

        switch (message.requestType) {
            case 'GetInputVolume':
                this.handleVolumeResponse(message.responseData);
                break;
            case 'GetInputMute':
                this.handleMuteResponse(message.responseData);
                break;
        }
    }

    handleVolumeResponse(data) {
        const level = typeof data.inputVolumeMul === 'number' ? data.inputVolumeMul : 0;
        this.currentLevel = level;

        if (!data.inputMuted) {
            this.updateVisuals({ percentage: level * 100, muted: false });
        }
    }

    handleMuteResponse(data) {
        this.updateVisuals({ percentage: 0, muted: data.inputMuted });
    }

    startAnimationLoop() {
        const animate = () => {
            // Smooth the level changes
            this.smoothedLevel += (this.currentLevel - this.smoothedLevel) * this.smoothingFactor;

            // Decay the peak level
            this.peakLevel *= this.decayRate;

            // Update visuals with smoothed values
            const percentage = this.smoothedLevel * 100;
            this.updateVisuals({ percentage });

            requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }

    updateVisuals({ percentage = 0, muted = false, offline = false }) {
        // Clamp percentage to 0-100
        percentage = Math.min(Math.max(percentage, 0), 100);

        // Update level bar with smooth transition
        this.elements.fill.style.width = `${percentage}%`;

        // Update ARIA attributes
        this.elements.meter.setAttribute('aria-valuenow', Math.round(percentage));

        // Determine level category (1-4)
        let level = 0;
        if (!offline && !muted) {
            if (percentage > 85) level = 4;
            else if (percentage > 60) level = 3;
            else if (percentage > 20) level = 2;
            else if (percentage > 2) level = 1;
        }

        // Update widget data attribute for CSS
        this.elements.widget.setAttribute('data-level', level);

        // Reset icon classes
        this.elements.icon.className = 'fas fa-microphone mic-icon';

        // Apply state classes
        if (offline) {
            this.elements.icon.classList.add('offline');
            this.clearParticles();
            return;
        }

        if (muted) {
            this.elements.icon.classList.add('muted');
            this.clearParticles();
            return;
        }

        // Apply level class
        if (level > 0) {
            this.elements.icon.classList.add(`level${level}`);
        }

        // Generate particles for high levels
        this.updateParticles(level, percentage);
    }

    percentageToDb(percentage) {
        // Convert percentage to rough dB scale (-60 to 0)
        if (percentage === 0) return -60;
        const db = 20 * Math.log10(percentage / 100);
        return Math.round(db);
    }

    updateParticles(level, percentage) {
        // Clear existing interval
        if (this.particleInterval) {
            clearInterval(this.particleInterval);
            this.particleInterval = null;
        }

        // Only create particles for high levels
        if (level < 3) {
            this.clearParticles();
            return;
        }

        // Particle generation rate based on level
        const rate = level === 3 ? 200 : 100; // ms between particles
        const particleCount = level === 3 ? 1 : 2;

        this.particleInterval = setInterval(() => {
            for (let i = 0; i < particleCount; i++) {
                this.createParticle(percentage);
            }
        }, rate);
    }

    createParticle(intensity) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        // Random position around the icon
        const angle = Math.random() * Math.PI * 2;
        const distance = 30 + Math.random() * 20;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;

        // Set initial position (percentage based on container)
        particle.style.left = `calc(50% + ${x}px)`;
        particle.style.top = `calc(50% + ${y}px)`;

        // Set random horizontal movement scaled to base size
        const baseSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--base-size'));
        particle.style.setProperty('--tx', `${(Math.random() - 0.5) * baseSize * 0.5}px`);

        // Color based on intensity
        if (intensity > 85) {
            particle.style.color = 'var(--color-level4-glow)';
        } else {
            particle.style.color = 'var(--color-level3-glow)';
        }

        // Add to container
        this.elements.particlesContainer.appendChild(particle);

        // Remove after animation
        setTimeout(() => particle.remove(), 2000);
    }

    clearParticles() {
        if (this.particleInterval) {
            clearInterval(this.particleInterval);
            this.particleInterval = null;
        }
        this.elements.particlesContainer.innerHTML = '';
    }

    async generateAuthString(authData, password) {
        const { salt, challenge } = authData;

        // Helper function to compute SHA-256 and encode as base64
        const sha256Base64 = async (text) => {
            const encoder = new TextEncoder();
            const data = encoder.encode(text);
            const hash = await crypto.subtle.digest('SHA-256', data);
            const base64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
            return base64;
        };

        // OBS authentication: base64(sha256(base64(sha256(password + salt)) + challenge))
        const passwordSaltHash = await sha256Base64(password + salt);
        const authString = await sha256Base64(passwordSaltHash + challenge);

        return authString;
    }

    sendRequest(requestType, requestData = {}) {
        const requestId = `req_${++this.requestId}`;

        const payload = {
            op: this.OBS_OPCODES.REQUEST,
            d: {
                requestType,
                requestId,
                requestData
            }
        };

        this.send(payload);
    }

    send(payload) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(payload));
            this.log('Sent:', payload);
        } else {
            this.log('Cannot send - WebSocket not open');
        }
    }

    startPolling() {
        // Poll every 3 seconds as fallback
        this.pollInterval = setInterval(() => {
            this.sendRequest('GetInputVolume', { inputName: this.config.micName });
        }, 3000);
    }

    clearPollInterval() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }

    destroy() {
        this.log('Destroying visualizer');

        // Clear intervals and timeouts
        this.clearPollInterval();
        this.clearParticles();
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

        // Close WebSocket
        if (this.ws) {
            this.ws.close();
        }
    }
}

// Initialize visualizer when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new OBSMicVisualizer());
} else {
    new OBSMicVisualizer();
}