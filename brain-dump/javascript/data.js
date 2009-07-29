// Feature quota, for get_features()

var quota = Geohash.feature_quota()

var lengths = {}
this.keys.keys().each(function(key) {
	if (!lengths[key.length]) lengths[key.length] = []

	lengths[key.length].push(Geohash.get_from_key(key))
})

for (i = 1; i <= this.key_length && quota > 0; ++i) {
	var features = lengths[i].flatten()
	if (quota >= features.length) {
		this.objects = this.objects.concat(features)
		quota -= features.length
	}
	else {
		j = 0
		while (quota > 0) {
			var o = lengths[i][j % (lengths[i].length)].shift()
			if (o) this.objects.push(o)
			++j
			--quota
		}
	}
}
			
/**
 * Calculates the appropritate density of features based on the hardware' power (estimated by screen
 * resolution).
 * @return The density, in features per 1,000 square pixels.
 */
feature_density: function() {
	return 2 * Viewport.power()
},
/**
 * Calculates the number of features that should be drawn.
 */
feature_quota: function() {
	return ((Glop.width * Glop.height) * (Geohash.feature_density() / 1000)).round()
},
