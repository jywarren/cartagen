var Relation = Class.create(Feature, 
/**
 * @lends Relation#
 */
{
	__type__: 'Relation',
	/**
	 * Ways (and nodes, but that hasn't been implemented) that make up this relation
	 */
	members: [],
	/**
	 * Array of tuples [[x,y],[x,y]...] that make up this relation *within the Viewport*, generated by Relation.collect_nodes()
	 */
	coastline_nodes: [],
	/**
	 * Angle of the first node in coastline_nodes, measured from Map center
	 */
	entry_angle: 0,
	/**
	 * Sets up this relations's properties and adds it to the geohash index
	 * @param {Object} data     A set of properties that will be copied to this Way.
	 * 
	 * @class Represents a way. A way is automatically added to the geohash index when
	 *        it is instantiated.
	 * 
	 * @augments Feature
	 * @constructs
	 */
    initialize: function($super, data) {
		$super()
		
		this.id = Data.relations.size()
		/**
		 * Number of frames this Way has existed for
		 * @type Number
		 */
		this.age = 0
		/**
		 * If true, this way will have a red border
		 * @type Boolean
		 */
		this.highlight = false
		/**
		 * If true, this way will be treated a a polygon and filled when drawn
		 * @type Boolean
		 */
		this.coastline = true // because all relations are currently coastlines

		this.outline_color = null
		this.outline_width = null
		
		Object.extend(this, data)
		
		this.collect_ways()
		
		if (this.nodes.length > 1 && this.nodes.first().x == this.nodes.last().x && 
			this.nodes.first().y == this.nodes.last().y) 
				this.closed_poly = true
		
		if (this.tags.get('natural') == 'coastline') {
			this.coastline = true
		}
		if (this.tags.get('natural') == "land") this.island = true
		
		if (this.closed_poly) {
			var centroid = Geometry.poly_centroid(this.nodes)
			this.x = centroid[0]*2
			this.y = centroid[1]*2
		} else {
			// attempt to make letters follow line segments:
			this.x = (this.middle_segment()[0].x+this.middle_segment()[1].x)/2
			this.y = (this.middle_segment()[0].y+this.middle_segment()[1].y)/2
		}
		
		this.area = Geometry.poly_area(this.nodes)
		// $l(this.nodes)
		this.bbox = Geometry.calculate_bounding_box(this.nodes)
		
		// calculate longest dimension to file in a correct geohash:
		this.width = Math.abs(Projection.x_to_lon(this.bbox[1])-Projection.x_to_lon(this.bbox[3]))
		this.height = Math.abs(Projection.y_to_lat(this.bbox[0])-Projection.y_to_lat(this.bbox[2]))
		
		Style.parse_styles(this,Style.styles.relation)
		// Data.put_object(this)
		Datarelations.set('coastline_'+this.id,this)
    },
	/**
	 * Nodes of all member ways. Generated by Relation.collect_ways()
	 */
	nodes: [],
	/**
	 * Collected tags of all member ways. Generated by Relation.collect_ways()
	 */
	tags: new Hash(),
	/**
	 * Collects member ways into one long way.
	 */
	collect_ways: function() {
		this.members.each(function(member) {
			this.nodes = member.nodes.concat(this.nodes)
			if (member.tags.size() > 0) this.tags.merge(member.tags)
		},this)
	},
	/**
	 * Draws this way on the canvas
	 */
	draw: function($super) {
		$super()
		this.age += 1;
	},
	/** 
	 * Finds the middle-most line segment
	 * @return a tuple of nodes
	 * @type Node[]
	 */	
	 middle_segment: Way.prototype.middle_segment,
	/**
	 * Finds the angle of the middle-most line segment
	 * @return The angle, in radians
	 * @type Number
	 */
	 middle_segment_angle: Way.prototype.middle_segment_angle,
	/**
	 * Applies hover and mouseDown styles
	 */
	style: Way.prototype.style,
	/**
	 * Draws on the canvas to display this relation
	 */
	shape: function() {
		// removed for coastlines. Coastlines should be a sub-class
	},	
	/**
	 * Collects nodes to be drawn. This step was added to accommodate coastline relations
	 * (currently the only kind) and allows multiple relations to be drawn as a single closed poly
	 */
	collect_nodes: function() {
		var is_inside = true, last_index, prev_node_inside = null
		var enter_viewport = null,exit_viewport = null
		this.coastline_nodes = []

		this.nodes.each(function(node,index){
			is_inside = Geometry.overlaps(node.x,node.y,Map.x,Map.y,Viewport.width)
			// if we've crossed the Viewport boundary (needed to reconcile multiple unconnected coastlines):
			if (prev_node_inside != null && prev_node_inside != is_inside) {
				if (is_inside && this.coastline_nodes.length == 0) this.coastline_nodes.unshift([this.nodes[index-1].x,this.nodes[index-1].y])
			} else if (prev_node_inside == null && is_inside) {
				this.coastline_nodes.unshift([node.x,node.y])
				// check if the very fist node is inside already... 
				// this shouldn't be the case but could happen with incomplete map data
			}
			prev_node_inside = is_inside
			// add nodes which are in the viewport, betweeen enter_viewport and exit_viewport:
			if (is_inside) {
				this.coastline_nodes.push([node.x,node.y])
				last_index = index
			}
		},this)
		// add the last node... that's just outside the viewport:
		// this.coastline_nodes.push([this.nodes[last_index].x,this.nodes[last_index].y])
		
		// calculate angle (like on a clock face) of the point where the relation enters the viewport:
			// it actually uses the point just before it enters the viewport; this could be a problem
		this.entry_angle = Math.tan(Math.abs(this.coastline_nodes.first()[0]-Map.x)/(this.coastline_nodes.first()[1]-Map.y))
	},
	apply_default_styles: Feature.prototype.apply_default_styles,
	refresh_styles: function() {
		this.apply_default_styles()
		Style.parse_styles(this, Style.styles.relation)
	}
})
