var Vapor = new Class({});
[Array, Function, Number, String, Hash, Event].each(function(item){
  item.implement({
    vapor: function(){}
  });
});
