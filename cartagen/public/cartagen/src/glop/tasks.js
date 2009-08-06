/**
 * Manages long-running tasks; breaks them up to avoid stalling the UI;
 * uses Web Workers where available.
 * @class
 */
var TaskManager = Class.create(
/**
 * @lends TaskManager#
 */
{
	/**
	 * Sets up the TaskManager and starts it
	 * @param {Object} quota Time quota for this TaskManager. See
	 *                       {@link TaskManager#quota}
	 * @param {Object} tasks Tasks this TaskManager should manage. See
	 *                       {@link TaskManager#tasks}
	 */
	initialize: function(quota, tasks) {
		/**
		 * Amount of time, in miliseconds, allocated to the TaskManager each frame.
		 */
		this.quota = quota
		
		/**
		 * Tasks to be performed; each is a Task object with members
		 */
		this.tasks = tasks || []
		
		/**
		 * Percent of tasks completed
		 */
		this.completed = 0
		
		// This could support Web Workers
		//this.workers = []
		
		/**
		 * The bound version of {@see TaskManager#run}, used for event
		 * event callbacks.
		 */
		this.listener = this.run.bindAsEventListener(this)
		
		this.start()
	},
	/**
	 * Runs a single processing cycle.
	 */ 
	run: function() {
		var i = 0
		var start_time = new Date().getTime()
		var cur_tasks = []
		var r, task
		
		for (var j = 0; j < this.tasks.length; j++) {
			if (this.tasks[j].pass_condition()) {
				cur_tasks.push(this.tasks[j])
			}
		}
		
		while (cur_tasks.length > 0 && (new Date().getTime() - start_time) < this.quota) {
			task = cur_tasks[(i++) % cur_tasks.length]
			r = task.exec_next()
			if (r === false) {
				this.tasks = this.tasks.without(task)
				cur_tasks = cur_tasks.without(task)
			}
		}
		
		this.get_completed(cur_tasks)
		
		Data.get_features()
		Glop.trigger_draw()
		
		if (this.tasks.length < 1) this.stop()
	},
	/**
	 * Adds a Task to this TaskManager and starts it if it is stopped.
	 * @param {Task} task
	 */
	add: function(task) {
		this.tasks.push(task)
		
		if (!this.active) this.start()
	},
	/**
	 * Starts processing tasks when glop:predraw is fired.
	 */
	start: function() {
		this.active = true
		$('canvas').observe('glop:predraw', this.listener)
	},
	/**
	 * Stops processing tasks
	 */
	stop: function() {
		this.active = false
		$('canvas').stopObserving('glop:predraw', this.listener)
	},
	/**
	 * Calculates the percent completed. Do not call this directly to get
	 * percent completed; just read {@link TaskManager#completed}.
	 * @param {Task[]} tasks Tasks to calculate percentage from.
	 */
	get_completed: function(tasks) {
		var total = 0
		var left = 0
		for (var i = 0; i < tasks.length; ++i) {
			total += tasks[i].total_members
			left += tasks[i].members.length
		}
		this.completed = ((total-left)/total) * 100
	}
})

/**
 * Contains a single task made up of a list of members to be
 * processed and a process() function to apply to them
 * @class
 */
var Task = Class.create(
/**
 * @lends Task#
 */
{
	/**
	 * Sets up the Task.
	 * @param {Object[]}           members     See {@link Task#members}
	 * @param {Object}             process     See {@link Task#process}
	 * @param {Function | Boolean} [condition] See {@link Task#condition}.
	 *                                         Defaults to true.
	 * @param {Task[]}             [deps]      See {@link Task#deps} Defaults to
	 *                                         [].
	 *                                         
	 * @property {Number} id Unique task id for this Task.
	 */
	initialize: function(members, process, condition, deps) {
		/**
		 * A list of values upon which to perform the "process" function
		 * @type Object[]
		 */ 
		this.members = members || []
		/**
		 * Number of members this Task was initialized with.
		 */
		this.total_members = members.length || 0
		/**
		 * A function to process objects with
		 * @type Function
		 */
		this.process = process || Prototype.emptyFunction
		
		if (Object.isUndefined(condition)) condition = true
		/**
		 * A function that returns a boolean or a static boolean that determines
		 * whther the task should be run.
		 * @type Function | Boolean
		 */		
		this.condition = condition
	
		Task.register(this)
		
		/**
		 * An array of tasks that
		 */
		this.deps = deps || []
	},
	/**
	 * Process the next member
	 */
	exec_next: function() {
		if (!this.should_run()) return true
		
		this.process(this.members.shift())
		
		if (this.members.length > 0) return true
		else {
			Task.complete(this.id)
			return false
		}
	},
	/**
	 * Determines whether this task should run. Checks both
	 * {@link Task#pass_condition} and dependencies
	 */
	should_run: function() {
		if (!this.pass_condition) return false
		
		for (var i = 0; i < this.deps.length; i++) {
			if (Task.is_done(this.deps[i]) === false) {
				return false
			}
		}
		
		return true
	},
	/**
	 * Determines whether this Task passes its condition.
	 * @see Task#condition
	 */
	pass_condition: function() {
		if (Object.value(this.condition, this) === false) return false
		
		return true
	},
})

/**
 * The lowest available unique id for Tasks
 * @type Number
 * @static
 */
Task.cur_uid = 1
/**
 * Registry of tasks and whether they are done, indexed by id. Used for
 * dependancy resolution. Keys are Task ids and values are whether the task
 * is done.
 * @type Object (Hash-like, Number -> Boolean)
 * @static
 */
Task.registry = {}
/**
 * Registers a task, marking it as incomplete and setting the Tasks's id.
 * @param {Task} task
 * @static
 */
Task.register = function(task) {
	task.id = Task.cur_uid++
	Task.registry[task.id] = false
}
/**
 * Marks a task as complete
 * @param {Number} id Task id
 * @static
 */
Task.complete = function(id) {
	Task.registry[id] = true
}
/**
 * Determines whether a Task is done
 * @param {Number} id Task id
 * @static
 */
Task.is_done = function(id) {
	return Task.registry[id]
}
