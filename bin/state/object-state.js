(function(){
  define('object-state', ['abstract-state'], function(abstractState){
    var ObjectState;
    return ObjectState = (function(superclass){
      var prototype = extend$((import$(ObjectState, superclass).displayName = 'ObjectState', ObjectState), superclass).prototype, constructor = ObjectState;
      function ObjectState(){
        this.isArray = false;
        this.type = 'object';
        this.createObservable();
        ObjectState.superclass.apply(this, arguments);
      }
      return ObjectState;
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
