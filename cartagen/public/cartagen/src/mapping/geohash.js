/**
 * @namespace Contains methods and variables for spacially indexing features
 *            using geohashes.
 */
var Geohash = {}

Object.extend(Geohash, Enumerable)

Object.extend(Geohash, 
/** @lends Geohash */
{
	/**
	 * If true, a grid of geohashes is drawn on the map
	 * @type Boolean
	 */
	grid: false,
	/**
	 * Color of the grid of geohashes to be drawn on the map
	 * @type String
	 */
	grid_color: 'black',
	/**
	 * Default length for a geohash, if none is specified or calculated. Note that
	 * put_object() will automatically calculate an appropriate geohash for the feature,
	 * so this only affects put().
	 * @type Number
	 */
	default_length: 6, // default length of geohash
	/**
	 * The largest allowable geohash length
	 * @type Number
	 */
	limit_bottom: 8, // 12 is most ever...
	/**
	 * Binds to events
	 */
	init: function() {
		$('canvas').observe('cartagen:postdraw', this.draw_bboxes.bindAsEventListener(this))
	},
	/**
	 * Generates a geohash.
	 * @param {Number} lat    Latitude to hash
	 * @param {Number} lon    Longitude to hash
	 * @param {Number} length Length of hash
	 * @return The generated geohash, truncated to the specified length
	 * @type String
	 */
	get_key: function(lat,lon,length) {
		if (!length) length = this.default_length
		if (length < 1) length = 1
		
		return encodeGeoHash(lat,lon).truncate(length,'')
	},
	/**
	 * Populates a hash with the key given and all shorter keys. Can either create a new hash or
	 * modify an existing hash.
	 * @param  {String}                   key    Geohash key to start from
	 * @param  {Hash (String -> Boolean)} [hash] If given, this hash will b edited rather than a new
	 *                                           one created.
	 * @return Hash (String -> Boolean)
	 */
	get_keys_upward: function(key, hash) {
		hash = hash || new Hash()
		
		hash.set(key, true)
		
		if (key.length > 1) {
			return this.get_keys_upward(key.truncate(key.length-1, ''), hash)
		}
		else return hash
	},
	/**
	 * Gets the four neighboring keys of the specified key, not including diagonal neighbors.
	 * @param {String} key Central geohash
	 * @return Array of neighbors, starting from the key directly above the central key and
	 *         proceeding clockwise.
	 * @type String[]
	 */
	get_four_neighbor_keys: function(key) {
		var top = calculateAdjacent(key, 'top')
		var bottom = calculateAdjacent(key, 'bottom')
		var left = calculateAdjacent(key, 'left')
		var right = calculateAdjacent(key, 'right')
		return [top, right, bottom, left]
	},
	/**
	 * Gets the eight neighboring keys of the specified key, including diagonal neighbors.
	 * @param {String} key Central geohash
	 * @return Array of neighbors, starting from the key directly above the central key and
	 *         proceeding clockwise.
	 * @type String[]
	 */
	get_eight_neighbor_keys: function(key) {
		var four = this.get_four_neighbor_keys(key)
		var top = four[0], right = four[1], bottom = four[2], left = four[3]
		var top_left = calculateAdjacent(top, 'left')
		var top_right = calculateAdjacent(top, 'right')
		var bottom_left = calculateAdjacent(bottom, 'left')
		var bottom_right = calculateAdjacent(bottom, 'right')
		return [top, top_right, right, bottom_right, bottom, bottom_left, left, top_left]
	},
	/**
	 * Given a geohash key, recurses outwards to neighbors while still within the viewport. Can
	 * either create a new hash or modify an existing hash.
	 * @param {String}                   key    Central geohash
	 * @param {Hash (String -> Boolean)} [keys] If given, this hash will be modified rather than a
	 *                                          new one created
	 **/
	fill_bbox: function(key, keys) {
		keys = keys || new Hash()
		
		// we may be able to improve efficiency by only checking certain directions
		this.get_eight_neighbor_keys(key).each(function(k) {
			if (!keys.get(k)) {
				keys.set(k, true)
				
				// if still inside viewport:
				var bbox = decodeGeoHash(k) //[lon1, lat2, lon2, lat1]
				if (Math.in_range(bbox.latitude[0],Map.bbox[3],Map.bbox[1]) &&
					Math.in_range(bbox.latitude[1],Map.bbox[3],Map.bbox[1]) &&
				    Math.in_range(bbox.longitude[0],Map.bbox[0],Map.bbox[2]) &&
					Math.in_range(bbox.longitude[1],Map.bbox[0],Map.bbox[2])) {
						
						this.fill_bbox(k,keys)
				}
			}
		}, this)
		
		return keys
	},
	/**
	 * Returns the bounding box of a geohash
	 * @param {String} geohash Geohash to get bounding box of
	 * @return Bounding box of geohash, in [lon_1, lat_2, lon_ 2, lat_1] format
	 * @type Number[]
	 */
	bbox: function(geohash) {
		var geo = decodeGeoHash(geohash)
		return [geo.longitude[0],geo.latitude[1],geo.longitude[1],geo.latitude[0],geohash]
	},
	/**
	 * Draws the bounding box of a geohash
	 * @param {String} key Geohash to draw bounding box of 
	 */
	draw_bbox: function(key) {
		var bbox = this.bbox(key)

		var line_width = 1/Map.zoom
		// line_width < 1
		$C.line_width(Math.max(line_width,1))
		$C.stroke_style(this.grid_color)

		var width = Projection.lon_to_x(bbox[2]) - Projection.lon_to_x(bbox[0])
		var height = Projection.lat_to_y(bbox[1]) - Projection.lat_to_y(bbox[3])

		$C.stroke_rect(Projection.lon_to_x(bbox[0]),
					   Projection.lat_to_y(bbox[3]),
					   width,
					   height)
		$C.save()
		$C.translate(Projection.lon_to_x(bbox[0]),Projection.lat_to_y(bbox[3]))
		$C.fill_style(Object.value(this.fontBackground))
		var height = 16 / Map.zoom
		var width = $C.measure_text('Lucida Grande', 
		                            height,
		                            key)
		var padding = 2
		// $C.fill_style('white')
		// $C.rect(-padding/2, 
		// 		-(height + padding/2), 
		// 		width + padding + 3/Map.zoom,
		//         height + padding - 3/Map.zoom)
		$C.draw_text('Lucida Grande',
					 height,
					 this.grid_color,
					 3/Map.zoom,
					 -3/Map.zoom,
					 key)
		$C.restore()
	},
	/**
	 * Draws boxes around each geohash currently being drawn if Geohash.grid is
	 * set to true.
	 */
	draw_bboxes: function() {
		if (Geohash.grid) {
			Data.current_keys.keys().each(function(key){
				Geohash.draw_bbox(key)
			})
		}
	},
	/**
	 * Gets an appropriate key length for a ceratin size of feature
	 * @param {Object} lat Width, in degrees of latitude, of feature
	 * @param {Object} lon Height, in degrees of longitude, of feature
	 * @return Appropriate length of key
	 * @type Number
	 */
	get_key_length: function(lat,lon) {
		if      (lon < 0.0000003357) lon_key = 12
		else if (lon < 0.000001341)  lon_key = 11
		else if (lon < 0.00001072)   lon_key = 10
		else if (lon < 0.00004291)   lon_key = 9
		else if (lon < 0.0003433)    lon_key = 8
		else if (lon < 0.001373)     lon_key = 7
		else if (lon < 0.01098)      lon_key = 6
		else if (lon < 0.04394)      lon_key = 5
		else if (lon < 0.3515)       lon_key = 4
		else if (lon < 1.406)        lon_key = 3
		else if (lon < 11.25)        lon_key = 2
		else if (lon < 45)           lon_key = 1
		else                         lon_key = 0 // eventually we can map the whole planet at once
		
		if      (lat < 0.0000001676) lat_key = 12
		else if (lat < 0.000001341)  lat_key = 11
		else if (lat < 0.000005364)  lat_key = 10
		else if (lat < 0.00004291)   lat_key = 9
		else if (lat < 0.0001716)    lat_key = 8
		else if (lat < 0.001373)     lat_key = 7
		else if (lat < 0.005493)     lat_key = 6
		else if (lat < 0.04394)      lat_key = 5
		else if (lat < 0.1757)       lat_key = 4
		else if (lat < 1.40625)      lat_key = 3
		else if (lat < 5.625)        lat_key = 2
		else if (lat < 45)           lat_key = 1
		else                         lat_key = 0 // eventually we can map the whole planet at once
		
		return Math.min(lat_key,lon_key)
	},
})

document.observe('cartagen:init', Geohash.init.bindAsEventListener(Geohash))
