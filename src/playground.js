
var createScene = function () {

    //#region Geometry constants

    const HALF_PI = Math.PI / 2
    const PI = Math.PI
    const TWO_PI = Math.PI * 2

    //#endregion

    //#region Scene setup

    const scene = new BABYLON.Scene(engine)

    const camera = new BABYLON.FreeCamera(`camera`, new BABYLON.Vector3(0, 2, 10))
    camera.setTarget(new BABYLON.Vector3(0, 0, 0))
    camera.attachControl()

    const light = new BABYLON.HemisphericLight(`light`, new BABYLON.Vector3(0, 1, 0), scene)
    light.intensity = 0.7

    //#endregion

    //#region XR setup

    // const startXr = async () => {
    //     try {
    //         const xr = await scene.createDefaultXRExperienceAsync({})
    //         if (!!xr && !!xr.enterExitUI) {
    //             xr.enterExitUI.activeButtonChangedObservable.add(() => {
    //                 BABYLON.Engine.audioEngine.unlock()
    //             })
    //         }
    //     }
    //     catch (e) {
    //         console.debug(e)
    //     }
    // }
    // startXr()

    //#endregion

    //#region Geometry functions

    const intersection = (a1, a2, b1, b2, out) => {
        // Return `false` if one of the line lengths is zero.
        if ((a1.x === a2.x && a1.y === a2.y) || (b1.x === b2.x && b1.y === b2.y)) {
            return false
        }

        denominator = ((b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y))

        // Return `false` if lines are parallel.
        if (denominator === 0) {
            return false
        }

        let ua = ((b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x)) / denominator
        let ub = ((a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x)) / denominator

        // Return `false` if the intersection is not on the segments.
        if (ua < 0 || 1 < ua || ub < 0 || 1 < ub) {
            return false
        }

        // Set out vector's x and y coordinates.
        out.x = a1.x + ua * (a2.x - a1.x)
        out.y = a1.y + ua * (a2.y - a1.y)

        return true
    }

    const toDegrees = (value) => {
        return (value / TWO_PI) * 360
    }

    //#endregion

    //#region Ground

    const ground = BABYLON.MeshBuilder.CreateGround(`ground`, { width: 10, height: 10 })
    ground.material = new BABYLON.StandardMaterial(``)
    ground.material.backFaceCulling = false
    ground.material.alpha = 0.5

    //#endregion

    //#region Sphere

    const sphere = BABYLON.MeshBuilder.CreateSphere(`sphere`, { diameter: 1, segments: 16 })
    sphere.position.y = 0.5

    //#endregion

    //#region Omnitone setup

    let audioElementWY = document.getElementById(`audio-wy`)
    let audioElementZX = document.getElementById(`audio-zx`)

    // const audioWY = new BABYLON.Sound(`audio.wy`, `./assets/mixdown-wy.mp3`)
    // const audioZX = new BABYLON.Sound(`audio.wy`, `./assets/mixdown-zx.mp3`)

    const button = document.createElement(`button`)
    button.textContent = `start`
    button.style.color = `black`
    button.style.zIndex = 10
    button.style.position = 'absolute'
    button.style.display = 'none'
    button.style.top = '16px'
    button.style.left = '16px'
    button.style.width = '64px'
    button.style.height = '64px'
    document.body.appendChild(button)
    button.onclick = () => {
        audioElementWY.play()
        audioElementWY.pause()
        audioElementWY.currentTime = 0

        audioElementZX.play()
        audioElementZX.pause()
        audioElementWY.currentTime = 0

        // audioWY.play()
        // audioWY.pause()
        // audioWY.currentTime = 0

        // audioZX.play()
        // audioZX.pause()
        // audioZX.currentTime = 0

        const audioContext = engine.getAudioContext()
        const audioElementSourceWY = audioContext.createMediaElementSource(audioElementWY)
        const audioElementSourceZX = audioContext.createMediaElementSource(audioElementZX)
        // const audioNodeWY = audioWY.getSoundGain()
        // const audioNodeZX = audioZX.getSoundGain()
        // audioNodeWY.disconnect()
        // audioNodeZX.disconnect()
        const foaRenderer = Omnitone.createFOARenderer(audioContext)

        foaRenderer.initialize().then(function () {
            const channelMerger = new ChannelMergerNode(audioContext, {
                numberOfInputs: 4,
                channelCount: 1,
                channelCountMode: 'explicit',
                channelInterpretation: 'discrete'
            })
            audioElementSourceWY.connect(channelMerger, 0, 0)
            audioElementSourceWY.connect(channelMerger, 0, 1)
            audioElementSourceZX.connect(channelMerger, 0, 3)
            audioElementSourceZX.connect(channelMerger, 0, 2)
            // audioNodeWY.connect(channelMerger, 0, 0)
            // audioNodeWY.connect(channelMerger, 0, 1)
            // audioNodeZX.connect(channelMerger, 0, 2)
            // audioNodeZX.connect(channelMerger, 0, 3)
            channelMerger.connect(foaRenderer.input)
            foaRenderer.output.connect(audioContext.destination)
            audioElementWY.play()
            audioElementZX.play()
            // audioWY.play()
            // audioZX.play()
            audioContext.resume()

            document.body.removeChild(button)

            const omnitoneMatrix = new BABYLON.Matrix
            const rotationMatrix = BABYLON.Matrix.RotationAxis(BABYLON.Vector3.Up(), HALF_PI)

            setInterval(() => {
                camera.getWorldMatrix().multiplyToRef(rotationMatrix, omnitoneMatrix)
                foaRenderer.setRotationMatrix4(omnitoneMatrix.m)
            }, 8)
        })
    }

    // BABYLON.Engine.audioEngine.onAudioUnlockedObservable.addOnce(() => {
    //     audioWY.play()
    //     audioZX.play()
    //     audioContext.resume()
    // })

    scene.onReadyObservable.add(() => {
        button.style.display = 'block'
    })

    //#endregion

    global.camera = camera
    global.audioContext = engine.getAudioContext()
    return scene
}

function isInBabylonPlayground() {
    return document.getElementById('pg-root') !== null
}

if (!isInBabylonPlayground()) {
    module.exports = createScene
}
