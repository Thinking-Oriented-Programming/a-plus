# 只对应单一数据的widget
root = exports ? @

define 'Abstract-widget', ['state', 'util'], (State, util)-> class Abstract-widget
  widget-name-index: {} # widget-name: widget-index , 记录多个同spec widget的序号, 以便生产widget name

  (@spec, @model, @is-include-by-template)-> # detailed spec
    @ <<< @spec{model-name, item-template-name}
    @name = spec.name = @get-widget-name spec.name
    @initial-state!
    @initial-dom!
    @reactive-to-app-state!
    @set-data-state!
    @bind-data! 

  get-widget-name: (widget-name)-> # 一个widget可能有多个实例 
    index = if @widget-name-index[widget-name]? then ++@widget-name-index[widget-name] else @widget-name-index[widget-name] = 0
    if index is 0 then widget-name else "#{widget-name}(#{index})"

  get-state: ->
    throw new Error "can't find data of #{@data-state-name}" if not State[@data-state-name]
    State[@data-state-name]

  initial-state: !->
    @state-names = ['hidden', 'shown']
    @state-names ++= @spec.states-names if @spec.states-names? # 默认有两个状态 有hidden 为不显示，shown为显示。
    @state = State.add "a-plus-widgets-#{@name}", 'hidden'

  initial-dom: !->
    @widget-container = $ "<div data-b-plus-widget-container></div>"
    @create-dom!
    @widget-container.append @dom
    @change-widget-container-class-when-state-changed!
    @hide-dom-when-state-change-to-hidden!

  change-widget-container-class-when-state-changed: !->
    @state.observe (state)!~> 
      @widget-container.attr 'class', (state.replace /\./g, ' ')
      @appearance-state-changed-callback?!

  reactive-to-app-state: !-> if State.app-state # 渐进式开发，不要求一开始就定义app-state-machine
    @parse-widget-states-app-states-map!
    State.app-state.observe (app-state)!~> 
      for own widget-state, app-states of @widget-states-app-states-map || {} # widget在不同的app state上呈现不同。widget-states-app-states-map定义了这样的映射关系。
        (@state widget-state ; return) if app-state in app-states
      @state if @is-include-by-template then 'normal' else 'hidden' # 通过template include使用的widget，其状态由template widget控制。
    State.app-state s if s = State.app-state! # 触发第一次应用mappling，否则app-state的初始值，不会关联改变widget的state

  hide-dom-when-state-change-to-hidden: !->
    @state.observe (state)!~> if state is 'hidden' then @hidden-dom-in-one-second! else $ @dom .show!

  hidden-dom-in-one-second: !-> 
    self = @
    set-timeout (!-> $ self.dom .hide! if self.state! isnt 'hidden'), 1000ms

  parse-widget-states-app-states-map: !-> # TODO: 需要进一步完善，现在只能够解析最简单的情况。
    @runtime = root.b-plus-app-engine.app-spec.runtime # TODO: 改进此处的全局依赖
    @widget-states-app-states-map = {}
    @deduce-from-states-names!
    @deduce-from-states-widgets!
    # console.log "name: #{@name}, map: ", @widget-states-app-states-map

  deduce-from-states-names: !->
    [@add-normal-state-for-widget app-state for app-state in @runtime.states when @app-state-is-widget-name app-state]

  deduce-from-states-widgets: !->
    [@add-normal-state-for-widget app-state for own app-state, widgets of @runtime.states-widgets when @name in widgets and !@is-include-by-template]

  add-normal-state-for-widget: (app-state)!->
    @widget-states-app-states-map.normal ||= []
    @widget-states-app-states-map.normal.push app-state

  app-state-is-widget-name: (app-state)-> @name is app-state.replace '.', '-' .camelize!

  bind-data: !-> @bind-computations-states!

  bind-computations-states: !-> for own let name, computation of @model['@computations']
    State.bind computation.observe, null if not State[computation.observe]?
    State[computation.observe].observe (new-value)!~> @apply-computation name, computation

  fill-computed-data: !-> 
    self = @
    compute = @apply-computation-on-item or @apply-computation
    [compute.call self, name, computation for own name, computation of @model['@computations']]

  apply-computation: !->

  create-dom: !-> # Abstract method should be implemented by child class

  set-data-state: !-> # Abstract method should be implemented by child class

  activate: !->

