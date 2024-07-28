let chunkSize = 16;
let invChunkSize = 1 / chunkSize;
let defaultPlaceDepth = Math.log2(chunkSize);

class World {
  constructor() {
    this.size = new THREE.Vector3(5, 1, 5);
    
    /*
    0: is regular node?
    0000000000000000000
    000000000000 color

    if it's a leaf node with all zeroes it's air.
    */

    let startTime = performance.now();

    this.chunks = new Array(this.size.x * this.size.y * this.size.z).fill(undefined).map(e => {return {data: [0], THREEObjects: [], dirty: true}});

    let mode = "terrain";
    if (mode == "terrain" || mode == "cube" || mode == "block") {
      for (let x = 0; x < this.size.x; x+=invChunkSize) {
        for (let y = 0; y < this.size.y; y+=invChunkSize) {
          for (let z = 0; z < this.size.z; z+=invChunkSize) {
            if (mode == "terrain" && (y < 0.5 + noise.perlin2(x / 2, z / 2) / 2)) this.setNode(new THREE.Vector3(x, y, z), defaultPlaceDepth + 1);
            if (mode == "cube" && (x == 0 || x == this.size.x - invChunkSize || y == 0 || y == this.size.y - invChunkSize || z == 0 || z == this.size.z - invChunkSize)) this.setNode(new THREE.Vector3(x, y, z), 1);
            if (mode == "block" && (x < invChunkSize * 4 && y < invChunkSize * 4 && z > this.size.z - invChunkSize * 5)) this.setNode(new THREE.Vector3(x, y, z), 1);
          }
        }
      }
    } else if (mode == "cave") {
      camera.position.set(5, 2, 5);
      
      for (let i of this.chunks) i.data = [1];
      let start = this.size.clone().divideScalar(2);

      for (let x = 0; x < this.size.x; x+=invChunkSize) {
        for (let y = 0; y < this.size.y; y+=invChunkSize) {
          for (let z = 0; z < this.size.z; z+=invChunkSize) {
            if (
              Math.floor(x) == start.x && Math.floor(y) == start.y && Math.floor(z) == start.z &&
              y - start.y < 0.5
            ) {
              if ((x - start.x - 0.5) ** 2 + (z - start.z - 0.5) ** 2 < 0.5 ** 2)
                this.setNode(new THREE.Vector3(x, y, z), 0);
              if (y == start.y) 
                this.setNode(new THREE.Vector3(x, y, z), 2);
            }
            
            if (x == 0 || x == this.size.x - invChunkSize || y == 0 || y == this.size.y - invChunkSize || z == 0 || z == this.size.z - invChunkSize) this.setNode(new THREE.Vector3(x, y, z), 3);
          }
        }
      }

      this.explosion(start.clone().add(new THREE.Vector3(0.5, 0.25, 0.5)), {power: 10000, maxR: 2, silent: true});
    }
    
    console.log(`Chunks initialized in ${performance.now() - startTime} ms`);
  }

  update() {
    this.updateTHREEObjects();
  }

