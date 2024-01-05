import { Canvas } from '@scripts/modules/Canvas.ts'

document.addEventListener(
  'DOMContentLoaded',
  () => {
    const canvas = new Canvas({ canvas: document.querySelector<HTMLCanvasElement>('#webgl-canvas')! })
  },
  false,
)
