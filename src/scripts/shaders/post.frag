precision mediump float;
uniform sampler2D uTexture;
uniform sampler2D uImageTexture;
uniform bool uUseImage;
uniform vec2 uCoveredScale;
varying vec2 vTexCoord;
varying vec2 vUv;

void main() {
  vec2 uv = (vUv - 0.5) * uCoveredScale + 0.5;
  vec4 samplerColor = texture2D(uTexture, vTexCoord);

  if (uUseImage) {
    float height = samplerColor.r;
    vec3 imageColor;
    imageColor.r = texture2D(uImageTexture, uv - height * 1.0).r;
    imageColor.g = texture2D(uImageTexture, uv - height * 1.0).g;
    imageColor.b = texture2D(uImageTexture, uv - height * 1.0).b;
    gl_FragColor = vec4(imageColor, 1.0);
  } else {
    gl_FragColor = vec4(vec3(samplerColor.r), 1.0);
  }
}

