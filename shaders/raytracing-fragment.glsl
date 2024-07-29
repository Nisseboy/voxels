varying vec2 vUv; 

uniform vec2 resolution;

uniform highp usampler2D voxelData;

/*struct World {
  vec3 size;
  uint[64] chunks;
  uint[64 * 0x8000] chunkBinary;
};
uniform World world;*/

void main()
{
  vec2 uv = vUv * 2.0 - 1.0;
  gl_FragColor = vec4(gl_FragCoord.xy / resolution, 0.0, 1.0);
  gl_FragColor = vec4(texelFetch(voxelData, ivec2(gl_FragCoord.xy), 0));
}