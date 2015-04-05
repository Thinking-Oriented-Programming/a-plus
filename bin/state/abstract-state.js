(function(){
  define('abstract-state', ['util'], function(util){
    var AbstractState;
    return AbstractState = (function(){
      AbstractState.displayName = 'AbstractState';
      var prototype = AbstractState.prototype, constructor = AbstractState;
      function AbstractState(name, $default, legalValues){
        this.name = name;
        this['default'] = $default;
        this.legalValues = legalValues != null ? legalValues : 'any';
        if ((typeof Meteor != 'undefined' && Meteor !== null) && Meteor.isClient) {
          this.meteorName = "ap-" + this.name;
        }
        if (typeof this['default'] !== 'undefined') {
          this.setValue(this['default']);
        }
        this.makeStateChangingDelaiable();
      }
      prototype.createObservable = function(check){
        var this$ = this;
        check == null && (check = this.checkValue);
        this.observers = {};
        this.fn = function(){
          var oldValue, newValue, options, key, ref$, observer, results$ = [];
          oldValue = this$.getValue();
          if (arguments.length === 0) {
            return oldValue;
          } else {
            check.apply(this$, arguments);
            this$.setValue(newValue = arguments[0]);
            options = arguments[1];
            for (key in ref$ = this$.observers) {
              observer = ref$[key];
              if (this$.shouldRunObserver(observer)) {
                results$.push(observer(newValue, oldValue, options));
              }
            }
            return results$;
          }
        };
        this.fn.observe = function(observer){
          var key;
          this$.observers[key = util.getRandomKey()] = observer;
          return (function(key){
            var this$ = this;
            return function(){
              var ref$, ref1$;
              return ref1$ = (ref$ = this$.observers)[key], delete ref$[key], ref1$;
            };
          }.call(this$, key));
        };
        this.fn.state = this;
      };
      prototype.getValue = function(){
        return this.value;
      };
      prototype.setValue = function(value){
        this.value = value;
      };
      prototype.checkValue = function(value){
        if (this.legalValues !== 'any' && !in$(value, this.legalValues)) {
          console.error(value + " is not legal");
        }
      };
      prototype.shouldRunObserver = function(observer){
        return typeof observer.shouldRun !== 'function' || observer.shouldRun();
      };
      prototype.makeStateChangingDelaiable = function(){
        var this$ = this;
        this.timers = [];
        this.fn.addTimer = function(timer){
          this$.timers.push(timer);
        };
        return this.fn.clearTimers = function(){
          var i$, ref$, len$, timer;
          for (i$ = 0, len$ = (ref$ = this$.timers).length; i$ < len$; ++i$) {
            timer = ref$[i$];
            clearTimeout(timer);
          }
          this$.timers = [];
        };
      };
      return AbstractState;
    }());
  });
  function in$(x, xs){
    var i = -1, l = xs.length >>> 0;
    while (++i < l) if (x === xs[i]) return true;
    return false;
  }
}).call(this);
