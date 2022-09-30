
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
    // camera.angularSensibility = 5000

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

    const soundOptions = {
        autoplay: false,
        loop: false,
        spatialSound: false,
        streaming: true
    }
    let audioWY_isReady = false
    let audioZX_isReady = false
    const audioWY = new BABYLON.Sound(
        `normalized.wy`,
        `./assets/normalized-wy.mp3`,
        null,
        () => {
            console.log(`audioWY is ready`)
            audioWY_isReady = true
        },
        soundOptions)
        const audioZX = new BABYLON.Sound(
            `normalized.zx`,
            `./assets/normalized-zx.mp3`,
            null,
            () => {
                console.log(`audioZX is ready`)
                audioZX_isReady = true
            },
        soundOptions)

    const audioContext = engine.getAudioContext()
    let foaRenderer = null

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
        audioContext.resume()

        audioWY.play()
        audioWY.stop()
        audioWY.currentTime = 0

        audioZX.play()
        audioZX.stop()
        audioZX.currentTime = 0

        foaRenderer = Omnitone.createFOARenderer(audioContext)

        foaRenderer.initialize().then(function () {
            const channelMerger = new ChannelMergerNode(audioContext, {
                numberOfInputs: 4,
                channelCount: 1,
                channelCountMode: 'explicit',
                channelInterpretation: 'discrete'
            })
            const audioWY_gainNode = audioWY.getSoundGain()
            const audioZX_gainNode = audioZX.getSoundGain()
            audioWY_gainNode.disconnect()
            audioWY_gainNode.connect(channelMerger, 0, 0)
            audioWY_gainNode.connect(channelMerger, 0, 1)
            audioZX_gainNode.disconnect()
            audioZX_gainNode.connect(channelMerger, 0, 3)
            audioZX_gainNode.connect(channelMerger, 0, 2)
            channelMerger.connect(foaRenderer.input)
            foaRenderer.output.connect(audioContext.destination)
            foaRenderer.setRenderingMode('bypass')
            BABYLON.Matrix.RotationYToRef(rotationCurrent, rotationMatrix)
            foaRenderer.setRotationMatrix4(rotationMatrix.m)
            audioContext.suspend()

            const intervalId = setInterval(() => {
                if (audioWY_isReady && audioZX_isReady) {
                    console.log(`Playing ...`)
                    audioWY.stop()
                    audioWY.currentTime = 0
                    audioWY.play()
                    audioZX.stop()
                    audioZX.currentTime = 0
                    audioZX.play()
                    audioContext.resume()
                    clearInterval(intervalId)
                }
            }, 1000)

            button.style.display = 'none'
        })
    }

    scene.onReadyObservable.add(() => {
        button.style.display = 'block'
    })

    const maxRotationAmountPerFrame = 0.05
    let rotationInitialized = false
    let rotationTarget = 0
    let rotationCurrent = 0
    const rotationMatrix = new BABYLON.Matrix
    scene.registerBeforeRender(() => {
        rotationTarget = camera.rotation.y + HALF_PI
        if (Math.abs(rotationTarget - rotationCurrent) < maxRotationAmountPerFrame) {
            return
        }
        if (!rotationInitialized) {
            rotationInitialized = true
            rotationCurrent = rotationTarget
        }
        if (rotationTarget < rotationCurrent) {
            rotationCurrent -= maxRotationAmountPerFrame
        }
        else if (rotationCurrent < rotationTarget) {
            rotationCurrent += maxRotationAmountPerFrame
        }
        console.log(`rotation: ${rotationCurrent}`)

        if (foaRenderer) {
            BABYLON.Matrix.RotationYToRef(rotationCurrent, rotationMatrix)
            foaRenderer.setRotationMatrix4(rotationMatrix.m)
        }
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
