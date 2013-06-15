var Hourglass = require('../hourglass')
var assert = require('assert')

describe('Hourglass', function() {
  describe('constructor', function() {
    it('throws an error if url opt is not present', function() {
      assert.throws(function() {
        var hourglass = new Hourglass()
      })
    })

    it('doesnt throw an error if url opt is present', function() {
      assert.doesNotThrow(function() {
        var hourglass = new Hourglass({
          url: 'example.com'
        })
      })
    })
  })

  describe('time', function() {
    var hourglass = new Hourglass({url: 'example.com', verbose: true})
    var awaitingMetrics = hourglass.awaitingMetrics

    it('puts an entry into the awaiting metrics hash using the metricName passed to time', function() {
      hourglass.time('durp')
      assert(awaitingMetrics.durp.length == 1, 'awaitingMetrics doesnt contain the metric!')
      assert(typeof awaitingMetrics.durp[0] ==  'number', 'the metric isnt a number??')
    })

    it('pushes another metric on when calling time twice with the same metricName', function() {
      hourglass.time('foo')
      hourglass.time('foo')
      assert(awaitingMetrics.foo.length == 2)
    })
  })

  describe('timeEnd', function() {
    describe('when called after calling `time` with the same metricName', function() {
      it('adds it to the metrics hash', function() {
        var hourglass = new Hourglass({url: 'durp.com', verbose: true})
        hourglass.time('durp')
        hourglass.timeEnd('durp')
        var metrics = hourglass.metrics
        assert(hourglass.metrics.durp.length == 1)
        assert(hourglass.metrics.durp[0] == 0)

      })
    })
  })

  describe('sendMetrics', function() {
    describe('when some metrics have been populated in this.metrics', function() {
      it('posts the metrics to this.url wrapped in an object containing the timestamp', function(done) {
        var fooMetrics = [12345, 123]
        var bazMetrics = [567, 123]
        var mockjQuery = {
          ajax: function(opts) {
            var textStuff = 'YUP YUP'
            var parsedData = JSON.parse(opts.data)
            assert(typeof parsedData.timestamp == 'number', 'data has a timestamp property')
            assert(Array.isArray(parsedData.metrics.foobar), 'metrics.foobar isnt an array!')
            assert(Array.isArray(parsedData.metrics.baz), 'metrics.baz isnt an array!')
            process.nextTick(function() {
              opts.success(null, textStuff)
              done()
            })
          }
        }
        var hourglass = new Hourglass({url: 'durp.com', verbose: true, httpLib: mockjQuery})
        // so the timeouts don't happen
        hourglass.pauseAggregation()

        hourglass.metrics.foobar = fooMetrics
        hourglass.metrics.baz = bazMetrics
        hourglass.sendMetrics()
      })
    })
  })
})
