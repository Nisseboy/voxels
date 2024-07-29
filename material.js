class Material {
  constructor(props, scale) {
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
        info.uniforms.scale = {value: 1 / scale}

        
       /*
        info.vertexShader = info.vertexShader
          .replace("#ifdef USE_TRANSMISSION\n\tvarying vec3 vWorldPosition;\n#endif", "varying vec3 vWorldPosition;")
          .replace("#ifdef USE_TRANSMISSION\n\tvWorldPosition = worldPosition.xyz;\n#endif", "vWorldPosition = worldPosition.xyz;");

        info.fragmentShader = info.fragmentShader
          .replace("varying vec3 vViewPosition;", "varying vec3 vViewPosition;varying vec3 vWorldPosition;")
          .replace("void main() {", "float rand(vec3 co){return fract(sin(dot(co, vec3(12.9898, 78.233, 45.723))) * 43758.5453);}void main() {")
          .replace("vec4 diffuseColor = vec4( diffuse, opacity );", `vec4 diffuseColor = vec4( diffuse * (1.0 + floor(rand(floor(vWorldPosition * 16.0 * ${1/(scale+0.00000000001)} + 0.0001) / 16.0) * 4.0) / 4.0 / 4.0), opacity );`);
       */ 
      }
    }
  }
}