var Node = Class.create(Feature, 
/**
 * @lends Node#
 */
{
	__type__: 'Node',
	/**
	 * Sets the default radius and invokes Feature#initialize
	 * 
	 * @class Represents a node. It can either be standalone or part of a way. By default,
	 *        it is not draw. To force it to be draw, manually add it to the geohash index.
	 * 
	 * @augments Feature
	 * @constructs
	 */
	initialize: function($super) {
		$super()
	},
	/**
	 * Invokes Feature#draw
	 */
	draw: function($super) {
		$super()
	},
	/**
	 * Draws this node
	 */
	shape: function() {
		$C.begin_path()
		$C.translate(this.x, this.y-this.radius)
		$C.arc(0, this.radius, this.radius, 0, Math.PI*2, true)
		$C.fill()
		$C.stroke()
	},
	/**
	 * Applies default Feature and Node styles to this Node.
	 */
	apply_default_styles: function($super) {
		$super()
		/**
		 * The radius, in pixels, of this node.
		 * @type Number
		 */
		this.radius = 6
	},
	/**
	 * Applies default styles, then re-applies styles from GSS.
	 */
	refresh_styles: function() {
		this.apply_default_styles()
		Style.parse_styles(this, Style.styles.node)
	}
})
