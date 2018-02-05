asyncquence
---
#### Run synchronous and asynchronous functions in sequence, with hooks, value pass through, and more!
https://www.npmjs.com/package/@artisnull/asyncquence

---
### Key Features
* Executes and resolves functions in FIFO sequence, asynchronously
* You can add to the sequence whenever you want
* Add an array of functions, and it will be added in order into the sequence
* Emits lifecycle events such as START, PROGRESS, or ERROR
* Pause/Resume or Cancel whenever you want
* Pass the results of the previous task through to the next one
---
### Install
```
npm install @artisnull/asyncquence
```
---
### Sample usage
##### Basic:
```javascript
import Asyncquence from '@artisnull/asyncquence'
const asq = new Asyncquence()

const func1 = () => Promise.resolve(1)
const func2 = (x) => (x + 2)

const results = asq.add([
  [func1],
  [func2, [0]]
])

results[0].then(console.log) // 1
results[1].then(console.log) // 2
```
Add an array of tasks get an array of promises back in the order that we added the tasks. Pretty straightforward.  
##### With passthrough:
```javascript
const asq = new Asyncquence({
  passPrevValue: true
})

const func1 = () => Promise.resolve(4)
const func2 = (x) => (x + 10)

const results = asq.add([
  [func1],
  [func2]
])

results[0].then(console.log) // 4
results[1].then(console.log) // 14
```


---
Table of Contents
-  
[Reference](#reference)  
* [config](#config)  
* [Event](#events)  
* [Task](#task)

[API](#api)  
* [Asyncquence](#asq)  
* [add](#add)  
* [addEventListener](#ael)
* [cancel](#cancel)
* [clear](#clear)
* [clearEventListeners](#cel)
* [pause](#pause)
* [removeEventListener](#rel)
* [resume](#resume)
* [start](#start)

---
## Reference
#### config  
##### Defaults
```javascript
const DEFAULT_CONFIG = {
  execImmediate: true,
  cancelOnError: false,
  passPrevValue: false,
  silent: false
}
```
##### Description
* execImmediate
  * __true__: when first Task is added, it will be executed
  * __false__: the start() method is called to begin execution
* cancelOnError
  * __true__: an error during execution will stop the rest of the sequence from completing
  * __false__: an error during execution is reported via rejection and the error lifecycle event, but the sequence continues to the next Task
* passPrevValue
  * __true__: the result of the last Task is passed as the last argument to the next Task
  * __false__: each Task is executed independently
* silent
  * __true__: silences default event messages
  * __false__: default events are logged to console
---
#### Events
*Not all events pass an argument to the event listener*  
Format: EVENT_NAME: (argument)

---
##### STATUS_CHANGE : ('READY'|'PAUSED'|'RUNNING'|'STOPPED')
##### START
##### PROGRESS :
```javascript
{
  remaining: numRemaining // int
  completed: numCompleted // int
  percentComplete: percentString //String
}
```
##### COMPLETE
##### PAUSE : (nextTask)
##### RESUME : (nextTask)
##### CANCEL
##### ERROR: (err)
---
#### Task
The format of function and arguments that asyncquence expects.  
Can be one of the following:

```javascript
const Task = [fn, [args]]
// OR
const Task = {
  method: fn,
  args: [args]
}
```
> Adding single tasks is simpler: `asq.add(fn, [args])`
---

---
## API
<a id='asq'></a>

#### new Asyncquence([config](#config))  
Returns new Asyncquence instance with the specified config
```javascript
const asq = new Asyncquence()
```
---
<a id='add'></a>

#### add([Task](#task)) : Promise[]
#### add([[Task](#task),[...Tasks]]) : Promise[]
Adds a task(s) to the back of the queue to be executed. Returns an array of promises at indices corresponding to the index of each task added. See [Task](#task) for reference.

>Triggers `'READY'` status change when adding a task to an empty queue if [config](#config) option `execImmediate:false`  
>Triggers `START` [Event](#events) when adding a task to an empty queue if [config](#config) option `execImmediate:true`
```javascript
// Single task
const res = asq.add(Task) // res[0] has Promise for this task

// Multiple tasks
const res = asq.add([Task1, Task2]) // res[0] for Task1, res[1] for Task2
```
---
<a id='ael'></a>

#### addEventListener(name:[Event](#events), callback:function)
Registers a function to call when the specified event takes place. See [Event](#events) for reference.
```javascript
asq.addEventListener('STATUS_CHANGE', cb)
```
---
<a id='cancel'></a>

#### cancel()
Stops execution of current [Task](#task) and empties queue. Doesn't affect event listeners
>Triggers `CANCEL` [Event](#events)  
>Triggers `'STOPPED'` status change
```javascript
asq.cancel()
```
---
<a id='clear'></a>

#### clear()
Immediately empties queue and removes all event listeners, *dangerous*  
Use `cancel()` to safely stop an asyncquence
>Won't trigger any event listeners, as they are removed
```javascript
asq.clear()
```
---
<a id='cel'></a>

#### clearEventListeners()
Immediately removes all event listeners
```javascript
asq.clearEventListeners()
```
---
<a id='pause'></a>

#### pause()
Pauses execution of sequence. Any currently running Tasks will complete, but no future Tasks will be executed until `resume()` is called
>Triggers `'PAUSED'` status change  

```javascript
asq.pause()
```
---
<a id='rel'></a>

#### removeEventListener(name:[Event](#events), callback:function)
Removes the specified event listener
```javascript
asq.removeEventListener('STATUS_CHANGE', cb)
```
---
<a id='resume'></a>

#### resume()
Resumes sequence execution from a paused state.
>Triggers `'RESUME'` status change  

```javascript
asq.resume()
```
---
<a id='start'></a>

#### start()
Begins execution of the first element in the sequence. *Not applicable if [config](#config) option: `execImmediate:true`, as execution begins automatically*
>Triggers `START` [Event](#events)  
>Triggers `'RUNNING'` status change  

```javascript
asq.start()
```
---
LICENSE
---
MIT License

Copyright (c) 2018 artisnull

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
