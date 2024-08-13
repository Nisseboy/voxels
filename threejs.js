let THREE;
let THREEscene;
let THREErenderer;
let THREEcaster;
let THREEShaders = {};
let camera;

async function THREEMain() {
  THREE = await import("three");

  THREEscene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 90, 16 / 9, 0.00001, 1000 );
  camera.rotation.order = 'YXZ'

  const light = new THREE.AmbientLight( 0xffffff, 1 );
  THREEscene.add( light );

  //This is needed for the noise shader for some reason, fuck
  const pointLight = new THREE.PointLight( 0xffffff, 600 );
  pointLight.castShadow = true;
  pointLight.shadow.mapSize.set(8192, 8192);
  pointLight.position.set(-10, 10, -10);
  THREEscene.add( pointLight );

  THREErenderer = new THREE.WebGLRenderer();
  THREErenderer.shadowMap.enabled = true;
  THREErenderer.shadowMap.type = THREE.PCFSoftShadowMap;

  resize();
  window.addEventListener("resize", resize);
  function resize() {
    let w = Math.min(window.innerWidth, window.innerHeight / 9 * 16);
    THREErenderer.setSize( w, w / 16 * 9 );
  }
  
  document.body.appendChild( THREErenderer.domElement );


  THREEcaster = new THREE.Raycaster();
  THREEcaster.layers.set(1);

  THREEShaders = {
    noise: {vertex: await loadFile("shaders/noise-vertex.glsl"), fragment: await loadFile("shaders/noise-fragment.glsl")},
    raytracing: {vertex: await loadFile("shaders/raytracing-vertex.glsl"), fragment: await loadFile("shaders/raytracing-fragment.glsl")},
  };
  

  function animate() {
    update();

    if (scene.renderWorld) {
      THREErenderer.render( THREEscene, camera );
    }
  }
  await start();
  THREErenderer.setAnimationLoop( animate );
}

THREEMain();

async function loadFile(fileName) {
  let loader = new THREE.FileLoader();
  let res = await loader.loadAsync(fileName);
  return res;
}

async function loadVOX(path) {
  let data = (await(await fetch(path)).arrayBuffer());
  return parseVox(data);
}