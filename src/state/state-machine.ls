# 职责：状态机。用状态机来描述widget的状态变迁，特别是外观状态的变化。与使用事件（event）传递和直接调用的方式相比，代码为declaritive，更加清晰，易于理解和维护。
# TODO：将整个state-machine的设计记录在Wiki。
# TODO：一个transition有多个可能时（array），各array之间能够共享action，delay等等要素。
# TODO：改进代码，提高可读性。

root = exports ? @
define 'state-machine', ['state', 'transition'], (state, Transition)-> class State-machine
  root.at-plus-transtions = {} # Debug用

  @enable-back-navigation = !->
    is-onpopstate-caused-change = null 
    state.app-state.observe (current-page)!->
      history.push-state page: current-page if not is-onpopstate-caused-change
      is-onpopstate-caused-change := false

    window.onpopstate = (event)!-> if event.state?
      state.app-state event.state.page 
      is-onpopstate-caused-change := true


  (def) -> 
    @name = Object.keys def .0
    @add-fake-states def
    @state = state.add def 
    @transitions-already-added = false
    @transitions = []
    @history = [] # 用于记载状态机的状态历史，以便实现back（__BACK__）功能
    root.at-plus-transtions[@name] = @ # Debug用


  add-fake-states: (def)-> # 增加 __BACK__ 等假状态，以适应需要。__BACK__并不是真正的状态，而是代指本transition之前的一个transition中的from state。
    def[Object.keys def .0].push '__BACK__'


  add-transitions: ({view, appeared-area, hot-area, spec}, _Transition = Transition, states-data-mapping)!-> # 用户可以只给area，也可分别给出appeared-area和hot-area。参数化_Transition，可实现多种类型的Transition.
    console.error "can't add transitions multiple times to state machine #{@name}" if @transitions-already-added
    @transitions-already-added = true
    spec = @parse-and-split-or-merge-according-to-tran-name spec
    appeared-area ||= view
    hot-area ||= appeared-area
    for tran-name, multi-spec of spec
      multi-spec = [multi-spec] if not Array.is-array multi-spec
      for transition-spec in multi-spec
        transition-spec = "#{transition-spec}": {} if typeof transition-spec is 'string'
        for cause, _spec of transition-spec
          @transitions.push new _Transition {state-name: @name, name: tran-name, cause, hot-area, appeared-area, spec: _spec}, @history, states-data-mapping

  parse-and-split-or-merge-according-to-tran-name: (spec)->
    result = {}
    for name, transitions of spec
      for tran-name in @get-trans-names name
        result[tran-name] = [] if not result[tran-name]
        result[tran-name] ++= transitions
    result

  get-trans-names: (name)->
    if @is-abbreviate-multi-trans name
      [froms, tos] = Transition.parse-from-to name .map (-> it.split ',')
      console.error 'illegal trans name: #{name}, not allow multiple states both in from and to' if froms.length > 1 and tos.length > 1
      console.error 'illegal trans name: #{name}, not allow wildcard "?" both in from and to' if froms.any-contains '?' and tos.any-contains '?'
      [ (replace-wildcard f, t) + ' -> ' + (replace-wildcard t, f) for f in froms for t in tos]
    else
      [name]

  is-abbreviate-multi-trans: (name)-> name.contains ',' 

  replace-wildcard = (term-may-wildcard, replacement)-> term-may-wildcard.replace '?', replacement .trim!

  start: (value)!-> state[@name.camelize!] value

  execute: (transition-name)!-> @get-transition transition-name .transit!

  get-transition: (transition-name)-> [return transition for transition in @transitions when transition.name is transition-name]