  updateTHREEObjects() {
    let start = performance.now();
    let n = 0;

    let dirtyChunks = [];
    for (let x = 0; x < this.size.x; x++) {
      for (let y = 0; y < this.size.y; y++) {
        for (let z = 0; z < this.size.z; z++) {
          let c = this.getChunk({x, y, z});
          if (!c.dirty) continue;
          c.dirty = false;

          for (let X = -1; X < 2; X++) {
            for (let Y = -1; Y < 2; Y++) {
              for (let Z = -1; Z < 2; Z++) {
                if (x + X < 0 || y + Y < 0 || z + Z < 0 || x + X >= this.size.x || y + Y >= this.size.y || z + Z >= this.size.z) continue;
                
                let c = this.getChunk({x: x + X, y: y + Y, z: z + Z});
                if (dirtyChunks.includes(c)) continue;
                dirtyChunks.push(c);
              }
            }
          }
        }
      }
    }

    for (let i of dirtyChunks) {
      if (i.dirty) this.squishChunk(i);
      
      this.addTHREEObjects(i);

      n++;
    }

    let time = performance.now() - start;
    if (n) console.log(`${n} chunks updated in ${time} ms, avg: ${time / n} ms`);
  }
  addTHREEObjects(chunk) {
    this.removeTHREEObjects(chunk);

    let chunkIndex = this.chunks.indexOf(chunk);

    let basePos = new THREE.Vector3(
      Math.floor(chunkIndex % this.size.x), 
      Math.floor((chunkIndex / this.size.x) % this.size.y), 
      Math.floor(chunkIndex / (this.size.x * this.size.y))
    );

    let offsets = [
      new THREE.Vector3(invChunkSize / 2, 0, 0),
      new THREE.Vector3(-invChunkSize / 2, 0, 0),
      new THREE.Vector3(0, invChunkSize / 2, 0),
      new THREE.Vector3(0, -invChunkSize / 2, 0),
      new THREE.Vector3(0, 0, invChunkSize / 2),
      new THREE.Vector3(0, 0, -invChunkSize / 2),
    ];
    let offsetsRight = [
      new THREE.Vector3(0, 0, invChunkSize / 2),
      new THREE.Vector3(0, 0, -invChunkSize / 2),
      new THREE.Vector3(invChunkSize / 2, 0, 0),
      new THREE.Vector3(-invChunkSize / 2, 0, 0),
      new THREE.Vector3(-invChunkSize / 2, 0, 0),
      new THREE.Vector3(invChunkSize / 2, 0, 0),
    ];
    
    let rawData = new Array(materials.length * (chunkSize + 2) * (chunkSize + 2) ).fill(0);
    let seenMaterials = [];

    let empty = true;
    let stack = [[0, 0, new THREE.Vector3(0, 0, 0)]];
    while (stack.length > 0) {
      let stackValue = stack.shift() || [0];

      let node = chunk.data[stackValue[0]];
      let data = node & 0b01111111111111111111111111111111;

      let scale = stackValue[1];

      let pos = stackValue[2];

      if (node & 0b10000000000000000000000000000000) {
        let invScale = 1 / (2 ** (scale + 1));
        for (let i = 0; i < 8; i++) {
          stack.push([data + i, scale + 1, pos.clone().add(new THREE.Vector3(
            (i & 1) == 0 ? 0 : invScale,
            (i & 2) == 0 ? 0 : invScale,
            (i & 4) == 0 ? 0 : invScale,
          ))]);
        }
      } else {
        if (data) empty = false;
        
        let steps = chunkSize / (2 ** scale);
        for (let x = 0; x < steps; x++) {
          for (let y = 0; y < steps; y++) {
            for (let z = 0; z < steps; z++) {
              let X = (pos.x) * chunkSize + x + 1;
              let Y = (pos.y) * chunkSize + y + 1;
              let Z = (pos.z) * chunkSize + z + 1;

              rawData[X * (chunkSize + 2) + Y] |= ((node ? 1 : 0) << Z);
              rawData[data * (chunkSize + 2) * (chunkSize + 2) + X * (chunkSize + 2) + Y] |= ((node ? 1 : 0) << Z);
              seenMaterials[data] = true;

              if (materials[data].emissive) {
                let light = new THREE.PointLight(materials[data].emissive);
                
                light.position.set(basePos.x + pos.x + x * invChunkSize, basePos.y + pos.y + y * invChunkSize, basePos.z + pos.z + z * invChunkSize).addScalar(invChunkSize / 2);
                THREEscene.add(light);
                chunk.THREEObjects.push(light);
              }
            }
          }
        }
      }
    }

    if (!empty)
    for (let x = 0; x < chunkSize + 2; x++) {
      for (let y = 0; y < chunkSize + 2; y++) {
        for (let z = 0; z < chunkSize + 2; z++) {
          if (
            x == 0 || x == chunkSize + 1 || 
            y == 0 || y == chunkSize + 1 || 
            z == 0 || z == chunkSize + 1
          ) {
            let hit = this.getNode(basePos.clone().add(new THREE.Vector3((x - 1) / chunkSize, (y - 1) / chunkSize, (z - 1) / chunkSize)));
            rawData[x * (chunkSize + 2) + y] |= ((hit.node ? 1 : 0) << z);
            rawData[(hit.node & 0b01111111111111111111111111111111) * (chunkSize + 2) * (chunkSize + 2) + x * (chunkSize + 2) + y] |= ((hit.node ? 1 : 0) << z);
            seenMaterials[hit.node & 0b01111111111111111111111111111111] = true;

          }
        }
      }
    }

    for (let face = 0; face < 6; face++) {
      let offset = offsets[face];
      let offsetRight = offsetsRight[face];
      let offsetUp = offset.clone().cross(offsetRight);
      offsetUp.divideScalar(offsetUp.length() / (-invChunkSize / 2));
      
      let facedData = new Array(materials.length * (chunkSize + 2) * (chunkSize + 2) ).fill(0);

      for (let mat = 0; mat < materials.length; mat++) {
        if (!seenMaterials[mat]) continue;
        for (let x = 0; x < chunkSize + 2; x++) {
          for (let y = 0; y < chunkSize + 2; y++) {
            for (let z = 0; z < chunkSize + 2; z++) {
              let X=0, Y=0, Z=0;

              if (face == 0) {X = z, Y = y, Z = x}
              if (face == 1) {X = (chunkSize + 1 - z), Y = y, Z = x}
              if (face == 2) {X = x, Y = z, Z = y}
              if (face == 3) {X = x, Y = (chunkSize + 1 - z), Z = y}
              if (face == 4) {X = x, Y = y, Z = z}
              if (face == 5) {X = x, Y = y, Z = (chunkSize + 1 - z)}
              
              let hit = (rawData[mat * (chunkSize + 2) * (chunkSize + 2) + X * (chunkSize + 2) + Y] & (1 << Z)) >> Z;
              
              facedData[mat * (chunkSize + 2) * (chunkSize + 2) + x * (chunkSize + 2) + y] |= (hit << z);
            }

            facedData[mat * (chunkSize + 2) * (chunkSize + 2) + x * (chunkSize + 2) + y] = facedData[mat * (chunkSize + 2) * (chunkSize + 2) + x * (chunkSize + 2) + y] & (facedData[x * (chunkSize + 2) + y] & (~(facedData[x * (chunkSize + 2) + y] >> 1)));
          }
        }
      }

      for (let mat = 1; mat < materials.length; mat++) {
        if (!seenMaterials[mat]) continue;
        
        let geometry = new THREE.BufferGeometry();
        let vertices = new Array();
        let uvs = new Array();
        let indices = new Array();
        let ii = 0;

        for (let x = 1; x < chunkSize + 1; x++) {
          for (let y = 1; y < chunkSize + 1; y++) {
            for (let z = 1; z < chunkSize + 1; z++) {

              let X=0, Y=0, Z=0;
              if (face == 0) {Z = x, Y = y, X = z}
              if (face == 1) {Z = (chunkSize + 1 - x), Y = y, X = z}
              if (face == 2) {X = x, Z = y, Y = z}
              if (face == 3) {X = x, Z = (chunkSize + 1 - y), Y = z}
              if (face == 4) {X = x, Y = y, Z = z}
              if (face == 5) {X = x, Y = y, Z = (chunkSize + 1 - z)}

              let w = 1, h = 1;
              let stage = 0;

              do {
                let stop = false;
                for (let i = 0; i < h; i++) {
                  if (
                    Y + h > chunkSize + 1 ||
                    X + w > chunkSize + 1 || 
                    (facedData[mat * (chunkSize + 2) * (chunkSize + 2) + (X+w - 1) * (chunkSize + 2) + (Y+i)] & (1 << Z)) == 0 
                    
                  ) stop = true;
                }

                if (stage == 0) {
                  if (stop) {
                    h--;
                    stage++;
                    if (h == 0) {stage = 100; continue;}
                    
                    stop = false;
                  } else {
                    h++;
                  }
                }

                if (stage == 1) {
                  if (stop) {
                    w--;
                    stage++;
                  } else {
                    for (let i = 0; i < h; i++) {
                      facedData[mat * (chunkSize + 2) * (chunkSize + 2) + (X+w - 1) * (chunkSize + 2) + (Y+i)] &= ~(1 << Z);
                    }
                    w++;
                  }
                }

              } while (stage < 2);

              if (stage == 100) continue;

              let middle = new THREE.Vector3(x * invChunkSize + offset.x, y * invChunkSize + offset.y, z * invChunkSize + offset.z);
              
              //Why does it have to be like this i hate it
              if (face == 0 || face == 2 || face == 5) {
                vertices[ii+0] = middle.x - offsetRight.x + offsetUp.x * (h - 0.5) * 2;
                vertices[ii+1] = middle.y - offsetRight.y + offsetUp.y * (h - 0.5) * 2;
                vertices[ii+2] = middle.z - offsetRight.z + offsetUp.z * (h - 0.5) * 2;
  
                vertices[ii+3] = middle.x + offsetRight.x * (w - 0.5) * 2 + offsetUp.x * (h - 0.5) * 2;
                vertices[ii+4] = middle.y + offsetRight.y * (w - 0.5) * 2 + offsetUp.y * (h - 0.5) * 2;
                vertices[ii+5] = middle.z + offsetRight.z * (w - 0.5) * 2  + offsetUp.z * (h - 0.5) * 2;
  
                vertices[ii+6] = middle.x + offsetRight.x * (w - 0.5) * 2 - offsetUp.x;
                vertices[ii+7] = middle.y + offsetRight.y * (w - 0.5) * 2 - offsetUp.y;
                vertices[ii+8] = middle.z + offsetRight.z * (w - 0.5) * 2 - offsetUp.z;
  
                vertices[ii+9] = middle.x - offsetRight.x - offsetUp.x;
                vertices[ii+10] = middle.y - offsetRight.y - offsetUp.y;
                vertices[ii+11] = middle.z - offsetRight.z - offsetUp.z;
              } else {
                vertices[ii+0] = middle.x - offsetRight.x * (w - 0.5) * 2 + offsetUp.x * (h - 0.5) * 2;
                vertices[ii+1] = middle.y - offsetRight.y * (w - 0.5) * 2 + offsetUp.y * (h - 0.5) * 2;
                vertices[ii+2] = middle.z - offsetRight.z * (w - 0.5) * 2 + offsetUp.z * (h - 0.5) * 2;
  
                vertices[ii+3] = middle.x + offsetRight.x + offsetUp.x * (h - 0.5) * 2;
                vertices[ii+4] = middle.y + offsetRight.y + offsetUp.y * (h - 0.5) * 2;
                vertices[ii+5] = middle.z + offsetRight.z  + offsetUp.z * (h - 0.5) * 2;
  
                vertices[ii+6] = middle.x + offsetRight.x - offsetUp.x;
                vertices[ii+7] = middle.y + offsetRight.y - offsetUp.y;
                vertices[ii+8] = middle.z + offsetRight.z - offsetUp.z;
  
                vertices[ii+9] = middle.x - offsetRight.x * (w - 0.5) * 2 - offsetUp.x;
                vertices[ii+10] = middle.y - offsetRight.y * (w - 0.5) * 2 - offsetUp.y;
                vertices[ii+11] = middle.z - offsetRight.z * (w - 0.5) * 2 - offsetUp.z;
              }

              indices[ii / 2    ] = ii / 3 + 0;
              indices[ii / 2 + 1] = ii / 3 + 1;
              indices[ii / 2 + 2] = ii / 3 + 2;
              indices[ii / 2 + 3] = ii / 3 + 2;
              indices[ii / 2 + 4] = ii / 3 + 3;
              indices[ii / 2 + 5] = ii / 3 + 0;

              uvs[ii / 3 * 2    ] = w; 
              uvs[ii / 3 * 2 + 1] = h; 
              uvs[ii / 3 * 2 + 2] = 0; 
              uvs[ii / 3 * 2 + 3] = h; 
              uvs[ii / 3 * 2 + 4] = 0; 
              uvs[ii / 3 * 2 + 5] = 0; 
              uvs[ii / 3 * 2 + 6] = w; 
              uvs[ii / 3 * 2 + 7] = 0; 

              ii += 12;
            }
          }
        }

        if (vertices.length == 0) continue;
        
        geometry.setIndex( indices );
        geometry.setAttribute( 'position', new THREE.BufferAttribute( Float32Array.from(vertices), 3 ) );
        geometry.setAttribute( 'uv', new THREE.BufferAttribute( Float32Array.from(uvs), 2 ) );
        geometry.toNonIndexed();
        geometry.computeVertexNormals();

        const mesh = new THREE.Mesh( geometry, materials[mat].THREEMaterial );
        mesh.position.copy(basePos).subScalar(invChunkSize / 2);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.layers.enable(1);
    
        THREEscene.add(mesh);
        chunk.THREEObjects.push(mesh);
      }
    }
  }

