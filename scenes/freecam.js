let casterOutside;
let casterInside;
let casterHit;
let casterInfo;
let casterOutline;

class FreeCam {
  constructor() {
    this.renderWorld = true;
  }

  start() {
    let geometry = new THREE.BoxGeometry(1 / 16, 1 / 16, 1 / 16);
    let material = new THREE.MeshPhongMaterial({color: 0xffffff, wireframe: true});
    let mesh = new THREE.Mesh(geometry, material);
    THREEscene.add(mesh);
    casterOutline = mesh;
  }
  keyPressed(e) {
    if (getKeyPressed("Debug Mode")) {
      function f(world) {
        world.materials.forEach(e=>e.THREEMaterial.wireframe = debug);
        world.entities.forEach(e=>f(e.world));
      }
      
      f(world);
    }
  }
  mouseMoved(e) {
    camera.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), e.movementX / window.innerWidth * -5);
    camera.rotateOnAxis(new THREE.Vector3(1, 0, 0), e.movementY / window.innerWidth * -5);
  }
  mousePressed(e) {
    THREErenderer.domElement.requestPointerLock();

    if (casterHit?.hit && casterInfo.distance < 4/16) {
      if (e.button == 0) world.setNode(casterInside, 0);
      if (e.button == 2) world.setNode(casterOutside, 4);
    };
  }
  update() { 
    let camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);

    let movement = new THREE.Vector3(pressed[68] - pressed[65], pressed[32] - pressed[67], pressed[83] - pressed[87]).divideScalar(fps).applyAxisAngle(new THREE.Vector3(0, 1, 0).normalize(), camera.rotation.y);
    camera.position.add(movement);
    casterOutline.position.set(0, 0, 0);

    for (let i of [world]) {
      i.voxelDataObject.position.copy(camera.position).add(camDir.clone().multiplyScalar(0.1));
      i.voxelDataObject.rotation.copy(camera.rotation);
    }
    
    THREEcaster.setFromCamera( new THREE.Vector2(0, 0), camera );
    let intersects = THREEcaster.intersectObjects( THREEscene.children );
    let hit = intersects[0];
    if (hit) {
      casterOutside = hit.point.clone().sub(camera.position).divideScalar(hit.distance).multiplyScalar(hit.distance - 0.0001).add(camera.position);
      casterInside = hit.point.clone().sub(camera.position).divideScalar(hit.distance).multiplyScalar(hit.distance + 0.0001).add(camera.position);
      casterHit = world.getNode(casterInside);
      casterInfo = hit;

      if (casterHit.hit && casterInfo.distance < 4/16) {
        casterOutline.position.copy(casterInside).multiplyScalar(16).floor().divideScalar(16).addScalar(1 / 32).sub(camera.position);
        let len = casterOutline.position.length();
        casterOutline.position.divideScalar(len).multiplyScalar(len - 0.0012).add(camera.position);
      }
    } 

    world.update();
  }
  stop() {

  }
};

