# 职责：state-machine中的变迁（transition）
# TODO: 1) 将不同类型的transition独立为类，用polymorphism细化此处设计。
#       2) 将传递dom，改为传递selector，在使用时再查询回dom。将hot-area全部改为live，以适应meteor的模板动态渲染。

define 'transition', <[ util state ]>, (util, state) -> class Transition
  @delimiter = '->'
  @parse-from-to = (name)-> name.split @delimiter .map (-> it.trim!)

  ({@state-name, @name, @cause, @spec, @hot-area, @appeared-area}, @history)->
    @state = state[@state-name.camelize!]
    [@from, @to] = @@parse-from-to @name
    @appeared-area = @spec.appeared-area or @appeared-area
    @condition = @spec.condition || -> true # 默认无条件执行
    @delay = if util.is-number @spec.delay then parse-int @spec.delay else false # 注意：delay为0时，将在下一个event loop中执行。而delay为非数字或null、undefined将直接执行。
    @action = @spec.action
    @after = @spec.after
    # console.log '@cause: ', @cause
    @parse-type-and-set-attributes! if @cause isnt 'meteor' # 服务端的app-state，meteor-transition啥也不做。TODO: 重构
    switch @type
    | 'ui-event'    => @create-ui-event-transition!
    | '@+ui-event'  => @create-at-plus-ui-event-transition!
    | 'hostpage'    => @create-hostpage-event-transition!
    | 'state'       => @create-state-transition!
    | 'auto'        => @create-auto-transition! 
    # | 'meteor-server' => -> 

  parse-type-and-set-attributes: !-> # @cause 形如：@+:mask （state类型），mouseleave （event类型）
    [t1, t2] = @cause.split ':'
    switch t1
    case 'meteor'
      @type = 'meteor'
    case '@+'  
      if t2 is 'auto' # 此transition将自动在delay timeout时发生。如果其它符合条件的transition发生时，这个transition会被取消。
        @type = 'auto'
      else
        @type = 'state'
        [@observed-state-name, @observer-type] = t2.split '|' 
        @observed-state = state[@observed-state-name.camelize!]
    case '@+e'
      @type = '@+ui-event'
      @event-name = t2
    case 'hostpage'
      @type = 'hostpage'
      @event-name = @spec.event
    default
      @type = 'ui-event'
      @event-name = t1
      @hot-area = @spec.hot-area or @spec.appeared-area or @hot-area
      (@is-live-hot-area = true; @hot-area-selector = @hot-area.selector) if @hot-area?.is-live or Meteor?.is-client # is-live用来保证后来动态生成的UI也能够被观察。Meteor中所有的都是live，因为模板的动态加载
      @ignore-bubbled = if typeof @spec.ignore-bubbled isnt 'undefined' then @spec.ignore-bubbled else false
      @prevent-default = if typeof @spec.prevent-default isnt 'undefined' then @spec.prevent-default else true and @event-name isnt 'keydown'
      @stop-propagation = if typeof @spec.stop-propagation isnt 'undefined' then @spec.stop-propagation else true and @event-name isnt 'keydown'


  create-at-plus-ui-event-transition: !-> 
    util.events.on @event-name, (@event)!~> @delay-or-immediately-transit!

  create-ui-event-transition: !-> 
    if @is-live-hot-area 
      $ document .on @event-name, @hot-area-selector, (@event)!~> 
        # @event.stop-propagation! if @stop-propagation
        # @event.prevent-default! if @prevent-default
        @delay-or-immediately-transit!
    else
      $ @hot-area .on @event-name, (@event)!~> 
        @event.stop-propagation! if @stop-propagation
        @event.prevent-default! if @prevent-default
        if !@ignore-bubbled or @event.target is @hot-area.get 0
        # console.log "event: #{@event.type}, target: #{@event.target.class-name}"
        # console.log "!@ignore-bubbled: #{!@ignore-bubbled}"
        # console.log "@event.target: #{@event.target.class-name}"
        # console.log "@hot-area.get 0: #{@hot-area.get 0 .class-name}"
          # console.log "event: #{@event.type}, dom: #{@event.target.class-name}"
          @delay-or-immediately-transit!

  create-hostpage-event-transition: !-> 
    util.host-page.on @event-name, (@event)!~> @delay-or-immediately-transit!

  create-state-transition: !-> @observed-state.observe !~> 
    @observed = & ; @delay-or-immediately-transit!
  , observer-type = if @observer-type is 'individual' then 'add' else 'element'

  create-auto-transition: !-> @state.observe (current-state)!~> @delay-or-immediately-transit!
  
  delay-or-immediately-transit: -> if @delay then @state.add-timer set-timeout (!~> @conditional-transit! if @state! is @from), @delay else @conditional-transit! # 延时transition，开始transition时要检查确认，延时过程中state没有变化。

  # conditional-transit: !-> @transit! if @state! is @from and @condition.apply @, @observed
  conditional-transit: !-> @transit! if @is-transition-from-current-state! and @condition.apply @, @observed

  is-transition-from-current-state: -> @state! is @from or @is-wildcard-apply @from, @state!

  is-wildcard-apply: (exp, name)-> 
    switch
      | (exp.index-of '^') is 0           =>    (exp.substr 1, exp.length - 1) isnt name
      | 0 <= (end = exp.index-of '*')     =>    (exp.substr 0, end) is (name.substr 0, end)
      | otherwise false

  transit: !->
    @state.clear-timers! # 一次只会执行一个变迁，执行当前变迁时，取消所有delay的变迁。
    to-state = if @to is '__BACK__' then @history.pop! else @to
    from-state = if @from is '*' then @state! else @from
    @change-ui-class from-state, to-state if @appeared-area?
    @do-action!
    set-timeout !~> 
      @history.push @state! if @to isnt '__BACK__'
      console.log "#{@state-name}: #{@from} -> #{to-state}" # DEBUG，调试神器！
      if @after?is-async
        @after !~> @state to-state
      else
        @after?!
        @state to-state
    , 0 # 避免连续触发toggle的两个transition，例如：controls里面的mask-control的on、off。on、off将会分别注册监听器，前一个改变了当前状态，则刚好满足后一个的@state is @from的条件。

  change-ui-class: (from-state, to-state)!-> 
    from = @normalize-class-name from-state
    to = @normalize-class-name to-state
    $ @appeared-area .remove-class from .add-class to 

  normalize-class-name: (class-name)-> class-name.replace /\./g, ' ' .replace 'none', '' .trim!

  do-action: !-> if @action?
    switch @type
    | 'ui-event'  => @action @event
    | 'hostpage'  => @action @event
    | 'state'     => @action.apply @, @observed
    | 'auto'      => @action!