  removeTHREEObjects(chunk) {
    for (let o of chunk.THREEObjects) {THREEscene.remove(o); if (o.dispose) o.dispose()}
    chunk.THREEObjects.length = [];
  }

  getChunk(pos) {
    return this.chunks[Math.floor(pos.x) + Math.floor(pos.y) * this.size.x + Math.floor(pos.z) * this.size.x * this.size.y];
  }

  pushNode(chunk, node) {
    chunk.data[chunk.data.length] = node;
  }
  
  setNode(pos, node, scale = defaultPlaceDepth) {
    if (pos.x < 0 || pos.y < 0 || pos.z < 0 || pos.x >= this.size.x || pos.y >= this.size.y || pos.z >= this.size.z) return;

    while (true) {
      let hit = this.getNode(pos);
      
      if (hit.scale >= scale) {
        hit.chunk.data[hit.index] = node;
      
        this.markDirty(hit.chunk);

        outer: while (hit.parents.length != 0) {
          let parent = hit.parents.pop();
          if (!parent) continue;

          let index = hit.chunk.data[parent] & 0b01111111111111111111111111111111;

          let val = hit.chunk.data[index];
          for (let i = 1; i < 8; i++) {
            if (hit.chunk.data[index + i] != val) break outer;
          }

          hit.chunk.data[parent] = node;
        }

        return;
      } else {
        this.splitNode(pos);
      }
    }
  }
  
