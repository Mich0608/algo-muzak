const ctx = new (window.AudioContext || window.webkitAudioContext)()
const fft = new AnalyserNode(ctx, { fftSize: 2048 })
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

const major = [0, 2, 4, 5, 7, 9, 11, 12]
const minor = [0, 2, 3, 5, 7, 8, 10, 12]

const delayStart = 1
const tempo = 140
const beat = 60 / tempo
const bar = beat * 4
const root = 440
const scale = major
const notes = [0, 0, 2, 2]

for(let a = 0; a < 4; a++) {
    const delayA = a * bar * 4
    for(let j = 0; j < 4; j++) {
        const delayJ = j * bar
        for(let i = 0; i < notes.length; i++) {
            const time = i * beat + delayStart + delayJ + delayA
            const dur = beat
            const pitch = step(root, notes[i])
            tone('sine', pitch, time, dur)
        }
    }
}

document.querySelector('button').addEventListener('click', function() {
    ctx.resume().then(() => {
      console.log('Playback resumed successfully');
    });
  });


