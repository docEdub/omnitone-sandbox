import * as BABYLON from 'babylonjs'
import Omnitone from 'omnitone'

const createScene = require('./playground.js')

global.canvas = document.getElementsByTagName('canvas')[0]
global.engine = new BABYLON.Engine(canvas, true, { audioEngine: true, audioEngineOptions: {
    audioContext: new AudioContext({
        latencyHint: 'playback'
    })
}})

const scene = createScene()

engine.runRenderLoop(() => {
    scene.render();
})

onresize = () => {
    engine.resize()
}
