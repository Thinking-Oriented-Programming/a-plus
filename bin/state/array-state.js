(function(){
  define('array-state', ['abstract-state', 'object-state', 'util'], function(abstractState, objectState, util){
    var ArrayState;
    return ArrayState = (function(superclass){
      var prototype = extend$((import$(ArrayState, superclass).displayName = 'ArrayState', ArrayState), superclass).prototype, constructor = ArrayState;
      function ArrayState(){
        this.isArray = true;
        this.type = 'array';
        this.createObservableArray();
        ArrayState.superclass.apply(this, arguments);
      }
      prototype.createObservableArray = function(){
        var check, wholeArrayResetObserve, this$ = this;
        this.value = {};
        this.createObservable(check = function(args){
          var i$, len$, arg;
          for (i$ = 0, len$ = args.length; i$ < len$; ++i$) {
            arg = args[i$];
            this$.checkValue(arg);
          }
        });
        this.arrayObservers = {};
        this.addObservedArrayOperations();
        wholeArrayResetObserve = this.fn.observe;
        this.fn.observe = function(observer, observerType){
          var key, ref$;
          observerType == null && (observerType = 'array');
          if (observerType !== 'add' && observerType !== 'remove' && observerType !== 'change-id-element' && observerType !== 'array') {
            console.error("observer-type is wrong " + observerType);
          }
          if (observerType === 'array') {
            return wholeArrayResetObserve.apply(this$, arguments);
          } else {
            key = util.getRandomKey();
            (ref$ = this$.arrayObservers)[observerType] || (ref$[observerType] = {});
            this$.arrayObservers[observerType][key] = observer;
            return (function(key){
              var this$ = this;
              return function(){
                var ref$, ref1$;
                return ref1$ = (ref$ = this$.arrayObservers[observerType])[key], delete ref$[key], ref1$;
              };
            }.call(this$, key));
          }
        };
        this.fn.getElement = function(elementId){
          return this.state.value[elementId];
        };
        this.fn.clear = function(){
          this.state.setValue([]);
        };
      };
      prototype.getValue = function(){
        var key, ref$, value, results$ = [];
        for (key in ref$ = this.value) {
          value = ref$[key];
          results$.push(value());
        }
        return results$;
      };
      prototype.setValue = function(elements){
        var id, ref$, objectState, callObservers, i$, len$, element, results$ = [];
        if (!this.everyElementHasId(elements)) {
          throw new Error("all elements of observable array must have id.");
        }
        for (id in ref$ = this.value) {
          objectState = ref$[id];
          this.fn.remove(id, callObservers = true);
        }
        for (i$ = 0, len$ = elements.length; i$ < len$; ++i$) {
          element = elements[i$];
          results$.push(this.fn.add(element));
        }
        return results$;
      };
      prototype.everyElementHasId = function(elements){
        var i$, len$, element;
        for (i$ = 0, len$ = elements.length; i$ < len$; ++i$) {
          element = elements[i$];
          if (element.id == null) {
            return false;
          }
        }
        return true;
      };
      prototype.createElementObserver = function(element){
        var elementState, elementObservable;
        elementState = new objectState(this.name + element.id);
        elementObservable = this.value[element.id] = elementState.fn;
        elementObservable(element);
        return elementObservable;
      };
      prototype.addObservedArrayOperations = function(){
        this.addObservedArrayAdd();
        this.addObservedArrayRemove();
        this.addObservedArrayUpdateElement();
        this.addObservedArrayPartialUpdateElement();
        this.addObservedArrayChangeIdOfElement();
      };
      prototype.addObservedArrayAdd = function(){
        var this$ = this;
        this.fn.add = function(element, callObservers){
          var elementObservable;
          callObservers == null && (callObservers = true);
          elementObservable = this$.createElementObserver(element);
          if (callObservers) {
            this$.runArrayObservers(element, 'add');
          }
          return elementObservable;
        };
      };
      prototype.runArrayObservers = function(value, operation){
        var observers, key, observer, i$, len$;
        observers = (function(){
          var ref$, results$ = [];
          for (key in ref$ = this.arrayObservers[operation]) {
            observer = ref$[key];
            results$.push(observer);
          }
          return results$;
        }.call(this)).concat((function(){
          var ref$, results$ = [];
          for (key in ref$ = this.observers) {
            observer = ref$[key];
            results$.push(observer);
          }
          return results$;
        }.call(this)));
        for (i$ = 0, len$ = observers.length; i$ < len$; ++i$) {
          observer = observers[i$];
          if (this.shouldRunObserver(observer)) {
            observer(value, operation);
          }
        }
      };
      prototype.addObservedArrayRemove = function(){
        var this$ = this;
        this.fn.remove = function(elementOrId, callObservers){
          var id, element, elementObservable, ref$, ref1$;
          callObservers == null && (callObservers = true);
          id = typeof elementOrId === 'object' ? elementOrId.id : elementOrId;
          element = this$.value[id]();
          elementObservable = (ref1$ = (ref$ = this$.value)[id], delete ref$[id], ref1$);
          if (callObservers) {
            this$.runArrayObservers(element, 'remove');
          }
          return elementObservable;
        };
      };
      prototype.addObservedArrayUpdateElement = function(){
        var this$ = this;
        this.fn.updateElement = this.fn['update-element'] = function(element){
          var elementObservable;
          elementObservable = this$.value[element.id];
          elementObservable(element);
          return elementObservable;
        };
      };
      prototype.addObservedArrayPartialUpdateElement = function(){
        var this$ = this;
        this.fn.partialUpdatedElement = this.fn['partial-updated-element'] = function(element){
          var elementObservable, oldValue;
          elementObservable = this$.value[element.id];
          oldValue = elementObservable();
          elementObservable(import$(oldValue, element));
          return elementObservable;
        };
      };
      prototype.addObservedArrayChangeIdOfElement = function(){
        var this$ = this;
        this.fn.changeIdElement = this.fn['change-id-element'] = function(arg$){
          var oldId, newId, elementObservable, element;
          oldId = arg$.oldId, newId = arg$.newId;
          elementObservable = this$.value[newId] = this$.value[oldId];
          element = elementObservable();
          element._oldId = element.id;
          element.id = newId;
          elementObservable(element);
          delete this$.value[oldId];
          this$.runArrayObservers(element, 'change-id-element');
          return elementObservable;
        };
      };
      return ArrayState;
    }(abstractState));
  });
  function extend$(sub, sup){
    function fun(){} fun.prototype = (sub.superclass = sup).prototype;
    (sub.prototype = new fun).constructor = sub;
    if (typeof sup.extended == 'function') sup.extended(sub);
    return sub;
  }
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
}).call(this);
