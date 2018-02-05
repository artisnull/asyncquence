const Task = require('./task')

/*
execImmediate
  true: when first Task is added, it will be executed
  false: the start() method is called to begin execution
cancelOnError
  true: an error during execution will stop the rest of the sequence from completing
  false: an error during execution is reported, but the sequence continues to the next Task
passPrevValue
  true: the result of the last Task is passed as the last argument to the next Task
  false: each Task is executed independently
silent
  true: silences default event messages
  false: default events are logged to console
 */

const DEFAULT_CONFIG = {
  execImmediate: true,
  cancelOnError: false,
  passPrevValue: false,
  silent: false
}

const events = [
  'STATUS_CHANGE',
  'START',
  'PROGRESS',
  'COMPLETE',
  'PAUSE',
  'RESUME',
  'CANCEL',
  'ERROR'
]

class Asyncquence {
  constructor (options) {
    this._config = {
      ...DEFAULT_CONFIG,
      ...options
    }

    this._map = new Map()
    this._eventListeners = new Map()
    this._setupEvents()
    this._setDefaults()
  }

  _setupEvents () {
    const ev = this._eventListeners
    events.forEach((event) => {
      ev.set(event, [])
    })
  }

  _setDefaults () {
    this._remaining = 0
    this._completed = 0
    this._length = 0
    this._isPaused = false
    this._isCancelled = false
    this._isRunning = false
  }

  get HEAD () {
    return this._map.get('HEAD')
  }

  set HEAD (task) {
    this._map.set('HEAD', task)
  }

  get TAIL () {
    return this._map.get('TAIL')
  }

  set TAIL (task) {
    this._map.set('TAIL', task)
  }

  get status () {
    if (this._isPaused) {
      return 'PAUSED'
    } else if (this.HEAD && !this._config.execImmediate && !this._isRunning) {
      return 'READY'
    } else if (this._isRunning) {
      return 'RUNNING'
    } else {
      return 'STOPPED'
    }
  }

  // Default Event handlers

  onComplete () {
    if (!this._config.silent) {
      console.log('Asyncquence Completed')
    }
    return null
  }

  onStart () {
    if (!this._config.silent) {
      console.log('Starting Asyncquence')
    }
    return null
  }

  onProgress () {
    if (!this._config.silent) {
      console.log('--progress: ' + this._calcPercent())
      if (this._isPaused) {
        console.log(`Asyncquence paused | Completed: ${this._completed} :: Remaining: ${this._remaining}`)
      }
    }
    return null
  }

  onPause () {
    if (!this._config.silent) {
      console.log('Pausing after current operation completes')
    }
    return null
  }

  onResume () {
    if (!this._config.silent) {
      console.log(`Asyncquence resuming | Completed: ${this._completed} :: Remaining: ${this._remaining}`)
    }
    return null
  }

  onCancel () {
    if (!this._config.silent) {
      console.log('Cancelling Asyncquence...')
    }
    return null
  }

  onError (e, task) {
    if (!this._config.silent) {
      console.log('Error in Asyncquence')
    }
    return null
  }

  addEventListener (event, cb) {
    let currListeners = this._eventListeners.get(event) || []
    this._eventListeners.set(event, [...currListeners, cb])
  }

  removeEventListener (event, cb) {
    let currListeners = this._eventListeners.get(event) || []
    let i = currListeners.indexOf(cb)
    if (i < 0) {
      return
    }
    let updatedListeners = [...currListeners]
    updatedListeners.splice(i, 1)
    this._eventListeners.set(event, updatedListeners)
  }

  clearEventListeners () {
    this._eventListeners.clear()
    this._setupEvents()
  }

  _emit (event, data) {
    this._eventListeners.get(event).forEach((cb) => {
      cb(data)
    })
  }

  _addAll (arrOfTasks) {
    let results = []

    for (let task of arrOfTasks) {
      results[results.length] = this._buildTask(task)
    }
    return results
  }

  add (task) {
    if (this.status === 'STOPPED') {
      this._emit('STATUS_CHANGE', 'READY')
    }
    // Convert to array if necessary
    if (Array.isArray(task)) {
      return this._addAll(task)
    }

    return this._buildTask(task)
  }

  _buildTask (task) {
    let result
    let configTask
    if (Array.isArray(task)) {
      configTask = {
        'method': task[0],
        'args': task[1]
      }
    } else {
      configTask = task
    }
    // Create Task from object
    let newTask = new Task(configTask)
    let P = new Promise((resolve, reject) => {
      newTask.setPromise(resolve, reject)
    })
    result = P
    // Add to sequence
    this._remaining++
    this._length++

    // Chain if HEAD exists, or create new HEAD if not
    if (this.HEAD) {
      this.TAIL.chain(newTask)
      this.TAIL = newTask
    } else {
      this.HEAD = this.TAIL = newTask
      // If in immediate start mode, start on first add
      if (this._config.execImmediate) {
        this.start()
      }
    }
    return result
  }

  start () {
    if (this.HEAD) {
      this._isRunning = true
      this._execute(this.HEAD)
      this.onStart()
      this._emit('START')
      this._emit('STATUS_CHANGE', 'RUNNING')
    } else {
      throw new Error('start() called on empty asyncquence')
    }
  }

  _reset () {
    this._map.delete('HEAD')
    this._map.delete('TAIL')
    this._setDefaults()
  }

  pause () {
    if (this.status !== 'RUNNING') {
      console.warn('Warning: Called pause when asyncquence wasn\'t running')
      return
    }
    this._emit('STATUS_CHANGE', 'PAUSED')
    this._emit('PAUSE', this.HEAD)
    this._isPaused = true
    this._isRunning = false
    this.onPause()
  }

  resume () {
    if (this.status !== 'PAUSED') {
      console.warn('Warning: Called resume when asyncquence wasn\'t paused')
      return
    }
    this._emit('RESUME', this.HEAD)
    this._isPaused = false
    this.onResume()
    this.start()
  }

  cancel () {
    this._emit('CANCEL')
    this._emit('STATUS_CHANGE', 'STOPPED')
    this._isCancelled = true
    this.onCancel()
  }

  clear () {
    this._reset()
    this.clearEventListeners()
  }

  _progress (task) {
    this._remaining--
    this._completed++
    this._emit('PROGRESS', {
      remaining: this._remaining,
      completed: this._completed,
      percentComplete: this._calcPercent()
    })
    this.onProgress()
  }

  _calcPercent () {
    return Math.round((this._completed / this._length) * 100) + '%'
  }

  _execute (task, data = null) {
    if (this._isCancelled) {
      this._reset()
      return
    } else if (this._config.passPrevValue) {
      task.addArg(data)
    }
    return new Promise((resolve, reject) => {
      task.execute().then((data) => {
        if (this._isCancelled) {
          this._reset()
          return
        }
        resolve(data)
        this._continue(task, data)
      }).catch((e) => {
        this._emit('ERROR', e)
        this.onError(e, task)
        if (this._config.cancelOnError) {
          this.cancel()
          this._reset()
        } else {
          this._continue(task, null, e)
        }
      })
    })
  }

  _continue (task, data = null, error = null) {
    if (error) {
      task.reject(error)
    } else {
      task.resolve(data)
    }
    this._progress(task)
    if (task.next) {
      this.HEAD = task.next
      if (!this._isPaused) {
        this._execute(task.next, data)
      }
    } else {
      this._emit('COMPLETE')
      this._emit('STATUS_CHANGE', 'STOPPED')
      this._reset()
      this.onComplete()
    }
  }
}
module.exports = Asyncquence
