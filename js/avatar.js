
// Three.js 3D Avatar for Portfolio & Chatbot
// Uses a simple geometric robot construction

class RobotAvatar {
    constructor(containerId) {
        this.container = document.getElementById(containerId);

        // Scene setup
        this.scene = new THREE.Scene();

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(50, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.camera.position.z = 5;
        this.camera.position.y = 0.5;

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 0.8);
        pointLight.position.set(5, 5, 5);
        this.scene.add(pointLight);

        // Robot Group
        this.robot = new THREE.Group();
        this.scene.add(this.robot);

        // Build Robot Parts
        this.buildRobot();

        // Animation state
        this.clock = new THREE.Clock();
        this.isTalking = false;

        // Mouse interaction
        this.mouseX = 0;
        this.mouseY = 0;

        // Chat UI
        this.buildChatUI();
        this.isChatOpen = false;

        // Events
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.renderer.domElement.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent ensuring bubble closing immediately
            this.toggleChat();
        });
        window.addEventListener('resize', () => this.onResize());

        // Start Loop
        this.animate();

        // Initial Greeting
        setTimeout(() => this.showBubble("مرحباً! أنا راشد. اضغط هنا للتحدث معي!", 4000), 1000);
    }

    buildRobot() {
        // Material
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.5, roughness: 0.2 });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2 });
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00ccff }); // Glowing blue eyes

        // Head
        const headGeo = new THREE.BoxGeometry(1.2, 1, 1);
        this.head = new THREE.Mesh(headGeo, bodyMat);
        this.robot.add(this.head);

        // Face Screen
        const faceGeo = new THREE.BoxGeometry(1.0, 0.6, 0.1);
        const face = new THREE.Mesh(faceGeo, darkMat);
        face.position.set(0, 0, 0.46);
        this.head.add(face);

        // Eyes
        const eyeGeo = new THREE.SphereGeometry(0.12, 16, 16);
        this.leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        this.leftEye.position.set(-0.25, 0, 0.52);
        this.head.add(this.leftEye);

        this.rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        this.rightEye.position.set(0.25, 0, 0.52);
        this.head.add(this.rightEye);

        // Antenna
        const antStickGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.5);
        const antStick = new THREE.Mesh(antStickGeo, bodyMat);
        antStick.position.set(0, 0.75, 0);
        this.head.add(antStick);

        const antBallGeo = new THREE.SphereGeometry(0.15);
        this.antBall = new THREE.Mesh(antBallGeo, new THREE.MeshBasicMaterial({ color: 0xff3333 }));
        this.antBall.position.set(0, 1.0, 0);
        this.head.add(this.antBall);

        // Body
        const bodyGeo = new THREE.ConeGeometry(0.6, 1, 4);
        this.body = new THREE.Mesh(bodyGeo, bodyMat);
        this.body.rotation.x = Math.PI;
        this.body.position.y = -1.2;
        this.robot.add(this.body);

        // Neck
        const neckGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.5);
        const neck = new THREE.Mesh(neckGeo, darkMat);
        neck.position.y = -0.6;
        this.robot.add(neck);

        // Ears
        const earGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.2);
        earGeo.rotateZ(Math.PI / 2);
        const leftEar = new THREE.Mesh(earGeo, darkMat);
        leftEar.position.set(-0.65, 0, 0);
        this.head.add(leftEar);

        const rightEar = new THREE.Mesh(earGeo, darkMat);
        rightEar.position.set(0.65, 0, 0);
        this.head.add(rightEar);
    }

    buildChatUI() {
        // Chat Window
        this.chatWindow = document.createElement('div');
        this.chatWindow.className = 'avatar-chat-window';
        this.chatWindow.innerHTML = `
            <div class="chat-header">
                <span>المساعد الذكي - راشد</span>
                <span class="chat-close">&times;</span>
            </div>
            <div class="chat-messages" id="chat-messages">
                <div class="message bot">مرحباً! أنا هنا للإجابة على جميع اسئلتك حول الموقع ومشاريعي. تفضل بالسؤال!</div>
            </div>
            <div class="chat-input-area">
                <input type="text" id="chat-input" placeholder="اكتب رسالتك هنا...">
                <button id="chat-send"><i class="fas fa-paper-plane"></i></button>
            </div>
        `;
        this.container.appendChild(this.chatWindow);

        // Simple Bubble (for temporary notifications)
        this.bubble = document.createElement('div');
        this.bubble.className = 'avatar-bubble';
        this.bubble.style.display = 'none';
        this.container.appendChild(this.bubble);

        // Events
        this.chatWindow.querySelector('.chat-close').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleChat();
        });

        const input = this.chatWindow.querySelector('#chat-input');
        const sendBtn = this.chatWindow.querySelector('#chat-send');

        sendBtn.addEventListener('click', () => this.handleSendMessage());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSendMessage();
        });
    }

    toggleChat() {
        this.isChatOpen = !this.isChatOpen;
        this.chatWindow.style.display = this.isChatOpen ? 'flex' : 'none';

        if (this.isChatOpen) {
            this.bubble.style.display = 'none'; // hide bubble if chat opens
            // Focus input
            setTimeout(() => {
                this.chatWindow.querySelector('#chat-input').focus();
            }, 100);

            // Allow audio context to resume/start
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel(); // Reset any pending
            }
        }
    }

    showBubble(text, duration = 3000) {
        if (this.isChatOpen) return; // Don't show bubble if chat is open

        this.bubble.innerText = text;
        this.bubble.style.display = 'block';
        this.bubble.classList.add('pop-in');

        if (this.bubbleTimeout) clearTimeout(this.bubbleTimeout);
        this.bubbleTimeout = setTimeout(() => {
            this.bubble.style.display = 'none';
            this.bubble.classList.remove('pop-in');
        }, duration);
    }

    handleSendMessage() {
        const input = this.chatWindow.querySelector('#chat-input');
        const text = input.value.trim();
        if (!text) return;

        // Add User Message
        this.addMessage(text, 'user');
        input.value = '';

        // Generate Response
        setTimeout(() => {
            const response = this.getBotResponse(text);
            this.addMessage(response, 'bot');
            this.speak(response);
        }, 500);
    }

    addMessage(text, sender) {
        const msgContainer = this.chatWindow.querySelector('#chat-messages');
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        msgDiv.innerText = text;
        msgContainer.appendChild(msgDiv);
        msgContainer.scrollTop = msgContainer.scrollHeight;
    }

    getBotResponse(input) {
        const lowerInput = input.toLowerCase();

        // 1. Greetings
        if (lowerInput.includes('مرحبا') || lowerInput.includes('هلا') || lowerInput.includes('سلام') || lowerInput.includes('hi') || lowerInput.includes('hello')) {
            return "يا هلا! كيف أقدر أساعدك اليوم؟";
        }

        // 2. Identity
        if (lowerInput.includes('من انت') || lowerInput.includes('اسمك') || lowerInput.includes('مين انت')) {
            return "أنا راشد، المساعد الذكي لهذا الموقع. مبرمج خصيصاً لمساعدتك!";
        }

        // 3. Website Info / Projects
        if (lowerInput.includes('موقع') || lowerInput.includes('مشروع') || lowerInput.includes('اعمال') || lowerInput.includes('ماذا يوجد')) {
            return "هذا الموقع هو معرض لأعمالي البرمجية. يحتوي على مشاريع مثل: لعبة المزرعة 3D، وتطبيق القرآن الكريم، والخزنة الذكية. تصفح قسم 'Projects' لرؤيتها!";
        }

        // 4. Contact
        if (lowerInput.includes('تواصل') || lowerInput.includes('رقم') || lowerInput.includes('اتصل') || lowerInput.includes('ايميل')) {
            return "يمكنك التواصل معي عبر النموذج في أسفل الصفحة 'Contact'، أو عبر حساباتي الاجتماعية الموجودة هناك.";
        }

        // 5. Skills
        if (lowerInput.includes('مهارات') || lowerInput.includes('لغات') || lowerInput.includes('خبرة')) {
            return "لدي خبرة في HTML, CSS, JavaScript, Python وأعمل حالياً على تطوير الألعاب باستخدام Three.js ومحركات أخرى.";
        }

        // 6. Admin / Control Panel
        if (lowerInput.includes('ادمن') || lowerInput.includes('تحكم') || lowerInput.includes('دخول') || lowerInput.includes('admin')) {
            return "للوصول للوحة التحكم، استخدم رابط 'Admin Login' الموجود في تذييل الصفحة (Footer).";
        }

        // Default
        return "سؤال جيد! أنا عبارة عن ذكاء اصطناعي محدود حالياً، لكني هنا لأقول لك أن الموقع مصمم بكل حب وإتقان. هل لديك سؤال عن المشاريع؟";
    }

    speak(text) {
        // Visual indicator
        this.isTalking = true;
        this.antBall.material.color.setHex(0x00ff00);

        if ('speechSynthesis' in window) {
            // Cancel previous
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ar-SA';
            utterance.rate = 0.9;
            utterance.pitch = 1.0;

            // Voice selection
            const voices = window.speechSynthesis.getVoices();
            const arabicVoice = voices.find(v => v.lang.includes('ar') || v.name.includes('Arabic'));
            if (arabicVoice) utterance.voice = arabicVoice;

            utterance.onend = () => {
                this.isTalking = false;
                this.antBall.material.color.setHex(0xff3333);
            };

            window.speechSynthesis.speak(utterance);
        } else {
            // Fallback if no TTS
            setTimeout(() => {
                this.isTalking = false;
                this.antBall.material.color.setHex(0xff3333);
            }, 2000);
        }
    }

    onMouseMove(event) {
        this.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    onResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const time = this.clock.getElapsedTime();

        this.robot.position.y = Math.sin(time * 2) * 0.1;
        this.robot.rotation.y = THREE.MathUtils.lerp(this.robot.rotation.y, this.mouseX * 0.5, 0.1);
        this.robot.rotation.x = THREE.MathUtils.lerp(this.robot.rotation.x, this.mouseY * 0.2, 0.1);

        if (!this.isTalking) {
            const pulse = (Math.sin(time * 5) + 1) / 2;
            this.antBall.material.emissiveIntensity = pulse;
        }

        if (this.isTalking) {
            this.head.scale.y = 1 + Math.sin(time * 20) * 0.02;
        } else {
            this.head.scale.y = 1;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Init when page loads
window.addEventListener('load', () => {
    if (!document.getElementById('avatar-container')) {
        const div = document.createElement('div');
        div.id = 'avatar-container';
        document.body.appendChild(div);
    }
    const avatar = new RobotAvatar('avatar-container');
});
