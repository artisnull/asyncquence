class Task {
  constructor (config) {
    if (config.method == null) {
      throw new Error('No method found. To add task: asq.add({method: func, args: []}), or asq.add([func, args])')
    }
    this._args = []
    this._method = null

    for (var key in config) {
      if (config.hasOwnProperty(key)) {
        this['_' + key] = config[key]
      }
    }
    this._resolve = () => null
    this._reject = () => null
  }

  chain (task) {
    this._next = task
  }

  setPromise (res, rej) {
    this._resolve = res
    this._reject = rej
  }

  addArg (newArg) {
    this._args = this._args ? [...this._args, newArg] : [newArg]
  }

  reject (err) {
    this._reject(err)
  }

  resolve (data) {
    this._resolve(data)
  }

  get next () {
    if (this._next == null) {
      return false
    }
    return this._next
  }

  execute () {
    const {_method, _args} = this
    return Promise.resolve(_method(..._args))
  }
}

module.exports = Task
