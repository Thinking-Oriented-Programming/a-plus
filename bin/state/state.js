(function(){
  var root;
  root = typeof exports != 'undefined' && exports !== null ? exports : this;
  define('state', ['util', 'array-state', 'object-state'], function(util, arrayState, objectState){
    var State;
    return root.aPlusStates || (root.aPlusStates = State = {
      add: function(){
        var name, state;
        name = typeof arguments[0] === 'string'
          ? arguments[0]
          : Object.keys(arguments[0])[0];
        if (State[name.camelize()] != null) {
          return State[name.camelize()];
        }
        state = this.create.apply(this, arguments);
        return State[state.name.camelize()] = state.fn;
      },
      bind: function(name, stateFn){
        var outerFn, ref$;
        name = name.camelize();
        if (outerFn = State[name]) {
          if (!stateFn || stateFn === outerFn.innerStateFn) {
            return;
          }
          if ((ref$ = outerFn.innerStateFn) != null) {
            ref$.outerObserverStopper();
          }
          if (typeof outerFn.innerObserverObserverStopper === 'function') {
            outerFn.innerObserverObserverStopper();
          }
          outerFn(stateFn(), {
            localChangeAutoUpdate: true
          });
          this.bindOuterInnerStateFn(outerFn, stateFn);
        } else {
          outerFn = this.add(name);
          if (stateFn) {
            this.bindOuterInnerStateFn(outerFn, stateFn);
          }
        }
      },
      bindOuterInnerStateFn: function(outerFn, innerFn){
        var isInBind;
        outerFn.innerStateFn = innerFn;
        innerFn.outerStateFn = outerFn;
        isInBind = null;
        outerFn.innerObserverObserverStopper = outerFn.observe(function(newValue){
          if (!isInBind) {
            isInBind = true;
            return innerFn(newValue);
          } else {
            return isInBind = false;
          }
        });
        innerFn.outerObserverStopper = innerFn.observe(function(newValue){
          if (!isInBind) {
            isInBind = true;
            return outerFn(newValue);
          } else {
            return isInBind = false;
          }
        });
        outerFn.state.setValue(innerFn());
      },
      create: function(def, defaultValueOrOption){
        var isArray, defaultValue, name, legalValues, state;
        isArray = typeof defaultValueOrOption === 'object' && (defaultValueOrOption != null && defaultValueOrOption.isArray) ? true : false;
        if (!(typeof defaultValueOrOption === 'object' && ((defaultValueOrOption != null ? defaultValueOrOption.isArray : void 8) != null || (defaultValueOrOption != null ? defaultValueOrOption.collection : void 8) != null))) {
          defaultValue = defaultValueOrOption;
        }
        if (typeof def === 'object') {
          name = Object.keys(def)[0];
          legalValues = def[name];
        } else {
          name = def;
          legalValues = 'any';
        }
        switch (false) {
        case !isArray:
          state = new arrayState(name, defaultValue, legalValues);
          break;
        default:
          state = new objectState(name, defaultValue, legalValues);
        }
        return state;
      },
      compute: function(statesFns, fn){
        var states, res$, i$, len$, sfn, statesNames, s, state, oldFn, compute, observe, canclers;
        res$ = [];
        for (i$ = 0, len$ = statesFns.length; i$ < len$; ++i$) {
          sfn = statesFns[i$];
          res$.push(sfn.state);
        }
        states = res$;
        res$ = [];
        for (i$ = 0, len$ = states.length; i$ < len$; ++i$) {
          s = states[i$];
          res$.push(s.name);
        }
        statesNames = res$;
        this.checkStatesExist(statesNames);
        state = this.add('computation-' + Math.random() + statesNames.join('-')).state;
        oldFn = state.fn;
        state.fn = function(){
          if (arguments.length > 0) {
            return console.error("computation can't be assign value directly");
          } else {
            return oldFn();
          }
        };
        import$(state.fn, oldFn);
        compute = function(){
          var s;
          return oldFn(fn.apply(null, (function(){
            var i$, ref$, len$, results$ = [];
            for (i$ = 0, len$ = (ref$ = states).length; i$ < len$; ++i$) {
              s = ref$[i$];
              results$.push(s.getValue());
            }
            return results$;
          }())));
        };
        observe = function(){
          var i$, ref$, len$, s, results$ = [];
          for (i$ = 0, len$ = (ref$ = states).length; i$ < len$; ++i$) {
            s = ref$[i$];
            results$.push(s.fn.observe(compute));
          }
          return results$;
        };
        canclers = observe();
        state.fn.pauseObserve = function(){
          var observers, res$, i$, ref$, len$, c;
          res$ = [];
          for (i$ = 0, len$ = (ref$ = canclers).length; i$ < len$; ++i$) {
            c = ref$[i$];
            res$.push(c());
          }
          observers = res$;
          canclers = [];
          return observers;
        };
        state.fn.resumeObserve = function(){
          var s;
          if (canclers.length === 0) {
            return canclers = (function(){
              var i$, ref$, len$, results$ = [];
              for (i$ = 0, len$ = (ref$ = states).length; i$ < len$; ++i$) {
                s = ref$[i$];
                results$.push(s.fn.observe(compute));
              }
              return results$;
            }());
          }
        };
        compute();
        return state.fn;
      },
      checkStatesExist: function(statesNames){
        var i$, len$, name;
        for (i$ = 0, len$ = statesNames.length; i$ < len$; ++i$) {
          name = statesNames[i$];
          if (typeof State[name.camelize()] === 'undefined') {
            console.error("state " + name + " doesn't exist");
          }
        }
      },
      mixinTemporaryState: function(widget, option){
        var ref$, area, this$ = this;
        if (!(widget != null && ((ref$ = widget.name) != null && ref$.length)) > 1) {
          console.error('first arguments should be an widget with name.');
        }
        if (typeof option.isHovered !== 'undefined') {
          area = widget.hotArea || widget.view;
          widget.isHovered = this.add((ref$ = {}, ref$["is-" + widget.name + "-hovered"] = [true, false], ref$));
          area.on('mouseenter', function(){
            widget.isHovered(true);
          }).on('mouseleave', void 8, function(){
            widget.isHovered(false);
          });
          widget.isHovered(option.isHovered);
        }
        if (typeof option.isShown !== 'undefined') {
          area = widget.appearedArea || widget.view;
          widget.isShown = this.add((ref$ = {}, ref$["is-" + widget.name + "-shown"] = [true, false], ref$));
          widget.show = function(){
            $(area).show();
            widget.isShown(true);
          };
          widget.hide = function(){
            $(area).hide();
            widget.isShown(false);
          };
          widget.isShown(option.isShown);
        }
      }
    });
  });
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
}).call(this);
