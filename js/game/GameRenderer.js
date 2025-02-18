export class GameRenderer {
  constructor(container) {
    this.container = container;
    this.width = container.clientWidth;
    this.height = container.clientHeight;
    
    this.setupScene();
    this.setupCamera();
    this.setupLights();
    this.setupRenderer();
    
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Sky blue
  }

  setupCamera() {
    const aspect = this.width / this.height;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    
    // Position camera for isometric-like view
    this.camera.position.set(50, -50, 40);
    this.camera.lookAt(32, 32, 0);
    
    // Add orbit controls
    this.controls = new THREE.OrbitControls(
      this.camera, 
      this.container
    );
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
  }

  setupLights() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);
    
    // Directional light (sun)
    const sunlight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunlight.position.set(50, 50, 100);
    sunlight.castShadow = true;
    
    // Adjust shadow properties
    sunlight.shadow.mapSize.width = 2048;
    sunlight.shadow.mapSize.height = 2048;
    sunlight.shadow.camera.near = 0.5;
    sunlight.shadow.camera.far = 500;
    
    this.scene.add(sunlight);
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true 
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    this.container.appendChild(this.renderer.domElement);
  }

  animate() {
    requestAnimationFrame(this.animate);
    
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  // Handle window resize
  onResize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(this.width, this.height);
  }

  getScene() {
    return this.scene;
  }
}