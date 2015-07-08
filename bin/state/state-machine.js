(function(){
  var root;
  root = typeof exports != 'undefined' && exports !== null ? exports : this;
  define('state-machine', ['state', 'transition'], function(state, Transition){
    var StateMachine;
    return StateMachine = (function(){
      StateMachine.displayName = 'StateMachine';
      var replaceWildcard, prototype = StateMachine.prototype, constructor = StateMachine;
      root.atPlusTranstions = {};
      StateMachine.enableBackNavigation = function(){
        var isOnpopstateCausedChange;
        isOnpopstateCausedChange = null;
        state.appState.observe(function(currentPage){
          if (!isOnpopstateCausedChange) {
            history.pushState({
              page: currentPage
            }, '');
          }
          isOnpopstateCausedChange = false;
        });
        window.onpopstate = function(event){
          if (event.state != null) {
            state.appState(event.state.page);
            isOnpopstateCausedChange = true;
          }
        };
      };
      function StateMachine(def){
        this.name = Object.keys(def)[0];
        this.addFakeStates(def);
        this.state = state.add(def);
        this.transitionsAlreadyAdded = false;
        this.transitions = [];
        this.history = [];
        root.atPlusTranstions[this.name] = this;
      }
      prototype.addFakeStates = function(def){
        return def[Object.keys(def)[0]].push('__BACK__');
      };
      prototype.addTransitions = function(arg$, _Transition, statesDataMapping){
        var view, appearedArea, hotArea, spec, tranName, multiSpec, i$, len$, transitionSpec, ref$, cause, _spec;
        view = arg$.view, appearedArea = arg$.appearedArea, hotArea = arg$.hotArea, spec = arg$.spec;
        _Transition == null && (_Transition = Transition);
        if (this.transitionsAlreadyAdded) {
          console.error("can't add transitions multiple times to state machine " + this.name);
        }
        this.transitionsAlreadyAdded = true;
        spec = this.parseAndSplitOrMergeAccordingToTranName(spec);
        appearedArea || (appearedArea = view);
        hotArea || (hotArea = appearedArea);
        for (tranName in spec) {
          multiSpec = spec[tranName];
          if (!Array.isArray(multiSpec)) {
            multiSpec = [multiSpec];
          }
          for (i$ = 0, len$ = multiSpec.length; i$ < len$; ++i$) {
            transitionSpec = multiSpec[i$];
            if (typeof transitionSpec === 'string') {
              transitionSpec = (ref$ = {}, ref$[transitionSpec + ""] = {}, ref$);
            }
            for (cause in transitionSpec) {
              _spec = transitionSpec[cause];
              this.transitions.push(new _Transition({
                stateName: this.name,
                name: tranName,
                cause: cause,
                hotArea: hotArea,
                appearedArea: appearedArea,
                spec: _spec
              }, this.history, statesDataMapping));
            }
          }
        }
      };
      prototype.parseAndSplitOrMergeAccordingToTranName = function(spec){
        var result, name, transitions, i$, ref$, len$, tranName;
        result = {};
        for (name in spec) {
          transitions = spec[name];
          for (i$ = 0, len$ = (ref$ = this.getTransNames(name)).length; i$ < len$; ++i$) {
            tranName = ref$[i$];
            if (!result[tranName]) {
              result[tranName] = [];
            }
            result[tranName] = result[tranName].concat(transitions);
          }
        }
        return result;
      };
      prototype.getTransNames = function(name){
        var ref$, froms, tos, i$, len$, f, j$, len1$, t, results$ = [];
        if (this.isAbbreviateMultiTrans(name)) {
          ref$ = Transition.parseFromTo(name).map(function(it){
            return it.split(',');
          }), froms = ref$[0], tos = ref$[1];
          if (froms.length > 1 && tos.length > 1) {
            console.error('illegal trans name: #{name}, not allow multiple states both in from and to');
          }
          if (froms.anyContains('?') && tos.anyContains('?')) {
            console.error('illegal trans name: #{name}, not allow wildcard "?" both in from and to');
          }
          for (i$ = 0, len$ = froms.length; i$ < len$; ++i$) {
            f = froms[i$];
            for (j$ = 0, len1$ = tos.length; j$ < len1$; ++j$) {
              t = tos[j$];
              results$.push(replaceWildcard(f, t) + ' -> ' + replaceWildcard(t, f));
            }
          }
          return results$;
        } else {
          return [name];
        }
      };
      prototype.isAbbreviateMultiTrans = function(name){
        return name.contains(',');
      };
      replaceWildcard = function(termMayWildcard, replacement){
        return termMayWildcard.replace('?', replacement).trim();
      };
      prototype.start = function(value){
        state[this.name.camelize()](value);
      };
      prototype.execute = function(transitionName){
        this.getTransition(transitionName).transit();
      };
      prototype.getTransition = function(transitionName){
        var i$, ref$, len$, transition;
        for (i$ = 0, len$ = (ref$ = this.transitions).length; i$ < len$; ++i$) {
          transition = ref$[i$];
          if (transition.name === transitionName) {
            return transition;
          }
        }
      };
      return StateMachine;
    }());
  });
}).call(this);
