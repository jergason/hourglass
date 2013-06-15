#hourglass

hourglass is a front end JavaScript performance monitoring tool. It gives you
a `time` and `timeEnd` api for measuring how long things take, similar to the
Chrome console API. It aggregates these times and POSTs them to a server, where
you make magic happen with them.

# AN EXAMPLE

```javascript
var hourglass = new Hourglass({
  url: 'http://where.to.send.metrics.example.com'
  aggregationInterval: 10000
})

function someLongRunningThing() {
  hourglass.time('longRunningThing')
  someAsyncOperation(function() {
    hourglass.timeEnd('longRunningThing')
  })
}
```

Now every 10 seconds, hourglass will POST any metrics that were `timeEnd`ed
to the url.

### Metric Format

They get POSTed as JSON with this format:

```JavaScript
{
  "timestamp": 123455434, // timestamp the metrics were posted
  "metrics": {
    "metricName": [10, 20, 500, 10], // arrays of times in millesecond between `time` and `timeEnd`.
    "metricName2": [12312, 1234, 5959]
  }
}
```


## API

### `new Hourglass(opts)`
Create a new instance of Hourglass. `opts` is a hash of options

* `url` - the URL to POST metrics to. This is the only required option. The
  constructor will throw an error if you don't provide a `url`.
* `aggregationInterval` - the number of milliseconds to wait between POSTing
  metrics to `url`. Defaults to 60000
* `verbose` - if true, debug info will be printed to the console.

*Example*

```JavaScript
var hourglass = new Hourglass({url: 'http://my.server.endpoint.example.com/stats'})
```

### `hourglass.time(metricName)`

Record a start time for a metric. If `start` is called multiple times
with the same `metricName`, the metrics will be resolved in FIFO order.

* `metricName` String the name of the metric to record a start time for.

*Example*

```JavaScript
hourglass.time('renderHomePage')
someFunctionToRenderHomePage(function() {
  hourglass.timeEnd('renderHomePage')
})
```

### `hourglass.timeEnd(metricName)`
 Finish recording a time for a metric. It will be sent off with the
 next aggregation cycle.

* `metricName` String name of the metric to resolve.

*Example*

```JavaScript
hourglass.time('renderHomePage')
someFunctionToRenderHomePage(function() {
  hourglass.timeEnd('renderHomePage')
})
```

### `hourglass.startAggregation()`

Start the aggregation setInterval. This is called automatically by
the constructor, but if you want to manually start and stop aggregation,
here it is.

### `hourglass.pauseAggregation()`

Stop sending metrics to the server.

## FAQ

### Will this work on IE <= 8?

(╯°□°）╯︵ ƎI

### How do I consume these on the server?

I am working on a project to intergrate with Graphite and statsd, but for now
it is up to you to do something useful with this data.
