import * as THREE from 'three'
import vertexShader from '@scripts/shaders/post.vert'
import fragmentShader from '@scripts/shaders/post.frag'
import mainVertexShader from '@scripts/shaders/main.vert'
import mainFragmentShader from '@scripts/shaders/main.frag'
import GUI from 'lil-gui'

// TODO: コード整理
export class Canvas {
  screen: {
    width: number
    height: number
    aspect: number
  }
  params: {
    uVelocitySpeed: number
    uVelocityAttenuation: number
    uDistanceScale: number
    uHeightAttenuation: number
  }
  previousTime: number
  timeScale: number
  uTime: number
  uMouse: [number, number]
  uPress: boolean
  renderer: THREE.WebGLRenderer
  offscreenRenderTarget: THREE.WebGLRenderTarget<THREE.Texture>
  offscreenCamera: THREE.PerspectiveCamera
  offscreenScene: THREE.Scene
  offscreenMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.RawShaderMaterial>
  offscreenRenderTarget2: THREE.WebGLRenderTarget<THREE.Texture>
  camera: THREE.PerspectiveCamera
  scene: THREE.Scene
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.RawShaderMaterial>
  gui: GUI
  bufferIndex: number
  buffers: THREE.WebGLRenderTarget<THREE.Texture>[]
  constructor({ canvas }: { canvas: HTMLCanvasElement }) {
    this.screen = this.getScreenSize()
    this.params = {
      uVelocitySpeed: 0.5, // 加速度係数
      uVelocityAttenuation: 0.9, // 加速度減衰
      uDistanceScale: 50.0, // カーソルとの距離係数
      uHeightAttenuation: 0.99, // 高さの減衰
    }
    this.previousTime = 0 // 直前のフレームのタイムスタンプ
    this.timeScale = 1.0 // 時間の進み方に対するスケール
    this.uTime = 0.0 // uniform 変数 time 用
    this.uMouse = [0.0, 0.0] // uniform 変数 mouse 用
    this.uPress = false

    this.renderer = this.createRenderer(canvas)

    // offscreen
    this.offscreenRenderTarget = this.createRenderTarget()
    this.offscreenCamera = this.createCamera()
    this.offscreenScene = this.createScene()
    this.offscreenMesh = this.createOffscreenMesh()

    this.offscreenRenderTarget2 = this.createRenderTarget()

    // post
    this.camera = this.createCamera()
    this.scene = this.createScene()
    this.mesh = this.createMesh()
    this.gui = this.createDebug()

    this.bufferIndex = 0
    this.buffers = [this.offscreenRenderTarget, this.offscreenRenderTarget2]

    this.setup()
  }
  /**
   * setup
   */
  setup() {
    this.attachEvents()
    this.renderer.setAnimationLoop(this.update.bind(this))
  }
  /**
   * dispose
   */
  dispose() {
    this.detachEvents()
  }
  /**
   * attachEvents
   */
  attachEvents() {
    window.addEventListener('resize', this.onResize.bind(this), false)
    window.addEventListener('pointerdown', this.onPointerdown.bind(this), false)
    window.addEventListener('pointermove', this.onPointermove.bind(this), false)
    window.addEventListener('pointerup', this.onPointerup.bind(this), false)
  }
  /**
   * detachEvents
   */
  detachEvents() {
    window.removeEventListener('resize', this.onResize, false)
    window.removeEventListener('pointerdown', this.onPointerdown, false)
    window.removeEventListener('pointermove', this.onPointermove, false)
    window.removeEventListener('pointerup', this.onPointerup, false)
  }
  /**
   * getScreenSize
   */
  getScreenSize() {
    const { innerWidth: width, innerHeight: height } = window
    return { width, height, aspect: width / height }
  }
  /**
   * createRenderer
   */
  createRenderer(canvas: HTMLCanvasElement) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(this.screen.width, this.screen.height)
    renderer.setClearColor(new THREE.Color(0x000000))
    return renderer
  }
  /**
   * createCamera
   */
  createCamera() {
    const camera = new THREE.PerspectiveCamera(50, this.screen.aspect, 0.01, 100.0)
    camera.position.z = 5
    return camera
  }
  /**
   * createScene
   */
  createScene() {
    const scene = new THREE.Scene()
    return scene
  }
  /**
   * createMesh
   */
  createMesh() {
    const geometry = new THREE.PlaneGeometry(2, 2)
    const material = new THREE.RawShaderMaterial({
      uniforms: {
        uTexture: { value: this.offscreenRenderTarget.texture },
      },
      vertexShader,
      fragmentShader,
    })
    const mesh = new THREE.Mesh(geometry, material)
    this.scene.add(mesh)

    return mesh
  }
  /**
   * createOffscreenMesh
   */
  createOffscreenMesh() {
    const geometry = new THREE.PlaneGeometry(2, 2)
    const material = new THREE.RawShaderMaterial({
      uniforms: {
        uTexture: { value: null },
        resolution: { value: [this.screen.width, this.screen.height] },
        mouse: { value: this.uMouse },
        press: { value: this.uMouse },
        velocitySpeed: { value: this.params.uVelocitySpeed },
        velocityAttenuation: { value: this.params.uVelocityAttenuation },
        distanceScale: { value: this.params.uDistanceScale },
        heightAttenuation: { value: this.params.uHeightAttenuation },
      },
      vertexShader: mainVertexShader,
      fragmentShader: mainFragmentShader,
    })
    const mesh = new THREE.Mesh(geometry, material)
    this.offscreenScene.add(mesh)

    return mesh
  }
  /**
   * createRenderTarget
   */
  createRenderTarget() {
    const renderTarget = new THREE.WebGLRenderTarget(this.screen.width, this.screen.height, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      type: THREE.FloatType,
    })
    return renderTarget
  }
  /**
   * createDebug
   */
  createDebug() {
    const gui = new GUI()
    gui
      .add(this.params, 'uVelocitySpeed', 0.0, 0.5)
      .name('velocity-speed')
      .step(0.01)
      .onChange(() => {
        this.offscreenMesh.material.uniforms.velocitySpeed.value = this.params.uVelocitySpeed
      })
    gui
      .add(this.params, 'uVelocityAttenuation', 0.5, 1.0)
      .name('velocity-attenuation')
      .step(0.01)
      .onChange(() => {
        this.offscreenMesh.material.uniforms.velocityAttenuation.value = this.params.uVelocityAttenuation
      })
    gui
      .add(this.params, 'uDistanceScale', 1.0, 100.0)
      .name('distance-scale')
      .step(1.0)
      .onChange(() => {
        this.offscreenMesh.material.uniforms.distanceScale.value = this.params.uDistanceScale
      })
    gui
      .add(this.params, 'uHeightAttenuation', 0.9, 1.0)
      .name('height-attenuation')
      .step(0.01)
      .onChange(() => {
        this.offscreenMesh.material.uniforms.heightAttenuation.value = this.params.uHeightAttenuation
      })

    return gui
  }
  /**
   * resize
   */
  resize() {
    this.screen = this.getScreenSize()
    this.offscreenMesh.material.uniforms.resolution.value = [this.screen.width, this.screen.height]
    this.renderer.setSize(this.screen.width, this.screen.height)
    this.offscreenRenderTarget.setSize(this.screen.width, this.screen.height)
    this.offscreenRenderTarget2.setSize(this.screen.width, this.screen.height)
    this.camera.aspect = this.screen.aspect
    this.camera.updateProjectionMatrix()
  }
  /**
   * onResize
   */
  onResize() {
    this.resize()
  }
  /**
   * onPointerdown
   */
  onPointerdown() {
    this.uPress = true
    this.offscreenMesh.material.uniforms.press.value = this.uPress
  }
  /**
   * onPointermove
   */
  onPointermove(event: PointerEvent) {
    const x = (event.clientX / this.screen.width) * 2.0 - 1.0 // -1.0 ~ 1.0
    const y = (event.clientY / this.screen.height) * 2.0 - 1.0 // -1.0 ~ 1.0
    this.uMouse[0] = x
    this.uMouse[1] = -y

    this.offscreenMesh.material.uniforms.mouse.value = this.uMouse
  }
  /**
   * onPointerup
   */
  onPointerup() {
    this.uPress = false
    this.offscreenMesh.material.uniforms.press.value = this.uPress
  }
  /**
   * renderMain
   */
  renderMain() {
    const current = this.buffers[this.bufferIndex]
    const other = this.buffers[1 - this.bufferIndex]

    this.bufferIndex = 1 - this.bufferIndex

    this.renderer.setRenderTarget(current)
    this.offscreenMesh.material.uniforms.uTexture.value = other.texture
    // this.renderer.clear()
    this.renderer.render(this.offscreenScene, this.offscreenCamera)
  }
  /**
   * renderPost
   */
  renderPost() {
    const texture = this.buffers[this.bufferIndex].texture
    this.renderer.setRenderTarget(null)
    this.mesh.material.uniforms.uTexture.value = texture
    // this.renderer.clear()
    this.renderer.render(this.scene, this.camera)
  }
  /**
   * render
   */
  render() {
    this.renderMain()
    this.renderPost()
  }
  /**
   * update
   */
  update() {
    this.render()
  }
}
