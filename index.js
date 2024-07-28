let scene;

let fps = 60;

let pressed = new Array(128).fill(false);

let debug = false;

let controls = {
  "Walk Forward": 87,
  "Walk Back": 83,
  "Walk Left": 65,
  "Walk Right": 68,
  "Pause": 27,
  "Debug Mode": 76,
};


let world;
let freeCam;

let materials = [];


function start() {
  materials = [
    new Material({c: 0xffffff}),
    new Material({c: 0x747474, strength: 0.8}), //Stone
    new Material({c: 0x444444, strength: 0.99}), //Hard stone
    new Material({c: 0x444444, strength: 1}), //Unbreakable stone
    new Material({c: 0xffff00, strength: 0.8, emissive: 0xffff00}), //Fire
    new Material({c: 0x007400, strength: 0.2}), //Grass
  ];

  world = new World()
  freeCam = new FreeCam;
  setScene(freeCam);
}



function setScene(newScene) {
  if (scene?.stop) scene.stop();
  scene = newScene;
  if (scene.start) scene.start();
  scene.hasStarted = true;
}

document.addEventListener("keydown", keyPressed);
function keyPressed(e) {
  pressed[e.keyCode] = true;

  if (getKeyPressed("Debug Mode")) debug = !debug;

  if (scene?.keyPressed) scene.keyPressed(e);
  
  if (debug) console.log(e.keyCode);
}

document.addEventListener("keyup", keyReleased);
function keyReleased(e) {
  pressed[e.keyCode] = false;

  if (scene?.keyReleased) scene.keyReleased(e);
}

document.addEventListener("mousedown", mousePressed);
function mousePressed(e) {
  if (scene?.mousePressed) scene.mousePressed(e);
}

document.addEventListener("scroll", mouseWheel);
function mouseWheel(e) {
  if (scene?.mouseWheel) scene.mouseWheel(e);
}

document.addEventListener("mousemove", mouseMoved);
function mouseMoved(e) {
  if (scene?.mouseMoved) scene.mouseMoved(e);
}

function getKey(controlName) {
  return controls[controlName];
}
function getKeyPressed(controlName) {
  return pressed[getKey(controlName)];
}
function getControlName(controlName) {
  return String.fromCharCode(controls[controlName]);
}

function update() {
  if (scene?.update) scene.update();
}

