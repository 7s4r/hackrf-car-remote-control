import hackrf from 'hackrf.js'
import ook from './lib/ook.js'
import commands from './lib/commands.js'
import channel from './lib/channels.js'

class RadioCar {
  constructor (opts) {
    if (!opts) { this.opts = {} }
    if (!(this instanceof RadioCar)) { return new RadioCar() }

    this._index = opts.id || 0
    this._stream = null
    this._freq = opts.freq ? opts.freq : channel(opts.channel || 19)
    this._sampleRate = opts.sampleRate || 8e6
    this._gain = opts.gain || 47 // TX VGA (IF) gain, 0-47 dB in 1 dB steps
    this._speed = opts.speed || 1
    this._inverted = opts.swaplr || false
    this._stopIn = opts.stop || null
    this._stopTimer = null

    const encode = ook({
      sampleRate: this.sampleRate,
      symbolPeriod: 0.4638, // in milliseconds
    })

    const self = this

    this._signal = {}

    Object.keys(commands).forEach(function (key) {
      const cmd = commands[key]

      self._signal[key] = encode(cmd[0])
      self._signal[key].name = cmd[1]
    })
  }

  async init () {
    this._device = await hackrf.open(this._index)
    this._device.setTxVgaGain(this._gain)
    this._device.setFrequency(this._freq)
    this._device.setSampleRate(this._sampleRate)
  }

  async _start () {
    const self = this

    await this._device.transmit(function (buf, cb) {
      if (self._stream) {
        for (let i = 0; i < buf.length; i++) {
          buf[i] = self._stream[self._index++]
          if (self._index === self._stream.length) self._index = 0
        }
      } else {
        buf.fill(0)
      }
      cb()
    }).then((reponse) => console.log('response', response)).catch((error) => console.error(error))
  }

  async stop (cb) {
    if (!this._stream) return cb ? cb() : null
    this._stream = null
    await this._device.requestStop()
  }

  close (cb) {
    const self = this

    this.stop(async function () {
      await self._device.close(cb)
    })
  }

  forward (speed) {
    switch (speed || this._speed) {
      case 3: return this._drive(this._signal.fff)
      case 2: return this._drive(this._signal.ff)
      default: this._drive(this._signal.f)
    }
  }

  forwardLeft () {
    this._drive(this._inverted ? this._signal.fr : this._signal.fl)
  }

  forwardRight () {
    this._drive(this._inverted ? this._signal.fl : this._signal.fr)
  }

  reverse () {
    this._drive(this._signal.r)
  }

  reverseLeft () {
    this._drive(this._inverted ? this._signal.rr : this._signal.rl)
  }

  reverseRight () {
    this._drive(this._inverted ? this._signal.rl : this._signal.rr)
  }

  right () {
    this._drive(this._inverted ? this._signal.wl : this._signal.wr)
  }

  left () {
    this._drive(this._inverted ? this._signal.wr : this._signal.wl)
  }

  turn180 (cb) {
    this.batch([
      [this.forward, 1000],
      [this.right, 125],
      [this.reverseLeft, 100],
      [this.reverse, 1000],
    ], cb)
  }

  batch (commands, cb) {
    const self = this

    next()

    function next (i) {
      i = i || 0
      const command = commands[i]

      if (!command) return self.stop(cb)
      const fn = command[0]
      const ms = command[1]

      fn.call(self)
      if (ms) {
        setTimeout(function () {
          next(++i)
        }, ms)
      } else if (cb) {
        cb()
      }
    }
  }

  _drive (s) {
    if (this._stopTimer) clearTimeout(this._stopTimer)
    if (this._stream === s) return
    else if (!this._stream) this._start()

    this._index = 0
    this._stream = s

    if (this._stopIn) {
      const self = this

      this._stopTimer = setTimeout(function () {
        self.stop()
      }, this._stopIn)
    }
  }
}

export default RadioCar
