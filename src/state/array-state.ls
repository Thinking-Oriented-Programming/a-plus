define 'array-state', ['abstract-state', 'object-state', 'util'], (abstract-state, object-state, util)->
  
  class Array-state extends abstract-state
    ->
      @is-array = true
      @type = 'array'
      @create-observable-array!
      super ...

    create-observable-array: !-> # array本身可以observe，其中的每个元素也是observable
      @value = {}
      @create-observable check = (args)!~> [@check-value arg for arg in args]
      @array-observers = {}
      @add-observed-array-operations!
      whole-array-reset-observe = @fn.observe
      @fn.observe = (observer, observer-type = 'array')~> # observer-type : add | remove | change-id-element | array ; add, remove, change-id-element是array元素的变化，array是整个array被set
        console.error "observer-type is wrong #{observer-type}" if observer-type not in ['add', 'remove', 'change-id-element', 'array']
        if observer-type is 'array'
          whole-array-reset-observe ... 
        else
          key = util.get-random-key!
          @array-observers[observer-type] ||= {}
          @array-observers[observer-type][key] = observer
          let key = key 
            ~> delete @array-observers[observer-type][key]

      @fn.get-element = (element-id)-> @state.value[element-id]

      @fn.clear = !-> @state.set-value []


    get-value: -> [value! for key, value of @value]

    set-value: (elements)-> # TODO：效率不高，需要更高效率的时候再改进
      throw new Error "all elements of observable array must have id." if not @every-element-has-id elements
      for id, object-state of @value then @fn.remove id, call-observers = true
      for element in elements then @fn.add element

    every-element-has-id: (elements)-> 
      for element in elements then return false if not element.id?
      return true


    create-element-observer: (element)->
      element-state = new object-state @name + element.id
      element-observable = @value[element.id] = element-state.fn
      element-observable element
      element-observable

    add-observed-array-operations: !->
      @add-observed-array-add!
      @add-observed-array-remove!
      @add-observed-array-update-element!
      @add-observed-array-partial-update-element!
      @add-observed-array-change-id-of-element!

    add-observed-array-add: !->
      @fn.add = (element, call-observers = true)~> 
        element-observable = @create-element-observer element
        @run-array-observers element, 'add' if call-observers
        element-observable

    run-array-observers: (value, operation)!->
      # console.log "\n\n*************** run element observer for #{operation} ***************\n\n"
      observers = [observer for key, observer of @array-observers[operation]] ++ [observer for key, observer of @observers]
      [observer value, operation for observer in observers when @should-run-observer observer]

    add-observed-array-remove: !->
      @fn.remove = (element-or-id, call-observers = true)~> 
        id = if typeof element-or-id is 'object' then element-or-id.id else element-or-id
        element = @value[id]!
        element-observable = delete @value[id]
        @run-array-observers element, 'remove' if call-observers
        element-observable

    add-observed-array-update-element: !->
      @fn.update-element = @fn['update-element'] = (element)~> 
        element-observable = @value[element.id]
        element-observable element 
        element-observable

    add-observed-array-partial-update-element: !->
      @fn.partial-updated-element = @fn['partial-updated-element'] = (element)~> 
        element-observable = @value[element.id]
        old-value = element-observable!
        element-observable old-value <<< element 
        element-observable

    add-observed-array-change-id-of-element: !->
      @fn.change-id-element = @fn['change-id-element'] = ({old-id, new-id})~>
        element-observable = @value[new-id] = @value[old-id]
        element = element-observable!
        element._old-id = element.id
        element.id = new-id
        element-observable element
        delete @value[old-id]
        @run-array-observers element, 'change-id-element'
        element-observable
      
