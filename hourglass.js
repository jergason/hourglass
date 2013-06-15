// Terrible UMD boilerplate
(function (root, factory) {
    if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory);
    } else {
        // Browser globals (root is window)
        root.Hourglass = factory();
  }
}(this, function () {
  "use strict";
  // Polyfill Date.now for the stepchild of the internet, IE 8
  Date.now = Date.now || function() { return +new Date }

  // hack to make it work in node
  var global = window || {}


  /**
   * Create a new Hourglass timer
   * @constructor
   * @param opts Object constructor options to configure Hourglass
   *   aggregationInterval Number interval in milliseconds to send off metrics.
   *     Default is 10000.
   *   verbose Boolean toggle verbose output to console. Default is false
   *   url String url to POST metrics to. Required.
   *
   */
  var Hourglass = function(opts) {
    // send off metrics every 10 seconds by default
    this.aggregationInterval = opts.aggregationInterval || 60000
    this.url = opts.url
    if (!this.url) {
      var err = new Error('Hourglass requires an `url` in the options'
        + ' to know where to send metrics. Please include one.')
      throw err
    }
    this.verbose = opts.verbose || false

    // metrics that have a start time but no end-time
    this.awaitingMetrics = {}

    // metrics that have been resolved and will be sent to an endpoint
    this.metrics = {}

    // overrideable http lib if you don't want jQuery or for testing.
    // defaults to jQuery if nothing is provided.
    this.httpLib = opts.httpLib || global.jQuery


    // kick off metric aggregation
    this.startAggregation()
  }

  /**
   * Record a start time for a metric. If `start` is called multiple times
   * with the same `metricName`, the metrics will be resolved in FIFO order.
   * @param metricName String the name of the metric to record a start time for.
   */
  Hourglass.prototype.time = function(metricName) {
    var startTime = Date.now()
    addToAwaitingMetrics(this.awaitingMetrics, metricName, startTime, this.verbose)
  }


  /**
   * Finish recording a time for a metric. It will be sent of with the
   * next aggregation cycle.
   * @param metricName String name of the metric to resolve.
   */
  Hourglass.prototype.timeEnd = function(metricName) {
    var endTime = Date.now()
    resolveMetric(metricName, endTime, this.awaitingMetrics, this.metrics,
      this.verbose)
  }

  /**
   * Start the aggregation setInterval. This is called automatically by
   * the constructor, but if you want to manually start and stop aggregation
   * here it is.
   */
  Hourglass.prototype.startAggregation = function() {
    // if we already have a setInterval running
    if (this.aggregationSetInterval != null) {
      return
    }

    this.aggregationSetInterval = setInterval(this.sendMetrics.bind(this),
      this.aggregationInterval)
  }

  /**
   * Stop sending metrics to the server.
   */
  Hourglass.prototype.pauseAggregation = function() {
    clearInterval(this.aggregationSetInterval)
    this.aggregationSetInterval = null
  }

  function addToAwaitingMetrics(metricHash, name, startTime, verbose) {
    if (!metricHash[name]) {
      metricHash[name] = []
    }

    metricHash[name].push(startTime)
    if (verbose) {
      console.log('adding unresolved metric', name, startTime)
    }
  }

  function resolveMetric(name, endTime, awaitingMetrics, resolvedMetrics, verbose) {
    var startTime = awaitingMetrics[name].shift()

    if (startTime == null) {
      console.error('Trying to resolve metric ' + name + ' and found no '
        + 'matching start metric.')
      return
    }

    if (!resolvedMetrics[name]) {
      resolvedMetrics[name] = []
    }

    resolvedMetrics[name].push(endTime - startTime)
    if (verbose) {
      console.log('resolving metric', name, (endTime - startTime))
    }
  }

  /**
   * Send metrics collected so far to the endpoint. This will reset the internal
   * metrics cache. If there is a network error, metric will dissapear into the
   * aether.
   *
   * @param success Function success callback to be called if POST succeeds. Optional
   * @param error Function error callback if POST fails. Optional.
   */
  Hourglass.prototype.sendMetrics = function(success, error) {
    success = success || this.defaultPostCb
    error = error || this.defaultPostCb
    var metricsToSend = {
      metrics: this.metrics,
      timestamp: Date.now()
    }

    if (this.verbose) {
      console.log('Hourglass about to send metrics:', metricsToSend)
    }

    this.metrics = {}

    this.httpLib.ajax({
      type: 'POST',
      context: this,
      url: this.url,
      success: success,
      error: error,
      data: JSON.stringify(metricsToSend),
      contentType: 'application/json'
    })
  }

  Hourglass.prototype.defaultPostCb = function (data, textStatus) {
    if (this.verbose) {
      console.log('staus from sendMetrics is', arguments)
    }
  }

  return Hourglass
}));
