const ctx = new (window.AudioContext || window.webkitAudioContext)()
const fft = new AnalyserNode(ctx, { fftSize: 2048 })
const src = new AudioBufferSourceNode( ctx )
createWaveCanvas({ element: 'section', analyser: fft })


function tone (type, pitch, time, duration) {
    const start = time || ctx.currentTime
    const dur = duration || 1
    const osc = new OscillatorNode(ctx, {
        type: type || 'sine',
        frequency: pitch || 440
    })
    const lvl = new GainNode(ctx, { gain: 0.001 })
    osc.connect(lvl)
    lvl.connect(ctx.destination)
    lvl.connect(fft)
    osc.start(start)
    osc.stop(start + dur)
    adsr({
        param: lvl.gain,
        peak: 0.5,
        hold: 0.3,
        time: start,
        duration: dur
    })
}

function adsr (opts) {
    const param = opts.param
    const peak = opts.peak || 1
    const hold = opts.hold || 0.7
    const time = opts.time || ctx.currentTime
    const dur = opts.duration || 1
    const a = opts.attack || dur * 0.2
    const d = opts.decay || dur * 0.1
    const s = opts.sustain || dur * 0.5
    const r = opts.release || dur / 0.2
  
    const initVal = param.value

    param.setValueAtTime(initVal, time)
    param.linearRampToValueAtTime(peak, time + a)
    param.linearRampToValueAtTime(hold, time + a + d)
    param.linearRampToValueAtTime(hold, time + a + d + s)
    param.linearRampToValueAtTime(initVal, time + a + d + s + r)
}

function step (rootFreq, steps) {
    const startingNote = rootFreq || 440
    const a = Math.pow(2, 1 / 12)
    const nextStep = startingNote * Math.pow(a, steps)
            
    return Math.round(nextStep * 100) / 100
}

function randnote (scale) {
    return Math.floor(Math.random() * scale.length)
}

function snare(time, duration) {
    const gn = new GainNode(ctx, { gain: 0.5 })
    gn.connect(ctx.destination)

    const snareFilter = ctx.createBiquadFilter();
    snareFilter.type = "highpass"
    snareFilter.frequency.value = 2000;
    snareFilter.connect(gn)

    const whiteBuffer = ctx.createBuffer(2, ctx.sampleRate*1, ctx.sampleRate)
    for (let ch=0; ch<whiteBuffer.numberOfChannels; ch++) {
        let samples = whiteBuffer.getChannelData(ch)
        for (let s=0; s<whiteBuffer.length; s++) samples[s] = Math.random()*2-1
    }

    let white = new AudioBufferSourceNode(ctx, {buffer:whiteBuffer})
    white.connect(snareFilter)
    white.connect(fft)
    white.start(time)
    white.stop(time + duration)
}

function drum(time, duration) {
    const gn = new GainNode(ctx, { gain: 0.5 })
    gn.connect(ctx.destination)

    const drumFilter = ctx.createBiquadFilter();
    drumFilter.type = "band pass"
    drumFilter.frequency.value = 2000;
    drumFilter.connect(gn)

    const brownBuffer = ctx.createBuffer(2, ctx.sampleRate*1, ctx.sampleRate)
    for (let ch=0; ch<brownBuffer.numberOfChannels; ch++) {
        let samples = brownBuffer.getChannelData(ch)
        let lastOut = 0.0
        for (s = 0; s<brownBuffer.length; s++) {
            white = Math.random() * 2 - 1
            samples[s] = (lastOut + (0.02 * white)) / 1.02
            lastOut = samples[s]
            samples[s] *= 10 // (roughly) compensate for gain
        }
    }

    let brown = new AudioBufferSourceNode(ctx, {buffer:brownBuffer})
    brown.connect(drumFilter)
    brown.connect(fft)
    brown.start(time)
    brown.stop(time + duration)
}

function brass (pitch, time, duration) {
    const start = time || ctx.currentTime
    const dur = duration || 1
    const osc = new OscillatorNode(ctx, {
        type: 'sawtooth',
        frequency: pitch || 440
    })
    const lvl = new GainNode(ctx, { gain: 0.001 })

    const brassFilter = ctx.createBiquadFilter();
    brassFilter.type = "lowpass"
    brassFilter.frequency.value = 2500;
    brassFilter.connect(lvl)

    osc.connect(brassFilter)
    lvl.connect(ctx.destination)
    lvl.connect(fft)
    osc.start(start)
    osc.stop(start + dur)
    adsr({
        param: lvl.gain,
        peak: 0.5,
        hold: 0.3,
        time: start,
        duration: dur
    })
}

