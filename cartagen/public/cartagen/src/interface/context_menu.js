/**
 * Manages Cartagen's context menu
 * @namespace
 */
var ContextMenu = {
	/**
	 * unique id used to track context menu items
	 * @ignore
	 */
	_uid: 1,
	/**
	 * Object that stores id -> callback function pairs for each menu item that appears/disappears,
	 * for example, context menu items that are only active if your mouse is over a building.
	 */
	cond_items: {},
	/**
	 * Initializes the context menu. 
	 */
	init: function() {
		this.menu = new Control.ContextMenu('canvas')
	},
	/**
	 * Adds a conditional context menu item. Bu default, it is hidden. To show/hide it, use
	 * {@link ContextMenu.show} and {@link ContextMenu.hide}.
	 * 
	 * @param {String} name       Text to label the item with
	 * @param {Function} callback Function to execute when menu item is clicked
	 * 
	 * @return ID of menu item
	 * @type   Number
	 */
	add_cond_item: function(name, callback) {
		var id = ContextMenu._uid++
		
		callback.avail = false
		callback.context = window
		ContextMenu.cond_items[id] = callback

		this.menu.addItem({
				label: name,
				callback: function() {
					(ContextMenu.cond_items[id].bind(ContextMenu.cond_items[id].context))()
				},
				condition: function() {
					return ContextMenu.cond_items[id].avail
				}
		})
		
		return id
	},
	/**
	 * Shows a conditional context menu item
	 * 
	 * @param {Number} id        Id (returned by {@link ContextMenu.add_cond_item}) of menu item
	 * @param {Object} [context] Scope in which to execute the menu item's callback function. If
	 *                           omitted, the callback function in executed in the global (window)
	 *                           scope.
	 */
	show: function(id, context) {
		ContextMenu.cond_items[id].avail = true
		ContextMenu.cond_items[id].context = context || window
	},
	/**
	 * Hides a conditional context menu item
	 * 
	 * @param {Number} id Id (returned by {@link ContextMenu.add_cond_item}) of menu item
	 */
	hide: function(id) {
		ContextMenu.cond_items[id].avail = false
	},
	/**
	 * Adds a static (always-visible) item to the context menu).
	 * 
	 * @param {String} name       Text to label the item with
	 * @param {Function} callback Function to execute when menu item is clicked
	 */
	add_static_item: function(name, callback) {
		this.menu.addItem({
			label: name,
			callback: callback,
		})
	}
}

document.observe('cartagen:init', ContextMenu.init.bindAsEventListener(ContextMenu))
