
// Three.js 3D Avatar for Portfolio
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

        // Speech Bubble
        this.createSpeechBubble();

        // Events
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.container.addEventListener('click', () => this.introSpeech());
        window.addEventListener('resize', () => this.onResize());

        // Start Loop
        this.animate();

        // Initial Greeting
        setTimeout(() => this.showBubble("مرحباً! أنا راشد، مساعدك الذكي. اضغط علي للتحدث!", 4000), 1000);
    }

    buildRobot() {
        // Material
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.5, roughness: 0.2 });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2 });
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00ccff }); // Glowing blue eyes
        const glassMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.4 });

        // Head (Cube with rounded corners style via scale)
        const headGeo = new THREE.BoxGeometry(1.2, 1, 1);
        this.head = new THREE.Mesh(headGeo, bodyMat);
        this.robot.add(this.head);

        // Face Screen (Black area)
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
        this.antBall = new THREE.Mesh(antBallGeo, new THREE.MeshBasicMaterial({ color: 0xff3333 })); // Red blinking light
        this.antBall.position.set(0, 1.0, 0);
        this.head.add(this.antBall);

        // Floating Body (Just a simple shape below head)
        const bodyGeo = new THREE.ConeGeometry(0.6, 1, 4);
        this.body = new THREE.Mesh(bodyGeo, bodyMat);
        this.body.rotation.x = Math.PI; // upside down pyramid style
        this.body.position.y = -1.2;
        this.robot.add(this.body);

        // Neck
        const neckGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.5);
        const neck = new THREE.Mesh(neckGeo, darkMat);
        neck.position.y = -0.6;
        this.robot.add(neck);

        // Headphones / Ears
        const earGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.2);
        earGeo.rotateZ(Math.PI / 2);
        const leftEar = new THREE.Mesh(earGeo, darkMat);
        leftEar.position.set(-0.65, 0, 0);
        this.head.add(leftEar);

        const rightEar = new THREE.Mesh(earGeo, darkMat);
        rightEar.position.set(0.65, 0, 0);
        this.head.add(rightEar);
    }

    createSpeechBubble() {
        this.bubble = document.createElement('div');
        this.bubble.className = 'avatar-bubble';
        this.bubble.style.display = 'none';
        this.container.appendChild(this.bubble);
    }

    showBubble(text, duration = 3000) {
        this.bubble.innerText = text;
        this.bubble.style.display = 'block';
        this.bubble.classList.add('pop-in');

        if (this.bubbleTimeout) clearTimeout(this.bubbleTimeout);
        this.bubbleTimeout = setTimeout(() => {
            this.bubble.style.display = 'none';
            this.bubble.classList.remove('pop-in');
        }, duration);
    }

    onMouseMove(event) {
        // Normalize mouse position -1 to 1
        this.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    onResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    introSpeech() {
        if (this.isTalking) return;
        this.isTalking = true;

        const messages = [
            "أهلاً بك في موقع راشد!",
            "أنا هنا لمساعدتك في استكشاف الموقع.",
            "يمكنك رؤية المشاريع في الأسفل، أو التواصل معنا عبر النموذج.",
            "استمتع بوقتك!"
        ];

        let i = 0;

        // Visual talking effect
        this.antBall.material.color.setHex(0x00ff00); // Turn green

        const speakNext = () => {
            if (i >= messages.length) {
                this.isTalking = false;
                this.antBall.material.color.setHex(0xff3333); // Back to red
                return;
            }

            const text = messages[i];
            this.showBubble(text, 2500);

            // TTS
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'ar-SA'; // Arabic
                utterance.rate = 0.85; // Slightly slower for clarity
                utterance.pitch = 1.0;

                // Improve voice selection for Arabic
                const voices = window.speechSynthesis.getVoices();
                const arabicVoice = voices.find(v => v.lang.includes('ar') || v.name.includes('Arabic') || v.name.includes('Maged'));
                if (arabicVoice) {
                    utterance.voice = arabicVoice;
                }

                utterance.onend = () => {
                    i++;
                    setTimeout(speakNext, 500);
                };
                window.speechSynthesis.speak(utterance);
            } else {
                // Fallback just delay
                i++;
                setTimeout(speakNext, 3000);
            }
        };

        speakNext();
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const time = this.clock.getElapsedTime();

        // Bobbing up and down
        this.robot.position.y = Math.sin(time * 2) * 0.1;

        // Look at mouse (interpolated for smoothness)
        // We only want it to look left/right mainly
        this.robot.rotation.y = THREE.MathUtils.lerp(this.robot.rotation.y, this.mouseX * 0.5, 0.1);
        this.robot.rotation.x = THREE.MathUtils.lerp(this.robot.rotation.x, this.mouseY * 0.2, 0.1);

        // Blinking light pulse
        if (!this.isTalking) {
            const pulse = (Math.sin(time * 5) + 1) / 2; // 0 to 1
            this.antBall.material.emissiveIntensity = pulse;
        }

        // Talking animation (scale Y of head slightly?)
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
    // Check if container exists, if not create it dynamically (safety)
    if (!document.getElementById('avatar-container')) {
        const div = document.createElement('div');
        div.id = 'avatar-container';
        document.body.appendChild(div);
    }

    // Init Script
    const avatar = new RobotAvatar('avatar-container');
});
