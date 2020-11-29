const preamble = '1110111011101110'

function gen (n) {
  return preamble + Array(n + 1).join('10')
}

export default {
  f: [gen(10), 'forward'],
  ff: [gen(16), 'forward'], // untested
  fff: [gen(22), 'forward'], // untested (teoretical)
  fr: [gen(28), 'forward/right'],
  fl: [gen(34), 'forward/left'],
  r: [gen(40), 'reverse'],
  rl: [gen(46), 'reverse/left'],
  rr: [gen(52), 'reverse/right'],
  wr: [gen(58), 'right'],
  wl: [gen(64), 'left'],
}
