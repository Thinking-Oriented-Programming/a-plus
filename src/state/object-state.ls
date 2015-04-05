define 'object-state', ['abstract-state'] (abstract-state)->
  class Object-state extends abstract-state
    ->
      @is-array = false
      @type = 'object'
      @create-observable!

      # @fn.updated = !(new-value)~>
      #   @fn new-value

      super ...