  splitNode(pos) {
    let hit = this.getNode(pos);

    let val = hit.chunk.data[hit.index];
    if (val & 0b10000000000000000000000000000000) return;  //not a leaf node

    let data = val;

    let newIndex = hit.chunk.data.length;
    hit.chunk.data[hit.index] = 0b10000000000000000000000000000000 | newIndex;

    for (let i = 0; i < 8; i++) {
      this.pushNode(hit.chunk, data);
    }

    this.markDirty(hit.chunk);
  }

  getNode(pos, maxScale) {
    let p = pos.clone()
    
    let chunk = this.getChunk(p);
    if (!chunk) return {chunk: this.chunks[0], index: 0, node: 0, scale: 0, parents: [], hit: false, pos};
    
    let index = 0;
    let P = new THREE.Vector3(Math.floor(p.x) + 0.5, Math.floor(p.y) + 0.5, Math.floor(p.z) + 0.5);
    
    let parents = [];

    for (let depth = 0; depth <= 10; depth++) {
      let node = chunk.data[index];
      if (depth == maxScale || (node & 0b10000000000000000000000000000000) == 0) return {chunk: chunk, index: index, node: node, scale: depth, parents: parents, hit: true, pos};
      
      parents.push(index);

      let inverseScaleFactor = 1 / (2 ** (depth + 1));
      let newIndex = node & 0b01111111111111111111111111111111;
      
      let lX = p.x >= P.x;
      let lY = p.y >= P.y;
      let lZ = p.z >= P.z;
      
      index = newIndex + (lX? 1:0) + (lY? 2:0) + (lZ? 4:0);
      P.add(new THREE.Vector3(
        (lX ? 0.5 : -0.5) * inverseScaleFactor,
        (lY ? 0.5 : -0.5) * inverseScaleFactor,
        (lZ ? 0.5 : -0.5) * inverseScaleFactor
      ));
    }

    return {chunk: this.chunks[0], index: 0, node: 0, scale: 0, parents: [], hit: false, pos};
  }

