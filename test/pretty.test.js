'use strict'

var test = require('tap').test
var pino = require('../')
var os = require('os')
var split = require('split2')
var hostname = os.hostname()

test('pino transform prettifies', function (t) {
  t.plan(4)
  var pretty = pino.pretty()
  pretty.pipe(split(function (line) {
    t.ok(line.match(/.*hello world$/), 'end of line matches')
    t.ok(line.match(/(?!^)INFO.*/), 'includes level')
    t.ok(line.indexOf('' + process.pid) > 0, 'includes pid')
    t.ok(line.indexOf('' + hostname) > 0, 'includes hostname')
    return line
  }))
  var instance = pino(pretty)

  instance.info('hello world')
})

test('pino pretty moves level to start on flag', function (t) {
  t.plan(4)
  var pretty = pino.pretty({ levelFirst: true })
  pretty.pipe(split(function (line) {
    t.ok(line.match(/.*hello world$/), 'end of line matches')
    t.ok(line.match(/^INFO.*/), 'level is at start of line')
    t.ok(line.indexOf('' + process.pid) > 0, 'includes pid')
    t.ok(line.indexOf('' + hostname) > 0, 'includes hostname')
    return line
  }))
  var instance = pino(pretty)

  instance.info('hello world')
})

test('pino transform can just parse the dates', function (t) {
  t.plan(1)
  var pretty = pino.pretty({ timeTransOnly: true })
  pretty.pipe(split(function (line) {
    var obj = JSON.parse(line)
    t.ok(typeof obj.time === 'string', 'time is a string')
    return line
  }))
  var instance = pino(pretty)

  instance.info('hello world')
})

test('pino transform can format with a custom function', function (t) {
  t.plan(1)
  var pretty = pino.pretty({ formatter: function (line) {
    return 'msg: ' + line.msg + ', foo: ' + line.foo
  } })
  pretty.pipe(split(function (line) {
    t.ok(line === 'msg: hello world, foo: bar', 'line matches')
    return line
  }))
  var instance = pino(pretty)

  instance.info({foo: 'bar'}, 'hello world')
})

test('pino transform prettifies Error', function (t) {
  var pretty = pino.pretty()
  var err = new Error('hello world')
  var expected = err.stack.split('\n')
  expected.unshift(err.message)

  t.plan(expected.length)

  pretty.pipe(split(function (line) {
    t.ok(line.indexOf(expected.shift()) >= 0, 'line matches')
    return line
  }))

  var instance = pino(pretty)

  instance.info(err)
})

test('pino transform preserve output if not valid JSON', function (t) {
  t.plan(1)
  var pretty = pino.pretty()
  var lines = []
  pretty.pipe(split(function (line) {
    lines.push(line)
    return line
  }))

  pretty.write('this is not json\nit\'s just regular output\n')
  pretty.end()

  t.deepEqual(lines, ['this is not json', 'it\'s just regular output'], 'preserved lines')
})

test('handles missing time', function (t) {
  t.plan(1)
  var pretty = pino.pretty()
  var lines = []
  pretty.pipe(split(function (line) {
    lines.push(line)
    return line
  }))

  pretty.write('{"hello":"world"}')
  pretty.end()

  t.deepEqual(lines, ['{"hello":"world"}'], 'preserved lines')
})
