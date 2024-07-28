class Material {
  constructor(props) {
    this.c = props.c;
    this.emissive = props.emissive || 0;
    //this.path = props.path;

    this.strength = props.strength || 0.01;
    
    /*if (this.path) {
      let sprite = new THREE.TextureLoader().load(`assets/blocks/${this.path}.png`);
      sprite.magFilter = THREE.NearestFilter;
      sprite.minFilter = THREE.NearestFilter; 
      sprite.wrapS = THREE.RepeatWrapping;
      sprite.wrapT = THREE.RepeatWrapping;

      this.THREEMaterial = new THREE.MeshStandardMaterial( { map: sprite, wireframe: false} );
    } else */
    if (this.c) {
      this.THREEMaterial = new THREE.MeshStandardMaterial( { color: this.c, wireframe: false, emissive: this.emissive} );
      this.THREEMaterial.onBeforeCompile = function(info) {
        info.vertexShader = THREEShaders.noise.vertex;
        info.fragmentShader = THREEShaders.noise.fragment;
      }
    }
  }
}