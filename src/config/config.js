var Config = {
	// See http://wiki.cartagen.org/wiki/show/CustomizingCartagen for info on the config options
	stylesheet: "/style.gss",
	tiles: false,
	vectors: true,
	live: false,
	powersave: true,
	zoom_out_limit: 0.02,
	simplify: 1,
	padding_top: 0,
	padding_left: 0,
	live_gss: false,
	static_map: true,
	static_map_layers: ["/static/rome/park.js"],
    layered_map: false,
    layers: [],
	/**
	 * Array of files to load after Cartagen's initialization
	 * @deprecated
	 */
	dynamic_layers: [],
	lat: 41.89685,
	lng: 12.49715,
	fullscreen: false,
	debug: false,
	load_user_features: false,
	aliases: $H({
		stylesheet: ['gss'],
		zoom_level: ['zoom']
	}),
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
		}
	}),
	init: function(config) {
		// stores passed configs and query string configs in the Config object
		Object.extend(this, config)
		Object.extend(this, this.get_url_params())	
	
		this.apply_aliases()
		
		this.run_handlers()
	},
	get_url_params: function() {
		params = window.location.href.toQueryParams()
		$H(params).each(function(param){
			if (param.value == 'true') params[param.key] = true
			if (param.value == 'false') params[param.key] = false
		})
		return params
	},
	apply_aliases: function() {
		this.aliases.each(function(pair) {
			pair.value.each(function(value) {
				if (this[value]) this[pair.key] = this[value]
			}, this)
		}, this)
	},
	run_handlers: function() {
		this.handlers.each(Config.run_handler)
	},
	run_handler: function(handler) {
		if (Config[handler.key]) handler.value(Config[handler.key])
	}
}


