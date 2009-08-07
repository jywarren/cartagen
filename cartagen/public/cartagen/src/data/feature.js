var Feature = Class.create(
/** 
 * @lends Feature.prototype 
 */
{
	/**
	 * Sets defaults for tags, fillStyle, fontColor fontSize, and fontRotation
	 * 
	 * @class An abstract base class for map features - nodes and ways. Should
	 *        not be instantiated.
	 * 
	 * @constructs
	 */
	initialize: function() {
		this.tags = new Hash()
		/**
		 * Label for this way
		 * @type Label
		 */
		this.label = new Label(this)
		this.apply_default_styles()
	},
	/**
	 * Draws this feature using shape(). Saves/restores the canvas and applies styles. Queues
	 * this feature's label in the label drawing queue.
	 */
	draw: function() {
		$C.save()

		// apply styles

		$C.fill_style(this.fillStyle)

		if (this.pattern) {
			if (!this.pattern.src) {
				var value = this.pattern
				this.pattern = new Image()
				this.pattern.src = value
			}
			$C.fill_pattern(this.pattern, 'repeat')
		}

		$C.stroke_style(this.strokeStyle)
		$C.opacity(this.opacity)
		$C.line_width(this.lineWidth)

		// draw the shape
		this.shape()
		$C.restore()

		// draw label if we're zoomed in enough
		if (Map.zoom > 0.3) {
			Cartagen.queue_label(this.label, this.x, this.y)
		}
	},
	/**
	 * By default, does nothing, but can be overriden to perform mouseDown and hover styling
	 */
	style: Prototype.emptyFunction,
	/**
	 * Abstract method that should be overridden to draw the feature.
	 */
	shape: function() {
		$D.warn('Feature#shape should be overriden')
	},
	/**
	 * Applies GSS hover styles for this feature
	 * @see remove_hover_styles
	 */
	apply_hover_styles: function() {
		$H(this.hover).each(function(pair) {
			if (this[pair.key]) this._unhovered_styles[pair.key] = this[pair.key]
			this[pair.key] = pair.value
		}, this)
	},
	/**
	 * Removes GSS hover styles for this feature
	 * @see apply_hover_styles
	 */
	remove_hover_styles: function() {
		Object.extend(this, this._unhovered_styles)
	},
	/**
	 * Applies GSS mouseDown styles for this feature
	 * @see remove_click_styles
	 */
	apply_click_styles: function() {
		$H(this.mouseDown).each(function(pair) {
			if (this[pair.key]) this._unclicked_styles[pair.key] = this[pair.key]
			this[pair.key] = pair.value
		}, this)
	},
	/**
	 * Removes GSS mouseDown styles for this feature
	 * @see apply_click_styles
	 */
	remove_click_styles: function() {
		Object.extend(this, this._unclicked_styles)
	},
	/**
	 * Resets all styles to their defaults
	 */
	apply_default_styles: function() {
		this.fillStyle = 'rgba(0,0,0,0)'
		this.fontColor = '#eee'
		this.fontSize = 12
		this.fontRotation = 0
		this.opacity = 1
		this.strokeStyle = 'black'
		this.lineWidth = 6
		this.pattern = null
		this.outlineColor = null
		this.outlineWidth = null
		this.distort = false
		this.image = null
		this._unhovered_styles = {}
		this._unclicked_styles = {}
		this.label.apply_default_styles()
	},
	/**
	 * Returns the class of this Feature
	 * @return "Node", "Way", or "Relation"
	 * @type String
	 */
	get_type: function() {
		return this.__type__
	},
	/**
	 * Resets all styles, then re-applies GSS styles
	 */
	refresh_styles: function() {
		this.apply_default_styles()
	}
})

//= require "types/node"
//= require "types/way"
//= require "types/relation"
//= require "types/label"

//= require "coastline"
//= require "importer"
