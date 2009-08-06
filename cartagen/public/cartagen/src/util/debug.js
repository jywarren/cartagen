/**
 * @namespace $D is the debugging namespace - it has a collection of tools to
 *            debug Cartagen, and can be enabled/disabled. By default, debug
 *            mode is only enabled if "debug" is passed as true to
 *            Cartagen.setup. All $D methods have been tested in Firebug and
 *            Safari 4, and most work in Chrome. When debug mode is disabled,
 *            as it should be for production sites, nothing is sent to the
 *            console -- methods like {@link $D.log} and {@link $D.warn} do
 *            nothing. This means that production sites can disable console
 *            logging  without having to manually remove all logging calls.
 */
$D = {
	/**
	 * Controls whether $D is enabled. If disabled, none of the $D methods
	 * will do anything.
	 * Do not set directly; use enable() and disable().
	 * @type Boolean
	 */
	enabled: false,
	/**
	 * Enables $D's methods
	 */
	enable: function() {
		$D.enabled = true
		if (console.firebug) {
			$D.log = console.debug
			$D.warn = console.warn
			$D.err = console.error
			$D.trace = console.trace
			$D.verbose_trace = $D._verbose_trace
		}
		else {
			$D.log = $D._log
			$D.warn = $D._warn
			$D.err = $D._err
			$D.trace = $D._trace
			$D.verbose_trace = $D._verbose_trace
		}
		$l = $D.log
	},
	/**
	 * Disables $D's methods
	 */
	disable: function() {
		$D.enabled = false
		
		(['log', 'warn', 'err', 'trace', 'verbose_trace']).each(function(m) {
			$D[m] = Prototype.emptyFunction
		})
	},

	/**
	 * Logs to the console. In firebug, links to the line number from 
	 * which the call was made. Aliased as {@link $l}.
	 * @function
	 * @param {Object} msg Object to log
	 */
	log: Prototype.emptyFunction,
	
	_log: function(msg) {
		console.log(msg)
	},
	
	/**
	 * Sends a warning to the console.
	 * @function
	 * @param {Object} msg Object to send with warning
	 */
	warn: Prototype.emptyFunction,
	
	_warn: function(msg) {
		console.warn(msg)
	},
	
	/**
	 * Sends a error to the console.
	 * @function
	 * @param {Object} msg Object to send with error
	 */
	err: Prototype.emptyFunction,
	
	_err: function(msg) {
		console.err(msg)
	},
	
	/**
	 * Sends a stack trace to the console.
	 * @function
	 */
	trace: Prototype.emptyFunction,
	
	_trace: function() {
		console.trace()
	},
	
	/**
	 * Sends a descriptive summary of an error to the console
	 * @param {Error} error The error to trace
	 */
	verbose_trace: Prototype.emptyFunction,
	
	_verbose_trace: function(error) {
		console.log("An exception occurred in the script. Error name: "
		            + error.name + ". Error description: " + error.description +
					". Error number: " + error.number + ". Error message: " + 
					error.message + ". Line number: "+ error.lineNumber)
	},
	
	/**
	 * Returns the number of nodes, ways, and relations currently drawn.
	 * @type number
	 */
	object_count: function() {
		return $D.node_count() + $D.way_count() + $D.relation_count()
	},
	
	/**
	 * Returns the number of ways currently being drawn
	 * @type Number
	 */
	way_count: function() {
		return Data.current_features.findAll(
		           function(o){return o.get_type() == 'Way'}).length
	},

	/**
	 * Returns the number of ways currently being drawn
	 * @type Number
	 */	
	relation_count: function() {
		return Data.current_features.findAll(
		           function(o){return o.get_type() == 'Relation'}).length
	},
	
	/**
	 * Returns the number of ways currently being drawn
	 * @type Number
	 */
	node_count: function() {
		var c = 0
		Geohash.current_features.each(function(o) {
			c += o.nodes.length
		})
		return c
	}
}

/**
 * Alias for $D.log
 */
$l = $D.log