function shaker (time, duration) {
    const gn = new GainNode(ctx, { gain: 0.5 })
    gn.connect(ctx.destination)

    const shakerFilter = ctx.createBiquadFilter();
    shakerFilter.type = "highpass"
    shakerFilter.frequency.value = 5000;
    shakerFilter.connect(gn)

    const pinkBuffer = ctx.createBuffer(2, ctx.sampleRate*1, ctx.sampleRate)
    for (let ch=0; ch<pinkBuffer.numberOfChannels; ch++) {
        let b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0
        let samples = pinkBuffer.getChannelData(ch)
        for (let s = 0; s<pinkBuffer.length; s++) {
            white = Math.random() * 2 - 1
            b0 = 0.99886 * b0 + white * 0.0555179
            b1 = 0.99332 * b1 + white * 0.0750759
            b2 = 0.96900 * b2 + white * 0.1538520
            b3 = 0.86650 * b3 + white * 0.3104856
            b4 = 0.55000 * b4 + white * 0.5329522
            b5 = -0.7616 * b5 - white * 0.0168980
            samples[s] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
            samples[s] *= 0.11 // (roughly) compensate for gain
            b6 = white * 0.115926
        }
    }

    let pink = new AudioBufferSourceNode(ctx, {buffer:pinkBuffer})
    pink.connect(shakerFilter)
    pink.connect(fft)
    pink.start(time)
    pink.stop(time + duration)
}


const major = [0, 2, 4, 5, 7, 9, 11, 12]
const minor = [0, 2, 3, 5, 7, 8, 10, 12]

const delayStart = 1
const root = 440
const scale = minor
const notes = [0, 1, 2, 3]
const brassnotes = [3, 5, 3, 5]
const type = ['sine', 'square', 'sawtooth']

function play() {
    const tempo = 140
    const beat = 60 / tempo
    const bar = beat * 4
    for(let a = 0; a < 4; a++) {
        const delayA = a * bar * 4
        notes[2] = randnote(minor)
        notes[3] = randnote(minor)
        for(let j = 0; j < 4; j++) {
            const delayJ = j * bar
            for(let i = 0; i < notes.length; i++) {
                const time = i * beat + delayStart + delayJ + delayA
                const dur = beat
                const pitch = step(root, notes[i])
                const typeidx = Math.floor(Math.random() * type.length)
                tone('sine', pitch, time, dur)
            }
        }
    }
}

function playbrass() {
    const tempo = 140 / 2
    const beat = 60 / tempo
    const bar = beat * 4
    for(let a = 0; a < 4; a++) {
        const delayA = a * bar * 4
        brassnotes[1] = randnote(minor)
        brassnotes[3] = randnote(minor)
        for(let j = 0; j < 4; j++) {
            const delayJ = j * bar
            for(let i = 0; i < notes.length; i++) {
                const time = i * beat + delayStart + delayJ + delayA
                const dur = beat
                const pitch = step(root, brassnotes[i])
                brass(pitch, time, dur)
            }
        }
    }
}

function playsnare() {
    const tempo = 140
    const beat = 60 / tempo
    const bar = beat * 4
    for(let a = 0; a < 8; a++) {
        const delayA = a * bar * 2
        for(let j = 0; j < 4; j++) {
            snaretime = j * beat + delayStart + delayA
            snare(snaretime, beat / 4)
        }
    }
}

function playdrum() {
    const tempo = 140
    const beat = 60 / tempo
    const bar = beat * 4
    for(let a = 0; a < 8; a++) {
        const delayA = a * bar * 2 + beat
        for(let j = 0; j < Math.floor(Math.random() * 5); j++) {
            drumtime = j * beat + delayStart + delayA
            drum(drumtime, beat / 1.5)
        }
    }
}

function playshaker() {
    const tempo = 140
    const beat = 60 / tempo
    const bar = beat * 4
    for(let a = 0; a < 8; a++) {
        const delayA = a * bar * 2 + beat
        for(let j = 0; j < 3; j++) {
            shakertime = j * beat + delayA
            shaker(shakertime, beat / 1.2)
        }
    }
}


document.getElementById('snare').addEventListener('click', function() {
    playsnare()
  })

document.getElementById('play').addEventListener('click', function() {
    play()
  })

document.getElementById('drum').addEventListener('click', function() {
    playdrum()
  })

  document.getElementById('shaker').addEventListener('click', function() {
    playshaker()
  })

  document.getElementById('brass').addEventListener('click', function() {
    playbrass()
  })






