let entityTypes = {
  world: {
    size: [1, 1, 1],
  },
  dragon: {
    voxPath: "assets/dragon.vox",
    vox: undefined,
  },
};

class Entity {
  constructor(typeName, pos) {
    this.type = entityTypes[typeName];
    this.typeName = typeName;

    this.pos = pos.clone();
    this.vel = new THREE.Vector3(0, 0, 0);

    if (typeName == "world") {
      this.world = new World(new THREE.Vector3(...this.type.size), 0.2);
      this.world.generateWorld("cube");
    } else {
      let size = this.type.vox.body.children[0].content;
      this.world = new World(new THREE.Vector3(Math.ceil(size.x / 16), Math.ceil(size.z / 16), Math.ceil(size.y / 16)), 0.2);
      this.world.loadVox(this.type.vox);
    }

  }

  update() {
    this.world.THREEGroup.position.copy(this.pos);
    this.world.update();
  }
}