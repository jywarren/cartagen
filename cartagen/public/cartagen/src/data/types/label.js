var Label = Class.create(
/**
 * @lends Label#
 */
{
	/**
	 * Sets the default label properties and owner.
	 * @param {Feature} owner
	 * 
	 * @class Represents a label for a Feature.
	 * 
	 * @constructs
	 */
    initialize: function(owner) {

		/**
		 * The parent feature that this label belongs to
		 * @type Feature
		 */
        this.owner = owner
    },
	/**
	 * Draws this label at the specified position
	 * @param {Number} x
	 * @param {Number} y
	 */
    draw: function(x, y) {
        if (this.text) {
            $C.save()

            $C.stroke_style(this.fontColor)

			//rotate the labels on unclosed ways:
			if (!Object.isUndefined(this.owner.closed_poly) && !this.owner.closed_poly) {
				$C.translate(x, y)
				$C.rotate(this.owner.middle_segment_angle())
				$C.translate(-x, -y)
			}
			
			if (this.fontRotation) {
				$C.translate(x, y)
				if (this.fontRotation == "fixed") {
					$C.rotate(-Map.rotate)
				} else if (Object.isNumber(this.fontRotation)) {
					$C.rotate(this.fontRotation)
				}
				$C.translate(-x, -y)
			}
			
			if (this.fontScale == "fixed") {
				var height = this.fontSize
				var padding = this.padding
			} else {
				var height = this.fontSize / Map.zoom
				var padding = this.padding / Map.zoom
			}


			var width = $C.measure_text(this.fontFamily,
			                            height,
			                            Object.value(this.text, this.owner))

			// $l('width: ' + width)
			if (this.fontBackground) {
				$C.fill_style(this.fontBackground)
				$C.rect(x - (width + padding)/2, 
						y - (height/2 + padding/2), 
						width + padding,
				        height + padding)
			}
			
			$C.draw_text(this.fontFamily,
			             height,
						 this.fontColor,
			             x - width/2,
						 y + height/2,
						 this.text)
			$C.restore()
        }
    },
	/**
	 * Applies default styles to this Label
	 */
	apply_default_styles: function() {
		this.fontFamily = 'Lucida Grande, sans-serif'
	    this.fontSize = 11
	    this.fontBackground = null
	    this.text = null
	    this.fontScale = false
	    this.padding = 6
	    this.fontColor = '#eee'
		this.fontRotation = 0
	}
})
