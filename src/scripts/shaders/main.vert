attribute vec3 position;
varying vec2 vTexCoord;

void main() {
  vTexCoord = position.xy * 0.5 + 0.5; // 0.0 ~ 1.0
  gl_Position = vec4(position, 1.0);
}