  squishChunk(chunk) {
    let n = [chunk.data[0]];


    function f(index) {
      let node = n[index];
      let data = node & 0b01111111111111111111111111111111;
      
      if (node & 0b10000000000000000000000000000000) {
        let newIndex = n.length;
        n[index] = 0b10000000000000000000000000000000 | newIndex;

        for (let i = 0; i < 8; i++) {
          n[newIndex + i] = chunk.data[data + i];
        };
        for (let i = 0; i < 8; i++) {
          f(newIndex + i);
        };
      }
    }
    
    f(0);

    chunk.data = n;
  }

  markDirty(chunk) {
    chunk.dirty = true;
  }

  explosion(pos, props) {
    let maxR = props.maxR;
    let power = props.power;
    let silent = props.silent;

    let ray = new THREE.Raycaster();
    ray.layers.set(1);

    //Fibonacci Sphere: https://stackoverflow.com/questions/60578028/how-can-i-achieve-an-even-distribution-of-sprites-across-the-surface-of-a-sphere
    const rnd = 1;
    const offset = 2 / power;
    const increment = Math.PI * (3 - Math.sqrt(5));

    let phi, r;
    let dir = new THREE.Vector3();

    for (let i = 0; i < power; i++) {
      dir.y = ((i * offset) - 1) + (offset / 2);
      r = Math.sqrt(1 - Math.pow(dir.y, 2));
    
      phi = (i + rnd) % power * increment;
    
      dir.x = Math.cos(phi) * r;
      dir.z = Math.sin(phi) * r;

      let hit = this.cheapRayCast(pos, dir);
      if (!hit || hit.distance > maxR || materials[hit.node & 0b01111111111111111111111111111111].strength > Math.random()) continue;

      this.setNode(hit.pos, 0);
    }
  }

  cheapRayCast(pos_, dir_) {
    let epsilon = 1 / 64;

    let pos = pos_.clone();
    let dir = dir_.clone().normalize().multiplyScalar(epsilon);

    for (let n = 0; n < 1000; n++) {
      let hit = this.getNode(pos);

      if (hit.node) {
        hit.distance = n * epsilon;
        return hit;
      }

      pos.add(dir);
    }

    return undefined;
  }
}