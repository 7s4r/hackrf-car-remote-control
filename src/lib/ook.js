function genOnSymbol (amplitute, numOfSamples) {
  const val = Math.cos(Math.PI / 4) * amplitute // at 45 degrees, cos(45) === sin(45)

  return Buffer.alloc(numOfSamples * 2, val)
}

export default function (opts) {
  const gain = opts.gain || 127 // convert from -1 -> +1 to -127 -> +127 (8-bit short)
  const sampleRate = opts.sampleRate || 8e6
  const samplesPerSymbol = Math.ceil(sampleRate / 1000 * opts.symbolPeriod)
  const onSymbol = genOnSymbol(gain, samplesPerSymbol)

  return function encode (data) {
    const symbols = data.split('')
    const totalSamples = symbols.length * samplesPerSymbol
    const encoded = Buffer.alloc(totalSamples * 2)

    symbols.forEach(function (symbol, index) {
      if (symbol === '0') return
      const offset = index * samplesPerSymbol * 2

      onSymbol.copy(encoded, offset)
    })

    return encoded
  }
}
