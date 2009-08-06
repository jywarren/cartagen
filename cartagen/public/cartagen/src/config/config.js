/**
 * @namespace Stores configuration options -- unifies options passed to
 *            Cartagen.setup and GET parameters.
 *            See <a href="http://wiki.cartagen.org/wiki/show/CustomizingCartagen">
 *            the wiki</a> for info on the config options.
 */
var Config = {
	stylesheet: "/style.gss",
    live: false,
	powersave: true,
	zoom_out_limit: 0.02,
	simplify: 1,
	live_gss: false,
	static_map: true,
	static_map_layers: ["/static/rome/park.js"],
	/**
	 * Array of files to load after Cartagen's initialization
	 * @deprecated
	 * @ignore
	 */
	dynamic_layers: [],
	lat: 41.89685,
	lng: 12.49715,
	fullscreen: false,
	debug: false,
	load_user_features: false,
	/**
	 * Hash of cofiguration options and their aliases.
	 * @type Hash (String -> String[])
	 */
	aliases: $H({
		stylesheet: ['gss']
	}),
	/**
	 * Hash of config options handlers. If a handler is specified, and a configuration option is
	 * is specified as a non-false value, then the handler will be executed. Handlers are passed
	 * the value of the configuration option.
	 * @type Hash (String -> Function)
	 */
	handlers: $H({
		debug: function(value) {
			$D.enable()
			Geohash.grid = true
		},
		grid: function(value) {
			Geohash.grid = true
			if (Object.isString(value)) Geohash.grid_color = value
		},
		fullscreen: function(value) {
			if ($('brief')) $('brief').hide()
		},
		static_map_layers: function(value) {
			if (typeof value == "string") {
				Config.static_map_layers = value.split(',')
			}
		},
		zoom_level: function(value) {
			Map.zoom = value
		},
        key_input: function(value) {
            Keyboard.key_input = value
        }
	}),
	/**
	 * Applies passed configuration params and GET params to the Config object, appies aliases,
	 * and runs handlers.
	 * @param {Object} config Hash-like object of config parameters
	 */
	initialize: function(config) {
		// stores passed configs and query string configs in the Config object
		Object.extend(this, config)
		Object.extend(this, this.get_url_params())
		
		this.apply_aliases()
		
		this.run_handlers()
	},
	/**
	 * Returns a Hash-like object of GET parameters
	 * @return hash-like object
	 * @type Object
	 */
	get_url_params: function() {
		return window.location.href.toQueryParams()
	},
	/**
	 * Applies aliases specified in {@link Config.aliases}
	 */
	apply_aliases: function() {
		this.aliases.each(function(pair) {
			pair.value.each(function(value) {
				if (this[value]) this[pair.key] = this[value]
			}, this)
		}, this)
	},
	/**
	 * Applies handlers specified in {@link Config.handlers}
	 */
	run_handlers: function() {
		this.handlers.each(Config.run_handler)
	},
	/**
	 * Runs an individual handler. The passed handler should have two properties:
	 * "key", which should be the name of the actual config parameter, and "value",
	 * which should be an array of aliases.
	 * @param {Object} handler Object, as described above.
	 */
	run_handler: function(handler) {
		if (Config[handler.key]) handler.value(Config[handler.key])
	}
}


