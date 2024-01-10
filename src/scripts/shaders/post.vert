attribute vec3 position;
attribute vec2 uv;
varying vec2 vTexCoord;
varying vec2 vUv;

void main() {
  vUv = uv;
  vTexCoord = position.xy * 0.5 + 0.5; // 0.0 ~ 1.0
  gl_Position = vec4(position, 1.0);
}

