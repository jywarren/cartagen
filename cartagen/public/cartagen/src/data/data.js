//= require "feature"

var Data = {}

Object.extend(Data, Enumerable)

Object.extend(Data, {
	/**
	 * Hash of node id => node
	 * @type Hash (String -> Node[])
	 */
	nodes: new Hash(),
	/**
	 * Hash of way id => way
	 * @type Hash (String -> Way[])
	 */
	ways: new Hash(),
	/**
	 * Hash of relation id => relation
	 * @type Hash (String -> Relation[])
	 */
	relations: new Hash(),
	/**
	 * Map of geohashes -> features
	 * @type Hash (String -> Feature[])
	 */
	geohash_index: new Hash(),
	/**
	 * Array of all objects that should be drawn for the current frame
	 * @type Feature[]
	 */
	current_features: [],
	/**
	 * A subset of Features.features that contains only features that should be drawn for
	 * the current frame.
	 * @type Hash (String -> Feature[])
	 */
	current_geohash_index: new Hash(),
	/**
	 * The keys that curent_features are in -- in other words, all of the geohashes in the viewport
	 * @type String[]
	 */
	current_keys: new Hash,
	/**
	 * Shortest length of geohashes in current_keys
	 */
	current_key_length: 0,
	/**
	 * Current central key
	 */
	current_central_key: '',
	/**
	 * Position when Geohash.get_objects() was last run. Has four properties, all numbers:
	 * x, y, zoom, and frame. x, y, and zoom are the x, y, and zoom of the map the last time
	 * get_features() was called, and frame was the frame number (Glop.frame) the last time
	 * get_features was called.
	 * 
	 * @type Object
	 */
	last_get_features: {
		x: 0,
		y: 0,
		zoom: 0,
		frame: 0
	},
	/**
	 * If set to true, current_features will be re-generated during the next frame, even if the
	 * user has not moved
	 * @type Boolean
	 */
	force_get_features: false,
	/**
	 * Frame the last plot was loaded on
	 */
	last_loaded_geohash_frame: 0,
	/**
	 * Binds draw() to cartagen:predraw
	 */
	init: function() {
		$('canvas').observe('cartagen:predraw', this.draw.bindAsEventListener(this))
	},
	/**
	 * Recalculates which geohashes to request based on the viewport; formerly called every 
	 * frame, but now only when viewport changes.
	 * @see Geohash.get_objects
	 */
	draw: function() {
		if (this.should_draw()) {
			this.get_features()
			this.force_get_features = false
		}
	},
	/**
	 * Determines whether the features to draw (Data.objects) should be re-generated, based on
	 * whether the viewport has moved significantly.
	 */
	should_draw: function() {
		return (
			// is a re-get forced?
			this.force_get_features || 
			// do we have no features yet?
			this.features.length == 0 || 
			// have we zoomed significantly? (more than 10%)
			Map.zoom / this.last_get_features.zoom > 1.1 || 
			Map.zoom / this.last_get_features.zoom < 0.9 ||
			// have we panned significantly? (more than 100 px) 
			Math.abs(this.last_get_features.x - Map.x) > 100 || 
			Math.abs(this.last_get_features.y - Map.y) > 100
		)
	},
	/**
	 * Adds a feature to a geohash index. Use put_object() to automatically
	 * calculate latitude, longitude, and appropriate geohash length.
	 * @param {Number}  lat      Latitude of feature
	 * @param {Number}  lon      Longitude of feature
	 * @param {Feature} feature  The feature
	 * @param {Number}  length   Length of geohash
	 * @see Data.put_object
	 */
	put: function(lat, lon, feature, length) {
		length = length || this.default_length
		var key = Geohash.get_key(lat, lon, length)
		
		// check to see if the geohash is already populated:
		var merge_hash = this.geohash_index.get(key)
		if (!merge_hash) {
			merge_hash = [feature]
		} else {
			merge_hash.push(feature)
		}
		
		this.geohash_index.set(key,merge_hash)
	},
	/**
	 * Puts a feature into the geohash index. Finds latitude and longitude from
	 * feature's x and y, and calculates an appropriate geohash based on
	 * size of feature and size of canvas. Use put() to manually specify latitude,
	 * longitude, and geohash length.
	 * @param {Feature} feature
	 * @see Geohash.put
	 * @see Geohash.get_key_length
	 */
	put_object: function(feature) {
		this.put(Projection.y_to_lat(feature.y),
		         Projection.x_to_lon(-feature.x),
		         feature,
		         Geohash.get_key_length(feature.width,feature.height))
	},
	/**
	 * Gets features in a geohash.
	 * @param {Number} key Geohash to find features from
	 * @return Features in the specified geohash, or an empty array
	 * @type Feature[]
	 * @see Geohash.get
	 * @see Geohash.get_upward
	 */
	get_features_by_key: function(key) {
		return this.geohash_index.get(key) || []
	},
	/**
	 * Gets features in a geohash, but only features that should be drawn in the current frame.
	 * @param {Number} key Geohash to find features from
	 * @return Features in the specified geohash, or an empty array
	 * @type Feature[]
	 * @see Geohash.get
	 * @see Geohash.get_upward
	 */
	get_current_features_by_key: function(key) {
		return this.current_geohash_index.get(key) || []
	},
	/**
	 * Fetch features in a geohash from a geohash key, and all shorter keys
	 * @param {Object} key Geohash to find features from
	 * @return Features in this and shorter geohashes, or an empty array
	 * @type Feature[]
	 */ 
	get_features_upward: function(key) {
		key.truncate(this.limit_bottom,'')
		
		var keys = Geohash.get_keys_upward(key).keys()
		var features = []
		
		keys.each(function(k) {
			features = features.concat(this.get_features_by_key(k))
		}, this)
	},
	/**
	 * Gets all features that should be drawn in the current frame that are in the specified
	 * key and all shorter keys.
	 * @param {String} key Geohash to look in
	 * @type Feature[]
	 */
	get_current_features_upward: function(key) {
		key.truncate(this.limit_bottom,'')
		
		var keys = Geohash.get_keys_upward(key).keys()
		var features = []
		
		keys.each(function(k) {
			features = features.concat(this.get_current_features_by_key(k))
		}, this)
	}, 
	/**
	 * Prints debugging information to the console
	 * @return Number of registered geohashes
	 * @type Number
	 */
	trace: function() {
		var lengths = new Hash
		this.geohash_index.keys().each(function(key) {
			$l(key+': '+this.get_features_by_key(key).length)
			
			if (!lengths.get(key.length)) lengths.set(key.length,0)
			lengths.set(key.length,lengths.get(key.length)+1)
		}, this)
		
		$l('Lengths >>')
		
		lengths.keys().sort().each(function(length) {
			$l(length+": "+lengths.get(length))
		})
		
		return this.geohash_index.size()
	},
	/**
	 * Generates Geohash.objects, populating it with the objects that
	 * should be drawn this frame.
	 * @return Geohash.objects, in reverse order
	 * @type Feature[]
	 * @see Geohash.objects
	 */
	get_features: function() {
		this.last_get_features = {
			x: Map.x,
			y: Map.y,
			zoom: Map.zoom,
			frame: Glop.frame
		}
		
		this.features = []

		// get geohash for each of the 4 corners,
		this.current_keys = new Hash
		
		this.current_key_length = Geohash.get_key_length(0.0015 / Map.zoom, 0.0015 / Map.zoom)
		
		this.current_central_key = Geohash.get_key(Map.lat, Map.lon, this.current_key_length)
		
		var bbox = decodeGeoHash(this.current_central_key) //[lon1, lat2, lon2, lat1]
		
		Geohash.fill_bbox(this.current_central_key, this.current_keys)

		this.current_keys.keys().each(function(key, index) {
			this.current_keys = Geohash.get_keys_upward(key, this.current_keys)
		}, this)

		var features
		this.current_keys.keys().each(function(key) {
			features = this.get_features_by_key(key)
			this.current_geohash_index.set(key, features)
			this.current_features = features.concat(this.current_features)
		}, this)
		
		this.sort_objects()
		return this.current_features
	},
	sort_objects: function() {
		this.current_features.sort(Geometry.sort_by_area)
	},
	/**
	 * Iterator for prototype.
	 */
	_each: function(f) {
		this.hash.each(function(pair) {
			pair.value.each(function(val) { f(val) })
		})
	}
})

document.observe('cartagen:init', Data.init.bindAsEventListener(Data))
