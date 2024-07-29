//https://www.npmjs.com/package/vox-parser

let parseVox;

{
var parsePackChunk = function parsePackChunk(data) {

  return {

    numModels: data.nextInt()

  };

};


var parseSizeChunk = function parseSizeChunk(data) {

  return data.nextPattern(['x', 'y', 'z'], 4);

};


var parseXYZIChunk = function parseXYZIChunk(data) {

  var numVoxels = data.nextInt();

  var voxels = [];

  for (var i = 0; i < numVoxels; i++) {

    voxels.push(data.nextPattern(['x', 'y', 'z', 'i'], 1));

  }

  return { numVoxels: numVoxels, voxels: voxels };

};


var parseRGBAChunk = function parseRGBAChunk(data) {

  var palette = [];

  for (var i = 0; i < 256; i++) {

    palette.push(data.nextPattern(['r', 'g', 'b', 'a'], 1));

  }

  return { palette: palette };

};


var MATERIAL_TYPE = ['diffuse', 'metal', 'glass', 'emissive'];


var parseMattChunk = function parseMattChunk(data) {

  var id = data.nextInt();

  var materialType = data.nextInt();

  var materialWeight = data.nextFloat();

  var propertyBits = data.nextInt();

  var propertyFlags = [(propertyBits & 1) > 0 && 'plastic', (propertyBits & 2) > 0 && 'roughness', (propertyBits & 4) > 0 && 'specular', (propertyBits & 8) > 0 && 'ior', (propertyBits & 16) > 0 && 'attenuation', (propertyBits & 32) > 0 && 'power', (propertyBits & 64) > 0 && 'glow', (propertyBits & 128) > 0 && 'isTotalPower'];

  var properties = propertyFlags.filter(Boolean).map(function (property) {

    return {

      property: property,

      value: property !== 'isTotalPower' ? data.nextFloat() : null

    };

  });


  return {

    id: id,

    materialType: MATERIAL_TYPE[materialType],

    materialWeight: materialWeight,

    properties: properties

  };

};


var PARSERS = {

  PACK: parsePackChunk,

  SIZE: parseSizeChunk,

  XYZI: parseXYZIChunk,

  RGBA: parseRGBAChunk,

  MATT: parseMattChunk

};


var dataFactory = function dataFactory(buffer) {

  var data = new DataView(buffer);

  var offset = 0;


  return {

    hasNext: function hasNext() {

      return offset < data.byteLength;

    },

    nextString: function nextString() {

      var str = '';

      for (var i = 0; i < 4; i++) {

        str += String.fromCharCode(data.getUint8(offset, true));

        offset += 1;

      }

      return str;

    },

    nextInt: function nextInt() {

      var int = data.getUint32(offset, true);

      offset += 4;

      return int;

    },

    nextFloat: function nextFloat() {

      var float = data.getFloat32(offset, true);

      offset += 4;

      return float;

    },

    nextPattern: function nextPattern(pattern, bytes) {

      return pattern.reduce(function (obj, key) {

        obj[key] = data['getUint' + bytes * 8](offset, true);

        offset += bytes;

        return obj;

      }, {});

    }

  };

};


var readHead = function readHead(data) {

  return {

    id: data.nextString(),

    version: data.nextInt()

  };

};


var readBasicChunkData = function readBasicChunkData(data) {

  return {

    id: data.nextString(),

    numContent: data.nextInt(),

    numChildren: data.nextInt()

  };

};


var readChunk = function readChunk(data) {

  var chunk = readBasicChunkData(data);

  var parser = PARSERS[chunk.id];

  if (typeof parser === 'function') {

    return Object.assign(chunk, {

      content: parser(data)

    });

  } else {

    throw new Error('Unrecognized chunk id: \'' + chunk.id + '\'');

  }

};


var readBody = function readBody(data) {

  var body = [];

  while (data.hasNext()) {

    var chunk = readChunk(data);

    body.push(chunk);

  }

  return body;

};


parseVox = function parse(buffer) {

  var data = dataFactory(buffer);


  var head = readHead(data);

  if (head.id !== 'VOX ') {

    throw new Error('Expected file id \'VOX \', found: \'' + head.id + '\'');

  }


  var mainChunk = readBasicChunkData(data);

  if (mainChunk.id !== 'MAIN') {

    throw new Error('Expected \'MAIN\' chunk, found: \'' + mainChunk.id + '\'');

  }


  return {

    id: head.id,

    version: head.version,

    body: Object.assign(mainChunk, {

      children: readBody(data)

    })

  };

};
}

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(c) {
  return parseInt("0x" + componentToHex(c.r) + componentToHex(c.g) + componentToHex(c.b));
}
let defaultVoxPalette = [0x000000,0xffffff,0xffccff,0xff99ff,0xff66ff,0xff33ff,0xff00ff,0xffffcc,0xffcccc,0xff99cc,0xff66cc,0xff33cc,0xff00cc,0xffff99,0xffcc99,0xff9999,0xff6699,0xff3399,0xff0099,0xffff66,0xffcc66,0xff9966,0xff6666,0xff3366,0xff0066,0xffff33,0xffcc33,0xff9933,0xff6633,0xff3333,0xff0033,0xffff00,0xffcc00,0xff9900,0xff6600,0xff3300,0xff0000,0xffffff,0xffccff,0xff99ff,0xff66ff,0xff33ff,0xff00ff,0xffffcc,0xffcccc,0xff99cc,0xff66cc,0xff33cc,0xff00cc,0xffff99,0xffcc99,0xff9999,0xff6699,0xff3399,0xff0099,0xffff66,0xffcc66,0xff9966,0xff6666,0xff3366,0xff0066,0xffff33,0xffcc33,0xff9933,0xff6633,0xff3333,0xff0033,0xffff00,0xffcc00,0xff9900,0xff6600,0xff3300,0xff0000,0xffffff,0xffccff,0xff99ff,0xff66ff,0xff33ff,0xff00ff,0xffffcc,0xffcccc,0xff99cc,0xff66cc,0xff33cc,0xff00cc,0xffff99,0xffcc99,0xff9999,0xff6699,0xff3399,0xff0099,0xffff66,0xffcc66,0xff9966,0xff6666,0xff3366,0xff0066,0xffff33,0xffcc33,0xff9933,0xff6633,0xff3333,0xff0033,0xffff00,0xffcc00,0xff9900,0xff6600,0xff3300,0xff0000,0xffffff,0xffccff,0xff99ff,0xff66ff,0xff33ff,0xff00ff,0xffffcc,0xffcccc,0xff99cc,0xff66cc,0xff33cc,0xff00cc,0xffff99,0xffcc99,0xff9999,0xff6699,0xff3399,0xff0099,0xffff66,0xffcc66,0xff9966,0xff6666,0xff3366,0xff0066,0xffff33,0xffcc33,0xff9933,0xff6633,0xff3333,0xff0033,0xffff00,0xffcc00,0xff9900,0xff6600,0xff3300,0xff0000,0xffffff,0xffccff,0xff99ff,0xff66ff,0xff33ff,0xff00ff,0xffffcc,0xffcccc,0xff99cc,0xff66cc,0xff33cc,0xff00cc,0xffff99,0xffcc99,0xff9999,0xff6699,0xff3399,0xff0099,0xffff66,0xffcc66,0xff9966,0xff6666,0xff3366,0xff0066,0xffff33,0xffcc33,0xff9933,0xff6633,0xff3333,0xff0033,0xffff00,0xffcc00,0xff9900,0xff6600,0xff3300,0xff0000,0xffffff,0xffccff,0xff99ff,0xff66ff,0xff33ff,0xff00ff,0xffffcc,0xffcccc,0xff99cc,0xff66cc,0xff33cc,0xff00cc,0xffff99,0xffcc99,0xff9999,0xff6699,0xff3399,0xff0099,0xffff66,0xffcc66,0xff9966,0xff6666,0xff3366,0xff0066,0xffff33,0xffcc33,0xff9933,0xff6633,0xff3333,0xff0033,0xffff00,0xffcc00,0xff9900,0xff6600,0xff3300,0xff0000,0xff0000,0xff0000,0xff0000,0xff0000,0xff0000,0xff0000,0xff0000,0xff0000,0xff0000,0xff00ee,0xff00dd,0xff00bb,0xff00aa,0xff0088,0xff0077,0xff0055,0xff0044,0xff0022,0xff0011,0xffee00,0xffdd00,0xffbb00,0xffaa00,0xff8800,0xff7700,0xff5500,0xff4400,0xff2200,0xff1100,0xffeeee,0xffdddd,0xffbbbb,0xffaaaa,0xff8888,0xff7777,0xff5555,0xff4444,0xff2222,0xff1111].map(e => {return {c: e, strength: 1}});
