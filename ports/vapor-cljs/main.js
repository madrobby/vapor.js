var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || width == "" || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  return goog.string.format.demuxes_["f"](parseInt(value, 10), flags, width, dotp, 0, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.format");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__6102 = x == null ? null : x;
  if(p[goog.typeOf(x__6102)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error(["No protocol method ", proto, " defined for type ", goog.typeOf(obj), ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.cljs$lang$arity$1(size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__6103__delegate = function(array, i, idxs) {
      return cljs.core.apply.cljs$lang$arity$3(aget, aget.cljs$lang$arity$2(array, i), idxs)
    };
    var G__6103 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6103__delegate.call(this, array, i, idxs)
    };
    G__6103.cljs$lang$maxFixedArity = 2;
    G__6103.cljs$lang$applyTo = function(arglist__6104) {
      var array = cljs.core.first(arglist__6104);
      var i = cljs.core.first(cljs.core.next(arglist__6104));
      var idxs = cljs.core.rest(cljs.core.next(arglist__6104));
      return G__6103__delegate(array, i, idxs)
    };
    G__6103.cljs$lang$arity$variadic = G__6103__delegate;
    return G__6103
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.cljs$lang$arity$2(null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.cljs$lang$arity$3(function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3822__auto____6189 = this$;
      if(and__3822__auto____6189) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____6189
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2363__auto____6190 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6191 = cljs.core._invoke[goog.typeOf(x__2363__auto____6190)];
        if(or__3824__auto____6191) {
          return or__3824__auto____6191
        }else {
          var or__3824__auto____6192 = cljs.core._invoke["_"];
          if(or__3824__auto____6192) {
            return or__3824__auto____6192
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____6193 = this$;
      if(and__3822__auto____6193) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____6193
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2363__auto____6194 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6195 = cljs.core._invoke[goog.typeOf(x__2363__auto____6194)];
        if(or__3824__auto____6195) {
          return or__3824__auto____6195
        }else {
          var or__3824__auto____6196 = cljs.core._invoke["_"];
          if(or__3824__auto____6196) {
            return or__3824__auto____6196
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____6197 = this$;
      if(and__3822__auto____6197) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____6197
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2363__auto____6198 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6199 = cljs.core._invoke[goog.typeOf(x__2363__auto____6198)];
        if(or__3824__auto____6199) {
          return or__3824__auto____6199
        }else {
          var or__3824__auto____6200 = cljs.core._invoke["_"];
          if(or__3824__auto____6200) {
            return or__3824__auto____6200
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____6201 = this$;
      if(and__3822__auto____6201) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____6201
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2363__auto____6202 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6203 = cljs.core._invoke[goog.typeOf(x__2363__auto____6202)];
        if(or__3824__auto____6203) {
          return or__3824__auto____6203
        }else {
          var or__3824__auto____6204 = cljs.core._invoke["_"];
          if(or__3824__auto____6204) {
            return or__3824__auto____6204
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____6205 = this$;
      if(and__3822__auto____6205) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____6205
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2363__auto____6206 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6207 = cljs.core._invoke[goog.typeOf(x__2363__auto____6206)];
        if(or__3824__auto____6207) {
          return or__3824__auto____6207
        }else {
          var or__3824__auto____6208 = cljs.core._invoke["_"];
          if(or__3824__auto____6208) {
            return or__3824__auto____6208
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____6209 = this$;
      if(and__3822__auto____6209) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____6209
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2363__auto____6210 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6211 = cljs.core._invoke[goog.typeOf(x__2363__auto____6210)];
        if(or__3824__auto____6211) {
          return or__3824__auto____6211
        }else {
          var or__3824__auto____6212 = cljs.core._invoke["_"];
          if(or__3824__auto____6212) {
            return or__3824__auto____6212
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____6213 = this$;
      if(and__3822__auto____6213) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____6213
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2363__auto____6214 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6215 = cljs.core._invoke[goog.typeOf(x__2363__auto____6214)];
        if(or__3824__auto____6215) {
          return or__3824__auto____6215
        }else {
          var or__3824__auto____6216 = cljs.core._invoke["_"];
          if(or__3824__auto____6216) {
            return or__3824__auto____6216
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____6217 = this$;
      if(and__3822__auto____6217) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____6217
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2363__auto____6218 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6219 = cljs.core._invoke[goog.typeOf(x__2363__auto____6218)];
        if(or__3824__auto____6219) {
          return or__3824__auto____6219
        }else {
          var or__3824__auto____6220 = cljs.core._invoke["_"];
          if(or__3824__auto____6220) {
            return or__3824__auto____6220
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____6221 = this$;
      if(and__3822__auto____6221) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____6221
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2363__auto____6222 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6223 = cljs.core._invoke[goog.typeOf(x__2363__auto____6222)];
        if(or__3824__auto____6223) {
          return or__3824__auto____6223
        }else {
          var or__3824__auto____6224 = cljs.core._invoke["_"];
          if(or__3824__auto____6224) {
            return or__3824__auto____6224
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____6225 = this$;
      if(and__3822__auto____6225) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____6225
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2363__auto____6226 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6227 = cljs.core._invoke[goog.typeOf(x__2363__auto____6226)];
        if(or__3824__auto____6227) {
          return or__3824__auto____6227
        }else {
          var or__3824__auto____6228 = cljs.core._invoke["_"];
          if(or__3824__auto____6228) {
            return or__3824__auto____6228
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____6229 = this$;
      if(and__3822__auto____6229) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____6229
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2363__auto____6230 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6231 = cljs.core._invoke[goog.typeOf(x__2363__auto____6230)];
        if(or__3824__auto____6231) {
          return or__3824__auto____6231
        }else {
          var or__3824__auto____6232 = cljs.core._invoke["_"];
          if(or__3824__auto____6232) {
            return or__3824__auto____6232
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____6233 = this$;
      if(and__3822__auto____6233) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____6233
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2363__auto____6234 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6235 = cljs.core._invoke[goog.typeOf(x__2363__auto____6234)];
        if(or__3824__auto____6235) {
          return or__3824__auto____6235
        }else {
          var or__3824__auto____6236 = cljs.core._invoke["_"];
          if(or__3824__auto____6236) {
            return or__3824__auto____6236
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____6237 = this$;
      if(and__3822__auto____6237) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____6237
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2363__auto____6238 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6239 = cljs.core._invoke[goog.typeOf(x__2363__auto____6238)];
        if(or__3824__auto____6239) {
          return or__3824__auto____6239
        }else {
          var or__3824__auto____6240 = cljs.core._invoke["_"];
          if(or__3824__auto____6240) {
            return or__3824__auto____6240
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____6241 = this$;
      if(and__3822__auto____6241) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____6241
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2363__auto____6242 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6243 = cljs.core._invoke[goog.typeOf(x__2363__auto____6242)];
        if(or__3824__auto____6243) {
          return or__3824__auto____6243
        }else {
          var or__3824__auto____6244 = cljs.core._invoke["_"];
          if(or__3824__auto____6244) {
            return or__3824__auto____6244
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____6245 = this$;
      if(and__3822__auto____6245) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____6245
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2363__auto____6246 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6247 = cljs.core._invoke[goog.typeOf(x__2363__auto____6246)];
        if(or__3824__auto____6247) {
          return or__3824__auto____6247
        }else {
          var or__3824__auto____6248 = cljs.core._invoke["_"];
          if(or__3824__auto____6248) {
            return or__3824__auto____6248
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____6249 = this$;
      if(and__3822__auto____6249) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____6249
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2363__auto____6250 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6251 = cljs.core._invoke[goog.typeOf(x__2363__auto____6250)];
        if(or__3824__auto____6251) {
          return or__3824__auto____6251
        }else {
          var or__3824__auto____6252 = cljs.core._invoke["_"];
          if(or__3824__auto____6252) {
            return or__3824__auto____6252
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____6253 = this$;
      if(and__3822__auto____6253) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____6253
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2363__auto____6254 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6255 = cljs.core._invoke[goog.typeOf(x__2363__auto____6254)];
        if(or__3824__auto____6255) {
          return or__3824__auto____6255
        }else {
          var or__3824__auto____6256 = cljs.core._invoke["_"];
          if(or__3824__auto____6256) {
            return or__3824__auto____6256
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____6257 = this$;
      if(and__3822__auto____6257) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____6257
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2363__auto____6258 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6259 = cljs.core._invoke[goog.typeOf(x__2363__auto____6258)];
        if(or__3824__auto____6259) {
          return or__3824__auto____6259
        }else {
          var or__3824__auto____6260 = cljs.core._invoke["_"];
          if(or__3824__auto____6260) {
            return or__3824__auto____6260
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____6261 = this$;
      if(and__3822__auto____6261) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____6261
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2363__auto____6262 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6263 = cljs.core._invoke[goog.typeOf(x__2363__auto____6262)];
        if(or__3824__auto____6263) {
          return or__3824__auto____6263
        }else {
          var or__3824__auto____6264 = cljs.core._invoke["_"];
          if(or__3824__auto____6264) {
            return or__3824__auto____6264
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____6265 = this$;
      if(and__3822__auto____6265) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____6265
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2363__auto____6266 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6267 = cljs.core._invoke[goog.typeOf(x__2363__auto____6266)];
        if(or__3824__auto____6267) {
          return or__3824__auto____6267
        }else {
          var or__3824__auto____6268 = cljs.core._invoke["_"];
          if(or__3824__auto____6268) {
            return or__3824__auto____6268
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____6269 = this$;
      if(and__3822__auto____6269) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____6269
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2363__auto____6270 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6271 = cljs.core._invoke[goog.typeOf(x__2363__auto____6270)];
        if(or__3824__auto____6271) {
          return or__3824__auto____6271
        }else {
          var or__3824__auto____6272 = cljs.core._invoke["_"];
          if(or__3824__auto____6272) {
            return or__3824__auto____6272
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3822__auto____6277 = coll;
    if(and__3822__auto____6277) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____6277
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2363__auto____6278 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6279 = cljs.core._count[goog.typeOf(x__2363__auto____6278)];
      if(or__3824__auto____6279) {
        return or__3824__auto____6279
      }else {
        var or__3824__auto____6280 = cljs.core._count["_"];
        if(or__3824__auto____6280) {
          return or__3824__auto____6280
        }else {
          throw cljs.core.missing_protocol("ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3822__auto____6285 = coll;
    if(and__3822__auto____6285) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____6285
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2363__auto____6286 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6287 = cljs.core._empty[goog.typeOf(x__2363__auto____6286)];
      if(or__3824__auto____6287) {
        return or__3824__auto____6287
      }else {
        var or__3824__auto____6288 = cljs.core._empty["_"];
        if(or__3824__auto____6288) {
          return or__3824__auto____6288
        }else {
          throw cljs.core.missing_protocol("IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3822__auto____6293 = coll;
    if(and__3822__auto____6293) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____6293
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2363__auto____6294 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6295 = cljs.core._conj[goog.typeOf(x__2363__auto____6294)];
      if(or__3824__auto____6295) {
        return or__3824__auto____6295
      }else {
        var or__3824__auto____6296 = cljs.core._conj["_"];
        if(or__3824__auto____6296) {
          return or__3824__auto____6296
        }else {
          throw cljs.core.missing_protocol("ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3822__auto____6305 = coll;
      if(and__3822__auto____6305) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____6305
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2363__auto____6306 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6307 = cljs.core._nth[goog.typeOf(x__2363__auto____6306)];
        if(or__3824__auto____6307) {
          return or__3824__auto____6307
        }else {
          var or__3824__auto____6308 = cljs.core._nth["_"];
          if(or__3824__auto____6308) {
            return or__3824__auto____6308
          }else {
            throw cljs.core.missing_protocol("IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____6309 = coll;
      if(and__3822__auto____6309) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____6309
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2363__auto____6310 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6311 = cljs.core._nth[goog.typeOf(x__2363__auto____6310)];
        if(or__3824__auto____6311) {
          return or__3824__auto____6311
        }else {
          var or__3824__auto____6312 = cljs.core._nth["_"];
          if(or__3824__auto____6312) {
            return or__3824__auto____6312
          }else {
            throw cljs.core.missing_protocol("IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3822__auto____6317 = coll;
    if(and__3822__auto____6317) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____6317
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2363__auto____6318 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6319 = cljs.core._first[goog.typeOf(x__2363__auto____6318)];
      if(or__3824__auto____6319) {
        return or__3824__auto____6319
      }else {
        var or__3824__auto____6320 = cljs.core._first["_"];
        if(or__3824__auto____6320) {
          return or__3824__auto____6320
        }else {
          throw cljs.core.missing_protocol("ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____6325 = coll;
    if(and__3822__auto____6325) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____6325
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2363__auto____6326 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6327 = cljs.core._rest[goog.typeOf(x__2363__auto____6326)];
      if(or__3824__auto____6327) {
        return or__3824__auto____6327
      }else {
        var or__3824__auto____6328 = cljs.core._rest["_"];
        if(or__3824__auto____6328) {
          return or__3824__auto____6328
        }else {
          throw cljs.core.missing_protocol("ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3822__auto____6333 = coll;
    if(and__3822__auto____6333) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____6333
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2363__auto____6334 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6335 = cljs.core._next[goog.typeOf(x__2363__auto____6334)];
      if(or__3824__auto____6335) {
        return or__3824__auto____6335
      }else {
        var or__3824__auto____6336 = cljs.core._next["_"];
        if(or__3824__auto____6336) {
          return or__3824__auto____6336
        }else {
          throw cljs.core.missing_protocol("INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3822__auto____6345 = o;
      if(and__3822__auto____6345) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____6345
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2363__auto____6346 = o == null ? null : o;
      return function() {
        var or__3824__auto____6347 = cljs.core._lookup[goog.typeOf(x__2363__auto____6346)];
        if(or__3824__auto____6347) {
          return or__3824__auto____6347
        }else {
          var or__3824__auto____6348 = cljs.core._lookup["_"];
          if(or__3824__auto____6348) {
            return or__3824__auto____6348
          }else {
            throw cljs.core.missing_protocol("ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____6349 = o;
      if(and__3822__auto____6349) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____6349
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2363__auto____6350 = o == null ? null : o;
      return function() {
        var or__3824__auto____6351 = cljs.core._lookup[goog.typeOf(x__2363__auto____6350)];
        if(or__3824__auto____6351) {
          return or__3824__auto____6351
        }else {
          var or__3824__auto____6352 = cljs.core._lookup["_"];
          if(or__3824__auto____6352) {
            return or__3824__auto____6352
          }else {
            throw cljs.core.missing_protocol("ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3822__auto____6357 = coll;
    if(and__3822__auto____6357) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____6357
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2363__auto____6358 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6359 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2363__auto____6358)];
      if(or__3824__auto____6359) {
        return or__3824__auto____6359
      }else {
        var or__3824__auto____6360 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____6360) {
          return or__3824__auto____6360
        }else {
          throw cljs.core.missing_protocol("IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____6365 = coll;
    if(and__3822__auto____6365) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____6365
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2363__auto____6366 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6367 = cljs.core._assoc[goog.typeOf(x__2363__auto____6366)];
      if(or__3824__auto____6367) {
        return or__3824__auto____6367
      }else {
        var or__3824__auto____6368 = cljs.core._assoc["_"];
        if(or__3824__auto____6368) {
          return or__3824__auto____6368
        }else {
          throw cljs.core.missing_protocol("IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3822__auto____6373 = coll;
    if(and__3822__auto____6373) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____6373
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2363__auto____6374 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6375 = cljs.core._dissoc[goog.typeOf(x__2363__auto____6374)];
      if(or__3824__auto____6375) {
        return or__3824__auto____6375
      }else {
        var or__3824__auto____6376 = cljs.core._dissoc["_"];
        if(or__3824__auto____6376) {
          return or__3824__auto____6376
        }else {
          throw cljs.core.missing_protocol("IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3822__auto____6381 = coll;
    if(and__3822__auto____6381) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____6381
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2363__auto____6382 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6383 = cljs.core._key[goog.typeOf(x__2363__auto____6382)];
      if(or__3824__auto____6383) {
        return or__3824__auto____6383
      }else {
        var or__3824__auto____6384 = cljs.core._key["_"];
        if(or__3824__auto____6384) {
          return or__3824__auto____6384
        }else {
          throw cljs.core.missing_protocol("IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____6389 = coll;
    if(and__3822__auto____6389) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____6389
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2363__auto____6390 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6391 = cljs.core._val[goog.typeOf(x__2363__auto____6390)];
      if(or__3824__auto____6391) {
        return or__3824__auto____6391
      }else {
        var or__3824__auto____6392 = cljs.core._val["_"];
        if(or__3824__auto____6392) {
          return or__3824__auto____6392
        }else {
          throw cljs.core.missing_protocol("IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3822__auto____6397 = coll;
    if(and__3822__auto____6397) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____6397
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2363__auto____6398 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6399 = cljs.core._disjoin[goog.typeOf(x__2363__auto____6398)];
      if(or__3824__auto____6399) {
        return or__3824__auto____6399
      }else {
        var or__3824__auto____6400 = cljs.core._disjoin["_"];
        if(or__3824__auto____6400) {
          return or__3824__auto____6400
        }else {
          throw cljs.core.missing_protocol("ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3822__auto____6405 = coll;
    if(and__3822__auto____6405) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____6405
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2363__auto____6406 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6407 = cljs.core._peek[goog.typeOf(x__2363__auto____6406)];
      if(or__3824__auto____6407) {
        return or__3824__auto____6407
      }else {
        var or__3824__auto____6408 = cljs.core._peek["_"];
        if(or__3824__auto____6408) {
          return or__3824__auto____6408
        }else {
          throw cljs.core.missing_protocol("IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____6413 = coll;
    if(and__3822__auto____6413) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____6413
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2363__auto____6414 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6415 = cljs.core._pop[goog.typeOf(x__2363__auto____6414)];
      if(or__3824__auto____6415) {
        return or__3824__auto____6415
      }else {
        var or__3824__auto____6416 = cljs.core._pop["_"];
        if(or__3824__auto____6416) {
          return or__3824__auto____6416
        }else {
          throw cljs.core.missing_protocol("IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3822__auto____6421 = coll;
    if(and__3822__auto____6421) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____6421
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2363__auto____6422 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6423 = cljs.core._assoc_n[goog.typeOf(x__2363__auto____6422)];
      if(or__3824__auto____6423) {
        return or__3824__auto____6423
      }else {
        var or__3824__auto____6424 = cljs.core._assoc_n["_"];
        if(or__3824__auto____6424) {
          return or__3824__auto____6424
        }else {
          throw cljs.core.missing_protocol("IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3822__auto____6429 = o;
    if(and__3822__auto____6429) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____6429
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2363__auto____6430 = o == null ? null : o;
    return function() {
      var or__3824__auto____6431 = cljs.core._deref[goog.typeOf(x__2363__auto____6430)];
      if(or__3824__auto____6431) {
        return or__3824__auto____6431
      }else {
        var or__3824__auto____6432 = cljs.core._deref["_"];
        if(or__3824__auto____6432) {
          return or__3824__auto____6432
        }else {
          throw cljs.core.missing_protocol("IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3822__auto____6437 = o;
    if(and__3822__auto____6437) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____6437
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2363__auto____6438 = o == null ? null : o;
    return function() {
      var or__3824__auto____6439 = cljs.core._deref_with_timeout[goog.typeOf(x__2363__auto____6438)];
      if(or__3824__auto____6439) {
        return or__3824__auto____6439
      }else {
        var or__3824__auto____6440 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____6440) {
          return or__3824__auto____6440
        }else {
          throw cljs.core.missing_protocol("IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3822__auto____6445 = o;
    if(and__3822__auto____6445) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____6445
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2363__auto____6446 = o == null ? null : o;
    return function() {
      var or__3824__auto____6447 = cljs.core._meta[goog.typeOf(x__2363__auto____6446)];
      if(or__3824__auto____6447) {
        return or__3824__auto____6447
      }else {
        var or__3824__auto____6448 = cljs.core._meta["_"];
        if(or__3824__auto____6448) {
          return or__3824__auto____6448
        }else {
          throw cljs.core.missing_protocol("IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3822__auto____6453 = o;
    if(and__3822__auto____6453) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____6453
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2363__auto____6454 = o == null ? null : o;
    return function() {
      var or__3824__auto____6455 = cljs.core._with_meta[goog.typeOf(x__2363__auto____6454)];
      if(or__3824__auto____6455) {
        return or__3824__auto____6455
      }else {
        var or__3824__auto____6456 = cljs.core._with_meta["_"];
        if(or__3824__auto____6456) {
          return or__3824__auto____6456
        }else {
          throw cljs.core.missing_protocol("IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3822__auto____6465 = coll;
      if(and__3822__auto____6465) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____6465
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2363__auto____6466 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6467 = cljs.core._reduce[goog.typeOf(x__2363__auto____6466)];
        if(or__3824__auto____6467) {
          return or__3824__auto____6467
        }else {
          var or__3824__auto____6468 = cljs.core._reduce["_"];
          if(or__3824__auto____6468) {
            return or__3824__auto____6468
          }else {
            throw cljs.core.missing_protocol("IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____6469 = coll;
      if(and__3822__auto____6469) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____6469
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2363__auto____6470 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6471 = cljs.core._reduce[goog.typeOf(x__2363__auto____6470)];
        if(or__3824__auto____6471) {
          return or__3824__auto____6471
        }else {
          var or__3824__auto____6472 = cljs.core._reduce["_"];
          if(or__3824__auto____6472) {
            return or__3824__auto____6472
          }else {
            throw cljs.core.missing_protocol("IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3822__auto____6477 = coll;
    if(and__3822__auto____6477) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____6477
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2363__auto____6478 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6479 = cljs.core._kv_reduce[goog.typeOf(x__2363__auto____6478)];
      if(or__3824__auto____6479) {
        return or__3824__auto____6479
      }else {
        var or__3824__auto____6480 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____6480) {
          return or__3824__auto____6480
        }else {
          throw cljs.core.missing_protocol("IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3822__auto____6485 = o;
    if(and__3822__auto____6485) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____6485
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2363__auto____6486 = o == null ? null : o;
    return function() {
      var or__3824__auto____6487 = cljs.core._equiv[goog.typeOf(x__2363__auto____6486)];
      if(or__3824__auto____6487) {
        return or__3824__auto____6487
      }else {
        var or__3824__auto____6488 = cljs.core._equiv["_"];
        if(or__3824__auto____6488) {
          return or__3824__auto____6488
        }else {
          throw cljs.core.missing_protocol("IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3822__auto____6493 = o;
    if(and__3822__auto____6493) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____6493
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2363__auto____6494 = o == null ? null : o;
    return function() {
      var or__3824__auto____6495 = cljs.core._hash[goog.typeOf(x__2363__auto____6494)];
      if(or__3824__auto____6495) {
        return or__3824__auto____6495
      }else {
        var or__3824__auto____6496 = cljs.core._hash["_"];
        if(or__3824__auto____6496) {
          return or__3824__auto____6496
        }else {
          throw cljs.core.missing_protocol("IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3822__auto____6501 = o;
    if(and__3822__auto____6501) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____6501
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2363__auto____6502 = o == null ? null : o;
    return function() {
      var or__3824__auto____6503 = cljs.core._seq[goog.typeOf(x__2363__auto____6502)];
      if(or__3824__auto____6503) {
        return or__3824__auto____6503
      }else {
        var or__3824__auto____6504 = cljs.core._seq["_"];
        if(or__3824__auto____6504) {
          return or__3824__auto____6504
        }else {
          throw cljs.core.missing_protocol("ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IList = {};
cljs.core.IRecord = {};
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3822__auto____6509 = coll;
    if(and__3822__auto____6509) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____6509
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2363__auto____6510 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6511 = cljs.core._rseq[goog.typeOf(x__2363__auto____6510)];
      if(or__3824__auto____6511) {
        return or__3824__auto____6511
      }else {
        var or__3824__auto____6512 = cljs.core._rseq["_"];
        if(or__3824__auto____6512) {
          return or__3824__auto____6512
        }else {
          throw cljs.core.missing_protocol("IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____6517 = coll;
    if(and__3822__auto____6517) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____6517
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2363__auto____6518 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6519 = cljs.core._sorted_seq[goog.typeOf(x__2363__auto____6518)];
      if(or__3824__auto____6519) {
        return or__3824__auto____6519
      }else {
        var or__3824__auto____6520 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____6520) {
          return or__3824__auto____6520
        }else {
          throw cljs.core.missing_protocol("ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____6525 = coll;
    if(and__3822__auto____6525) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____6525
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2363__auto____6526 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6527 = cljs.core._sorted_seq_from[goog.typeOf(x__2363__auto____6526)];
      if(or__3824__auto____6527) {
        return or__3824__auto____6527
      }else {
        var or__3824__auto____6528 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____6528) {
          return or__3824__auto____6528
        }else {
          throw cljs.core.missing_protocol("ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____6533 = coll;
    if(and__3822__auto____6533) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____6533
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2363__auto____6534 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6535 = cljs.core._entry_key[goog.typeOf(x__2363__auto____6534)];
      if(or__3824__auto____6535) {
        return or__3824__auto____6535
      }else {
        var or__3824__auto____6536 = cljs.core._entry_key["_"];
        if(or__3824__auto____6536) {
          return or__3824__auto____6536
        }else {
          throw cljs.core.missing_protocol("ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____6541 = coll;
    if(and__3822__auto____6541) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____6541
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2363__auto____6542 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6543 = cljs.core._comparator[goog.typeOf(x__2363__auto____6542)];
      if(or__3824__auto____6543) {
        return or__3824__auto____6543
      }else {
        var or__3824__auto____6544 = cljs.core._comparator["_"];
        if(or__3824__auto____6544) {
          return or__3824__auto____6544
        }else {
          throw cljs.core.missing_protocol("ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto____6549 = o;
    if(and__3822__auto____6549) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____6549
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2363__auto____6550 = o == null ? null : o;
    return function() {
      var or__3824__auto____6551 = cljs.core._pr_seq[goog.typeOf(x__2363__auto____6550)];
      if(or__3824__auto____6551) {
        return or__3824__auto____6551
      }else {
        var or__3824__auto____6552 = cljs.core._pr_seq["_"];
        if(or__3824__auto____6552) {
          return or__3824__auto____6552
        }else {
          throw cljs.core.missing_protocol("IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto____6557 = d;
    if(and__3822__auto____6557) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____6557
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2363__auto____6558 = d == null ? null : d;
    return function() {
      var or__3824__auto____6559 = cljs.core._realized_QMARK_[goog.typeOf(x__2363__auto____6558)];
      if(or__3824__auto____6559) {
        return or__3824__auto____6559
      }else {
        var or__3824__auto____6560 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____6560) {
          return or__3824__auto____6560
        }else {
          throw cljs.core.missing_protocol("IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3822__auto____6565 = this$;
    if(and__3822__auto____6565) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____6565
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2363__auto____6566 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6567 = cljs.core._notify_watches[goog.typeOf(x__2363__auto____6566)];
      if(or__3824__auto____6567) {
        return or__3824__auto____6567
      }else {
        var or__3824__auto____6568 = cljs.core._notify_watches["_"];
        if(or__3824__auto____6568) {
          return or__3824__auto____6568
        }else {
          throw cljs.core.missing_protocol("IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____6573 = this$;
    if(and__3822__auto____6573) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____6573
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2363__auto____6574 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6575 = cljs.core._add_watch[goog.typeOf(x__2363__auto____6574)];
      if(or__3824__auto____6575) {
        return or__3824__auto____6575
      }else {
        var or__3824__auto____6576 = cljs.core._add_watch["_"];
        if(or__3824__auto____6576) {
          return or__3824__auto____6576
        }else {
          throw cljs.core.missing_protocol("IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____6581 = this$;
    if(and__3822__auto____6581) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____6581
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2363__auto____6582 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6583 = cljs.core._remove_watch[goog.typeOf(x__2363__auto____6582)];
      if(or__3824__auto____6583) {
        return or__3824__auto____6583
      }else {
        var or__3824__auto____6584 = cljs.core._remove_watch["_"];
        if(or__3824__auto____6584) {
          return or__3824__auto____6584
        }else {
          throw cljs.core.missing_protocol("IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3822__auto____6589 = coll;
    if(and__3822__auto____6589) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____6589
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2363__auto____6590 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6591 = cljs.core._as_transient[goog.typeOf(x__2363__auto____6590)];
      if(or__3824__auto____6591) {
        return or__3824__auto____6591
      }else {
        var or__3824__auto____6592 = cljs.core._as_transient["_"];
        if(or__3824__auto____6592) {
          return or__3824__auto____6592
        }else {
          throw cljs.core.missing_protocol("IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3822__auto____6597 = tcoll;
    if(and__3822__auto____6597) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____6597
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2363__auto____6598 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6599 = cljs.core._conj_BANG_[goog.typeOf(x__2363__auto____6598)];
      if(or__3824__auto____6599) {
        return or__3824__auto____6599
      }else {
        var or__3824__auto____6600 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____6600) {
          return or__3824__auto____6600
        }else {
          throw cljs.core.missing_protocol("ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____6605 = tcoll;
    if(and__3822__auto____6605) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____6605
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____6606 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6607 = cljs.core._persistent_BANG_[goog.typeOf(x__2363__auto____6606)];
      if(or__3824__auto____6607) {
        return or__3824__auto____6607
      }else {
        var or__3824__auto____6608 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____6608) {
          return or__3824__auto____6608
        }else {
          throw cljs.core.missing_protocol("ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3822__auto____6613 = tcoll;
    if(and__3822__auto____6613) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____6613
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2363__auto____6614 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6615 = cljs.core._assoc_BANG_[goog.typeOf(x__2363__auto____6614)];
      if(or__3824__auto____6615) {
        return or__3824__auto____6615
      }else {
        var or__3824__auto____6616 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____6616) {
          return or__3824__auto____6616
        }else {
          throw cljs.core.missing_protocol("ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3822__auto____6621 = tcoll;
    if(and__3822__auto____6621) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____6621
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2363__auto____6622 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6623 = cljs.core._dissoc_BANG_[goog.typeOf(x__2363__auto____6622)];
      if(or__3824__auto____6623) {
        return or__3824__auto____6623
      }else {
        var or__3824__auto____6624 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____6624) {
          return or__3824__auto____6624
        }else {
          throw cljs.core.missing_protocol("ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3822__auto____6629 = tcoll;
    if(and__3822__auto____6629) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____6629
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2363__auto____6630 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6631 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2363__auto____6630)];
      if(or__3824__auto____6631) {
        return or__3824__auto____6631
      }else {
        var or__3824__auto____6632 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____6632) {
          return or__3824__auto____6632
        }else {
          throw cljs.core.missing_protocol("ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____6637 = tcoll;
    if(and__3822__auto____6637) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____6637
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____6638 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6639 = cljs.core._pop_BANG_[goog.typeOf(x__2363__auto____6638)];
      if(or__3824__auto____6639) {
        return or__3824__auto____6639
      }else {
        var or__3824__auto____6640 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____6640) {
          return or__3824__auto____6640
        }else {
          throw cljs.core.missing_protocol("ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3822__auto____6645 = tcoll;
    if(and__3822__auto____6645) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____6645
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2363__auto____6646 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6647 = cljs.core._disjoin_BANG_[goog.typeOf(x__2363__auto____6646)];
      if(or__3824__auto____6647) {
        return or__3824__auto____6647
      }else {
        var or__3824__auto____6648 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____6648) {
          return or__3824__auto____6648
        }else {
          throw cljs.core.missing_protocol("ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3822__auto____6653 = x;
    if(and__3822__auto____6653) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____6653
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2363__auto____6654 = x == null ? null : x;
    return function() {
      var or__3824__auto____6655 = cljs.core._compare[goog.typeOf(x__2363__auto____6654)];
      if(or__3824__auto____6655) {
        return or__3824__auto____6655
      }else {
        var or__3824__auto____6656 = cljs.core._compare["_"];
        if(or__3824__auto____6656) {
          return or__3824__auto____6656
        }else {
          throw cljs.core.missing_protocol("IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3822__auto____6661 = coll;
    if(and__3822__auto____6661) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____6661
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2363__auto____6662 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6663 = cljs.core._drop_first[goog.typeOf(x__2363__auto____6662)];
      if(or__3824__auto____6663) {
        return or__3824__auto____6663
      }else {
        var or__3824__auto____6664 = cljs.core._drop_first["_"];
        if(or__3824__auto____6664) {
          return or__3824__auto____6664
        }else {
          throw cljs.core.missing_protocol("IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3822__auto____6669 = coll;
    if(and__3822__auto____6669) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____6669
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2363__auto____6670 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6671 = cljs.core._chunked_first[goog.typeOf(x__2363__auto____6670)];
      if(or__3824__auto____6671) {
        return or__3824__auto____6671
      }else {
        var or__3824__auto____6672 = cljs.core._chunked_first["_"];
        if(or__3824__auto____6672) {
          return or__3824__auto____6672
        }else {
          throw cljs.core.missing_protocol("IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____6677 = coll;
    if(and__3822__auto____6677) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____6677
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2363__auto____6678 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6679 = cljs.core._chunked_rest[goog.typeOf(x__2363__auto____6678)];
      if(or__3824__auto____6679) {
        return or__3824__auto____6679
      }else {
        var or__3824__auto____6680 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____6680) {
          return or__3824__auto____6680
        }else {
          throw cljs.core.missing_protocol("IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3822__auto____6685 = coll;
    if(and__3822__auto____6685) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____6685
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2363__auto____6686 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6687 = cljs.core._chunked_next[goog.typeOf(x__2363__auto____6686)];
      if(or__3824__auto____6687) {
        return or__3824__auto____6687
      }else {
        var or__3824__auto____6688 = cljs.core._chunked_next["_"];
        if(or__3824__auto____6688) {
          return or__3824__auto____6688
        }else {
          throw cljs.core.missing_protocol("IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3824__auto____6690 = x === y;
    if(or__3824__auto____6690) {
      return or__3824__auto____6690
    }else {
      return cljs.core._equiv(x, y)
    }
  };
  var _EQ___3 = function() {
    var G__6691__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.cljs$lang$arity$2(x, y))) {
          if(cljs.core.next(more)) {
            var G__6692 = y;
            var G__6693 = cljs.core.first(more);
            var G__6694 = cljs.core.next(more);
            x = G__6692;
            y = G__6693;
            more = G__6694;
            continue
          }else {
            return _EQ_.cljs$lang$arity$2(y, cljs.core.first(more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6691 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6691__delegate.call(this, x, y, more)
    };
    G__6691.cljs$lang$maxFixedArity = 2;
    G__6691.cljs$lang$applyTo = function(arglist__6695) {
      var x = cljs.core.first(arglist__6695);
      var y = cljs.core.first(cljs.core.next(arglist__6695));
      var more = cljs.core.rest(cljs.core.next(arglist__6695));
      return G__6691__delegate(x, y, more)
    };
    G__6691.cljs$lang$arity$variadic = G__6691__delegate;
    return G__6691
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__6696 = null;
  var G__6696__2 = function(o, k) {
    return null
  };
  var G__6696__3 = function(o, k, not_found) {
    return not_found
  };
  G__6696 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6696__2.call(this, o, k);
      case 3:
        return G__6696__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6696
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.cljs$lang$arity$variadic(cljs.core.array_seq([k, v], 0))
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.cljs$lang$arity$1(o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__6697 = null;
  var G__6697__2 = function(_, f) {
    return f.cljs$lang$arity$0 ? f.cljs$lang$arity$0() : f.call(null)
  };
  var G__6697__3 = function(_, f, start) {
    return start
  };
  G__6697 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6697__2.call(this, _, f);
      case 3:
        return G__6697__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6697
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.cljs$lang$arity$1("nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.cljs$lang$arity$0()
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__6698 = null;
  var G__6698__2 = function(_, n) {
    return null
  };
  var G__6698__3 = function(_, n, not_found) {
    return not_found
  };
  G__6698 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6698__2.call(this, _, n);
      case 3:
        return G__6698__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6698
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var and__3822__auto____6699 = cljs.core.instance_QMARK_(Date, other);
  if(and__3822__auto____6699) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____6699
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt__6712 = cljs.core._count(cicoll);
    if(cnt__6712 === 0) {
      return f.cljs$lang$arity$0 ? f.cljs$lang$arity$0() : f.call(null)
    }else {
      var val__6713 = cljs.core._nth.cljs$lang$arity$2(cicoll, 0);
      var n__6714 = 1;
      while(true) {
        if(n__6714 < cnt__6712) {
          var nval__6715 = f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(val__6713, cljs.core._nth.cljs$lang$arity$2(cicoll, n__6714)) : f.call(null, val__6713, cljs.core._nth.cljs$lang$arity$2(cicoll, n__6714));
          if(cljs.core.reduced_QMARK_(nval__6715)) {
            return cljs.core.deref(nval__6715)
          }else {
            var G__6724 = nval__6715;
            var G__6725 = n__6714 + 1;
            val__6713 = G__6724;
            n__6714 = G__6725;
            continue
          }
        }else {
          return val__6713
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__6716 = cljs.core._count(cicoll);
    var val__6717 = val;
    var n__6718 = 0;
    while(true) {
      if(n__6718 < cnt__6716) {
        var nval__6719 = f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(val__6717, cljs.core._nth.cljs$lang$arity$2(cicoll, n__6718)) : f.call(null, val__6717, cljs.core._nth.cljs$lang$arity$2(cicoll, n__6718));
        if(cljs.core.reduced_QMARK_(nval__6719)) {
          return cljs.core.deref(nval__6719)
        }else {
          var G__6726 = nval__6719;
          var G__6727 = n__6718 + 1;
          val__6717 = G__6726;
          n__6718 = G__6727;
          continue
        }
      }else {
        return val__6717
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__6720 = cljs.core._count(cicoll);
    var val__6721 = val;
    var n__6722 = idx;
    while(true) {
      if(n__6722 < cnt__6720) {
        var nval__6723 = f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(val__6721, cljs.core._nth.cljs$lang$arity$2(cicoll, n__6722)) : f.call(null, val__6721, cljs.core._nth.cljs$lang$arity$2(cicoll, n__6722));
        if(cljs.core.reduced_QMARK_(nval__6723)) {
          return cljs.core.deref(nval__6723)
        }else {
          var G__6728 = nval__6723;
          var G__6729 = n__6722 + 1;
          val__6721 = G__6728;
          n__6722 = G__6729;
          continue
        }
      }else {
        return val__6721
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt__6742 = arr.length;
    if(arr.length === 0) {
      return f.cljs$lang$arity$0 ? f.cljs$lang$arity$0() : f.call(null)
    }else {
      var val__6743 = arr[0];
      var n__6744 = 1;
      while(true) {
        if(n__6744 < cnt__6742) {
          var nval__6745 = f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(val__6743, arr[n__6744]) : f.call(null, val__6743, arr[n__6744]);
          if(cljs.core.reduced_QMARK_(nval__6745)) {
            return cljs.core.deref(nval__6745)
          }else {
            var G__6754 = nval__6745;
            var G__6755 = n__6744 + 1;
            val__6743 = G__6754;
            n__6744 = G__6755;
            continue
          }
        }else {
          return val__6743
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__6746 = arr.length;
    var val__6747 = val;
    var n__6748 = 0;
    while(true) {
      if(n__6748 < cnt__6746) {
        var nval__6749 = f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(val__6747, arr[n__6748]) : f.call(null, val__6747, arr[n__6748]);
        if(cljs.core.reduced_QMARK_(nval__6749)) {
          return cljs.core.deref(nval__6749)
        }else {
          var G__6756 = nval__6749;
          var G__6757 = n__6748 + 1;
          val__6747 = G__6756;
          n__6748 = G__6757;
          continue
        }
      }else {
        return val__6747
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__6750 = arr.length;
    var val__6751 = val;
    var n__6752 = idx;
    while(true) {
      if(n__6752 < cnt__6750) {
        var nval__6753 = f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(val__6751, arr[n__6752]) : f.call(null, val__6751, arr[n__6752]);
        if(cljs.core.reduced_QMARK_(nval__6753)) {
          return cljs.core.deref(nval__6753)
        }else {
          var G__6758 = nval__6753;
          var G__6759 = n__6752 + 1;
          val__6751 = G__6758;
          n__6752 = G__6759;
          continue
        }
      }else {
        return val__6751
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_reduce.cljs$lang$arity$2 = array_reduce__2;
  array_reduce.cljs$lang$arity$3 = array_reduce__3;
  array_reduce.cljs$lang$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199546
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6760 = this;
  return cljs.core.hash_coll(coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__6761 = this;
  if(this__6761.i + 1 < this__6761.a.length) {
    return new cljs.core.IndexedSeq(this__6761.a, this__6761.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6762 = this;
  return cljs.core.cons(o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6763 = this;
  var c__6764 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__6764 > 0) {
    return new cljs.core.RSeq(coll, c__6764 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__6765 = this;
  var this__6766 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__6766], 0))
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__6767 = this;
  if(cljs.core.counted_QMARK_(this__6767.a)) {
    return cljs.core.ci_reduce.cljs$lang$arity$4(this__6767.a, f, this__6767.a[this__6767.i], this__6767.i + 1)
  }else {
    return cljs.core.ci_reduce.cljs$lang$arity$4(coll, f, this__6767.a[this__6767.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__6768 = this;
  if(cljs.core.counted_QMARK_(this__6768.a)) {
    return cljs.core.ci_reduce.cljs$lang$arity$4(this__6768.a, f, start, this__6768.i)
  }else {
    return cljs.core.ci_reduce.cljs$lang$arity$4(coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6769 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__6770 = this;
  return this__6770.a.length - this__6770.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__6771 = this;
  return this__6771.a[this__6771.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__6772 = this;
  if(this__6772.i + 1 < this__6772.a.length) {
    return new cljs.core.IndexedSeq(this__6772.a, this__6772.i + 1)
  }else {
    return cljs.core.list.cljs$lang$arity$0()
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6773 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__6774 = this;
  var i__6775 = n + this__6774.i;
  if(i__6775 < this__6774.a.length) {
    return this__6774.a[i__6775]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__6776 = this;
  var i__6777 = n + this__6776.i;
  if(i__6777 < this__6776.a.length) {
    return this__6776.a[i__6777]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.cljs$lang$arity$2(prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.cljs$lang$arity$2(array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.cljs$lang$arity$2(array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__6778 = null;
  var G__6778__2 = function(array, f) {
    return cljs.core.ci_reduce.cljs$lang$arity$2(array, f)
  };
  var G__6778__3 = function(array, f, start) {
    return cljs.core.ci_reduce.cljs$lang$arity$3(array, f, start)
  };
  G__6778 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6778__2.call(this, array, f);
      case 3:
        return G__6778__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6778
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__6779 = null;
  var G__6779__2 = function(array, k) {
    return array[k]
  };
  var G__6779__3 = function(array, k, not_found) {
    return cljs.core._nth.cljs$lang$arity$3(array, k, not_found)
  };
  G__6779 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6779__2.call(this, array, k);
      case 3:
        return G__6779__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6779
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__6780 = null;
  var G__6780__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__6780__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__6780 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6780__2.call(this, array, n);
      case 3:
        return G__6780__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6780
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.cljs$lang$arity$2(array, 0)
};
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6781 = this;
  return cljs.core.hash_coll(coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6782 = this;
  return cljs.core.cons(o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__6783 = this;
  var this__6784 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__6784], 0))
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6785 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6786 = this;
  return this__6786.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6787 = this;
  return cljs.core._nth.cljs$lang$arity$2(this__6787.ci, this__6787.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6788 = this;
  if(this__6788.i > 0) {
    return new cljs.core.RSeq(this__6788.ci, this__6788.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6789 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__6790 = this;
  return new cljs.core.RSeq(this__6790.ci, this__6790.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6791 = this;
  return this__6791.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6795__6796 = coll;
      if(G__6795__6796) {
        if(function() {
          var or__3824__auto____6797 = G__6795__6796.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____6797) {
            return or__3824__auto____6797
          }else {
            return G__6795__6796.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__6795__6796.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_(cljs.core.ASeq, G__6795__6796)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_(cljs.core.ASeq, G__6795__6796)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq(coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6802__6803 = coll;
      if(G__6802__6803) {
        if(function() {
          var or__3824__auto____6804 = G__6802__6803.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____6804) {
            return or__3824__auto____6804
          }else {
            return G__6802__6803.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6802__6803.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_(cljs.core.ISeq, G__6802__6803)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_(cljs.core.ISeq, G__6802__6803)
      }
    }()) {
      return cljs.core._first(coll)
    }else {
      var s__6805 = cljs.core.seq(coll);
      if(s__6805 == null) {
        return null
      }else {
        return cljs.core._first(s__6805)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__6810__6811 = coll;
      if(G__6810__6811) {
        if(function() {
          var or__3824__auto____6812 = G__6810__6811.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____6812) {
            return or__3824__auto____6812
          }else {
            return G__6810__6811.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6810__6811.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_(cljs.core.ISeq, G__6810__6811)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_(cljs.core.ISeq, G__6810__6811)
      }
    }()) {
      return cljs.core._rest(coll)
    }else {
      var s__6813 = cljs.core.seq(coll);
      if(!(s__6813 == null)) {
        return cljs.core._rest(s__6813)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6817__6818 = coll;
      if(G__6817__6818) {
        if(function() {
          var or__3824__auto____6819 = G__6817__6818.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____6819) {
            return or__3824__auto____6819
          }else {
            return G__6817__6818.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__6817__6818.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_(cljs.core.INext, G__6817__6818)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_(cljs.core.INext, G__6817__6818)
      }
    }()) {
      return cljs.core._next(coll)
    }else {
      return cljs.core.seq(cljs.core.rest(coll))
    }
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first(cljs.core.next(coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first(cljs.core.first(coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next(cljs.core.first(coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first(cljs.core.next(coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next(cljs.core.next(coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn__6821 = cljs.core.next(s);
    if(!(sn__6821 == null)) {
      var G__6822 = sn__6821;
      s = G__6822;
      continue
    }else {
      return cljs.core.first(s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj(coll, x)
  };
  var conj__3 = function() {
    var G__6823__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__6824 = conj.cljs$lang$arity$2(coll, x);
          var G__6825 = cljs.core.first(xs);
          var G__6826 = cljs.core.next(xs);
          coll = G__6824;
          x = G__6825;
          xs = G__6826;
          continue
        }else {
          return conj.cljs$lang$arity$2(coll, x)
        }
        break
      }
    };
    var G__6823 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6823__delegate.call(this, coll, x, xs)
    };
    G__6823.cljs$lang$maxFixedArity = 2;
    G__6823.cljs$lang$applyTo = function(arglist__6827) {
      var coll = cljs.core.first(arglist__6827);
      var x = cljs.core.first(cljs.core.next(arglist__6827));
      var xs = cljs.core.rest(cljs.core.next(arglist__6827));
      return G__6823__delegate(coll, x, xs)
    };
    G__6823.cljs$lang$arity$variadic = G__6823__delegate;
    return G__6823
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty(coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__6830 = cljs.core.seq(coll);
  var acc__6831 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_(s__6830)) {
      return acc__6831 + cljs.core._count(s__6830)
    }else {
      var G__6832 = cljs.core.next(s__6830);
      var G__6833 = acc__6831 + 1;
      s__6830 = G__6832;
      acc__6831 = G__6833;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_(coll)) {
    return cljs.core._count(coll)
  }else {
    return cljs.core.accumulating_seq_count(coll)
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.seq(coll)) {
          return cljs.core.first(coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_(coll)) {
          return cljs.core._nth.cljs$lang$arity$2(coll, n)
        }else {
          if(cljs.core.seq(coll)) {
            return linear_traversal_nth.cljs$lang$arity$2(cljs.core.next(coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.seq(coll)) {
          return cljs.core.first(coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_(coll)) {
          return cljs.core._nth.cljs$lang$arity$3(coll, n, not_found)
        }else {
          if(cljs.core.seq(coll)) {
            return linear_traversal_nth.cljs$lang$arity$3(cljs.core.next(coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__6840__6841 = coll;
        if(G__6840__6841) {
          if(function() {
            var or__3824__auto____6842 = G__6840__6841.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____6842) {
              return or__3824__auto____6842
            }else {
              return G__6840__6841.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6840__6841.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_(cljs.core.IIndexed, G__6840__6841)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_(cljs.core.IIndexed, G__6840__6841)
        }
      }()) {
        return cljs.core._nth.cljs$lang$arity$2(coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.cljs$lang$arity$2(coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__6843__6844 = coll;
        if(G__6843__6844) {
          if(function() {
            var or__3824__auto____6845 = G__6843__6844.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____6845) {
              return or__3824__auto____6845
            }else {
              return G__6843__6844.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6843__6844.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_(cljs.core.IIndexed, G__6843__6844)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_(cljs.core.IIndexed, G__6843__6844)
        }
      }()) {
        return cljs.core._nth.cljs$lang$arity$3(coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.cljs$lang$arity$3(coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.cljs$lang$arity$2(o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.cljs$lang$arity$3(o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc(coll, k, v)
  };
  var assoc__4 = function() {
    var G__6848__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__6847 = assoc.cljs$lang$arity$3(coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__6849 = ret__6847;
          var G__6850 = cljs.core.first(kvs);
          var G__6851 = cljs.core.second(kvs);
          var G__6852 = cljs.core.nnext(kvs);
          coll = G__6849;
          k = G__6850;
          v = G__6851;
          kvs = G__6852;
          continue
        }else {
          return ret__6847
        }
        break
      }
    };
    var G__6848 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6848__delegate.call(this, coll, k, v, kvs)
    };
    G__6848.cljs$lang$maxFixedArity = 3;
    G__6848.cljs$lang$applyTo = function(arglist__6853) {
      var coll = cljs.core.first(arglist__6853);
      var k = cljs.core.first(cljs.core.next(arglist__6853));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6853)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6853)));
      return G__6848__delegate(coll, k, v, kvs)
    };
    G__6848.cljs$lang$arity$variadic = G__6848__delegate;
    return G__6848
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc(coll, k)
  };
  var dissoc__3 = function() {
    var G__6856__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6855 = dissoc.cljs$lang$arity$2(coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6857 = ret__6855;
          var G__6858 = cljs.core.first(ks);
          var G__6859 = cljs.core.next(ks);
          coll = G__6857;
          k = G__6858;
          ks = G__6859;
          continue
        }else {
          return ret__6855
        }
        break
      }
    };
    var G__6856 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6856__delegate.call(this, coll, k, ks)
    };
    G__6856.cljs$lang$maxFixedArity = 2;
    G__6856.cljs$lang$applyTo = function(arglist__6860) {
      var coll = cljs.core.first(arglist__6860);
      var k = cljs.core.first(cljs.core.next(arglist__6860));
      var ks = cljs.core.rest(cljs.core.next(arglist__6860));
      return G__6856__delegate(coll, k, ks)
    };
    G__6856.cljs$lang$arity$variadic = G__6856__delegate;
    return G__6856
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta(o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__6864__6865 = o;
    if(G__6864__6865) {
      if(function() {
        var or__3824__auto____6866 = G__6864__6865.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____6866) {
          return or__3824__auto____6866
        }else {
          return G__6864__6865.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__6864__6865.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_(cljs.core.IMeta, G__6864__6865)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_(cljs.core.IMeta, G__6864__6865)
    }
  }()) {
    return cljs.core._meta(o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek(coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop(coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin(coll, k)
  };
  var disj__3 = function() {
    var G__6869__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6868 = disj.cljs$lang$arity$2(coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6870 = ret__6868;
          var G__6871 = cljs.core.first(ks);
          var G__6872 = cljs.core.next(ks);
          coll = G__6870;
          k = G__6871;
          ks = G__6872;
          continue
        }else {
          return ret__6868
        }
        break
      }
    };
    var G__6869 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6869__delegate.call(this, coll, k, ks)
    };
    G__6869.cljs$lang$maxFixedArity = 2;
    G__6869.cljs$lang$applyTo = function(arglist__6873) {
      var coll = cljs.core.first(arglist__6873);
      var k = cljs.core.first(cljs.core.next(arglist__6873));
      var ks = cljs.core.rest(cljs.core.next(arglist__6873));
      return G__6869__delegate(coll, k, ks)
    };
    G__6869.cljs$lang$arity$variadic = G__6869__delegate;
    return G__6869
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h__6875 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__6875;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__6875
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__6877 = cljs.core.string_hash_cache[k];
  if(!(h__6877 == null)) {
    return h__6877
  }else {
    return cljs.core.add_to_string_hash_cache(k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.cljs$lang$arity$2(o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3822__auto____6879 = goog.isString(o);
      if(and__3822__auto____6879) {
        return check_cache
      }else {
        return and__3822__auto____6879
      }
    }()) {
      return cljs.core.check_string_hash_cache(o)
    }else {
      return cljs.core._hash(o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash.cljs$lang$arity$1 = hash__1;
  hash.cljs$lang$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not(cljs.core.seq(coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6883__6884 = x;
    if(G__6883__6884) {
      if(function() {
        var or__3824__auto____6885 = G__6883__6884.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____6885) {
          return or__3824__auto____6885
        }else {
          return G__6883__6884.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__6883__6884.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_(cljs.core.ICollection, G__6883__6884)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_(cljs.core.ICollection, G__6883__6884)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6889__6890 = x;
    if(G__6889__6890) {
      if(function() {
        var or__3824__auto____6891 = G__6889__6890.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____6891) {
          return or__3824__auto____6891
        }else {
          return G__6889__6890.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__6889__6890.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_(cljs.core.ISet, G__6889__6890)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_(cljs.core.ISet, G__6889__6890)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__6895__6896 = x;
  if(G__6895__6896) {
    if(function() {
      var or__3824__auto____6897 = G__6895__6896.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____6897) {
        return or__3824__auto____6897
      }else {
        return G__6895__6896.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__6895__6896.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_(cljs.core.IAssociative, G__6895__6896)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_(cljs.core.IAssociative, G__6895__6896)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__6901__6902 = x;
  if(G__6901__6902) {
    if(function() {
      var or__3824__auto____6903 = G__6901__6902.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____6903) {
        return or__3824__auto____6903
      }else {
        return G__6901__6902.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__6901__6902.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_(cljs.core.ISequential, G__6901__6902)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_(cljs.core.ISequential, G__6901__6902)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__6907__6908 = x;
  if(G__6907__6908) {
    if(function() {
      var or__3824__auto____6909 = G__6907__6908.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____6909) {
        return or__3824__auto____6909
      }else {
        return G__6907__6908.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__6907__6908.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_(cljs.core.ICounted, G__6907__6908)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_(cljs.core.ICounted, G__6907__6908)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__6913__6914 = x;
  if(G__6913__6914) {
    if(function() {
      var or__3824__auto____6915 = G__6913__6914.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____6915) {
        return or__3824__auto____6915
      }else {
        return G__6913__6914.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__6913__6914.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_(cljs.core.IIndexed, G__6913__6914)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_(cljs.core.IIndexed, G__6913__6914)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__6919__6920 = x;
  if(G__6919__6920) {
    if(function() {
      var or__3824__auto____6921 = G__6919__6920.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____6921) {
        return or__3824__auto____6921
      }else {
        return G__6919__6920.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__6919__6920.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_(cljs.core.IReduce, G__6919__6920)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_(cljs.core.IReduce, G__6919__6920)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6925__6926 = x;
    if(G__6925__6926) {
      if(function() {
        var or__3824__auto____6927 = G__6925__6926.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____6927) {
          return or__3824__auto____6927
        }else {
          return G__6925__6926.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__6925__6926.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_(cljs.core.IMap, G__6925__6926)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_(cljs.core.IMap, G__6925__6926)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__6931__6932 = x;
  if(G__6931__6932) {
    if(function() {
      var or__3824__auto____6933 = G__6931__6932.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____6933) {
        return or__3824__auto____6933
      }else {
        return G__6931__6932.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__6931__6932.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_(cljs.core.IVector, G__6931__6932)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_(cljs.core.IVector, G__6931__6932)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__6937__6938 = x;
  if(G__6937__6938) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____6939 = null;
      if(cljs.core.truth_(or__3824__auto____6939)) {
        return or__3824__auto____6939
      }else {
        return G__6937__6938.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__6937__6938.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_(cljs.core.IChunkedSeq, G__6937__6938)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_(cljs.core.IChunkedSeq, G__6937__6938)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__6940__delegate = function(keyvals) {
      return cljs.core.apply.cljs$lang$arity$2(goog.object.create, keyvals)
    };
    var G__6940 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6940__delegate.call(this, keyvals)
    };
    G__6940.cljs$lang$maxFixedArity = 0;
    G__6940.cljs$lang$applyTo = function(arglist__6941) {
      var keyvals = cljs.core.seq(arglist__6941);
      return G__6940__delegate(keyvals)
    };
    G__6940.cljs$lang$arity$variadic = G__6940__delegate;
    return G__6940
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__6943 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__6943.push(key)
  });
  return keys__6943
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__6947 = i;
  var j__6948 = j;
  var len__6949 = len;
  while(true) {
    if(len__6949 === 0) {
      return to
    }else {
      to[j__6948] = from[i__6947];
      var G__6950 = i__6947 + 1;
      var G__6951 = j__6948 + 1;
      var G__6952 = len__6949 - 1;
      i__6947 = G__6950;
      j__6948 = G__6951;
      len__6949 = G__6952;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__6956 = i + (len - 1);
  var j__6957 = j + (len - 1);
  var len__6958 = len;
  while(true) {
    if(len__6958 === 0) {
      return to
    }else {
      to[j__6957] = from[i__6956];
      var G__6959 = i__6956 - 1;
      var G__6960 = j__6957 - 1;
      var G__6961 = len__6958 - 1;
      i__6956 = G__6959;
      j__6957 = G__6960;
      len__6958 = G__6961;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__6965__6966 = s;
    if(G__6965__6966) {
      if(function() {
        var or__3824__auto____6967 = G__6965__6966.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____6967) {
          return or__3824__auto____6967
        }else {
          return G__6965__6966.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__6965__6966.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_(cljs.core.ISeq, G__6965__6966)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_(cljs.core.ISeq, G__6965__6966)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__6971__6972 = s;
  if(G__6971__6972) {
    if(function() {
      var or__3824__auto____6973 = G__6971__6972.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____6973) {
        return or__3824__auto____6973
      }else {
        return G__6971__6972.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__6971__6972.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_(cljs.core.ISeqable, G__6971__6972)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_(cljs.core.ISeqable, G__6971__6972)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3822__auto____6976 = goog.isString(x);
  if(and__3822__auto____6976) {
    return!function() {
      var or__3824__auto____6977 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____6977) {
        return or__3824__auto____6977
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____6976
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____6979 = goog.isString(x);
  if(and__3822__auto____6979) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____6979
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____6981 = goog.isString(x);
  if(and__3822__auto____6981) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____6981
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____6986 = cljs.core.fn_QMARK_(f);
  if(or__3824__auto____6986) {
    return or__3824__auto____6986
  }else {
    var G__6987__6988 = f;
    if(G__6987__6988) {
      if(function() {
        var or__3824__auto____6989 = G__6987__6988.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____6989) {
          return or__3824__auto____6989
        }else {
          return G__6987__6988.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__6987__6988.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_(cljs.core.IFn, G__6987__6988)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_(cljs.core.IFn, G__6987__6988)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____6991 = cljs.core.number_QMARK_(n);
  if(and__3822__auto____6991) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____6991
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.cljs$lang$arity$3(coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____6994 = coll;
    if(cljs.core.truth_(and__3822__auto____6994)) {
      var and__3822__auto____6995 = cljs.core.associative_QMARK_(coll);
      if(and__3822__auto____6995) {
        return cljs.core.contains_QMARK_(coll, k)
      }else {
        return and__3822__auto____6995
      }
    }else {
      return and__3822__auto____6994
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.cljs$lang$arity$2(coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.cljs$lang$arity$2(x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__7004__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.cljs$lang$arity$2(x, y)) {
        var s__7000 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__7001 = more;
        while(true) {
          var x__7002 = cljs.core.first(xs__7001);
          var etc__7003 = cljs.core.next(xs__7001);
          if(cljs.core.truth_(xs__7001)) {
            if(cljs.core.contains_QMARK_(s__7000, x__7002)) {
              return false
            }else {
              var G__7005 = cljs.core.conj.cljs$lang$arity$2(s__7000, x__7002);
              var G__7006 = etc__7003;
              s__7000 = G__7005;
              xs__7001 = G__7006;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__7004 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7004__delegate.call(this, x, y, more)
    };
    G__7004.cljs$lang$maxFixedArity = 2;
    G__7004.cljs$lang$applyTo = function(arglist__7007) {
      var x = cljs.core.first(arglist__7007);
      var y = cljs.core.first(cljs.core.next(arglist__7007));
      var more = cljs.core.rest(cljs.core.next(arglist__7007));
      return G__7004__delegate(x, y, more)
    };
    G__7004.cljs$lang$arity$variadic = G__7004__delegate;
    return G__7004
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type(x) === cljs.core.type(y)) {
          if(function() {
            var G__7011__7012 = x;
            if(G__7011__7012) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____7013 = null;
                if(cljs.core.truth_(or__3824__auto____7013)) {
                  return or__3824__auto____7013
                }else {
                  return G__7011__7012.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__7011__7012.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_(cljs.core.IComparable, G__7011__7012)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_(cljs.core.IComparable, G__7011__7012)
            }
          }()) {
            return cljs.core._compare(x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0'else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl__7018 = cljs.core.count(xs);
    var yl__7019 = cljs.core.count(ys);
    if(xl__7018 < yl__7019) {
      return-1
    }else {
      if(xl__7018 > yl__7019) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.cljs$lang$arity$4(xs, ys, xl__7018, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__7020 = cljs.core.compare(cljs.core.nth.cljs$lang$arity$2(xs, n), cljs.core.nth.cljs$lang$arity$2(ys, n));
      if(function() {
        var and__3822__auto____7021 = d__7020 === 0;
        if(and__3822__auto____7021) {
          return n + 1 < len
        }else {
          return and__3822__auto____7021
        }
      }()) {
        var G__7022 = xs;
        var G__7023 = ys;
        var G__7024 = len;
        var G__7025 = n + 1;
        xs = G__7022;
        ys = G__7023;
        len = G__7024;
        n = G__7025;
        continue
      }else {
        return d__7020
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  compare_indexed.cljs$lang$arity$2 = compare_indexed__2;
  compare_indexed.cljs$lang$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.cljs$lang$arity$2(f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__7027 = f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(x, y) : f.call(null, x, y);
      if(cljs.core.number_QMARK_(r__7027)) {
        return r__7027
      }else {
        if(cljs.core.truth_(r__7027)) {
          return-1
        }else {
          if(cljs.core.truth_(f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(y, x) : f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.cljs$lang$arity$2(cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq(coll)) {
      var a__7029 = cljs.core.to_array(coll);
      goog.array.stableSort(a__7029, cljs.core.fn__GT_comparator(comp));
      return cljs.core.seq(a__7029)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.cljs$lang$arity$3(keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.cljs$lang$arity$2(function(x, y) {
      return cljs.core.fn__GT_comparator(comp).call(null, keyfn.cljs$lang$arity$1 ? keyfn.cljs$lang$arity$1(x) : keyfn.call(null, x), keyfn.cljs$lang$arity$1 ? keyfn.cljs$lang$arity$1(y) : keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3971__auto____7035 = cljs.core.seq(coll);
    if(temp__3971__auto____7035) {
      var s__7036 = temp__3971__auto____7035;
      return cljs.core.reduce.cljs$lang$arity$3(f, cljs.core.first(s__7036), cljs.core.next(s__7036))
    }else {
      return f.cljs$lang$arity$0 ? f.cljs$lang$arity$0() : f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__7037 = val;
    var coll__7038 = cljs.core.seq(coll);
    while(true) {
      if(coll__7038) {
        var nval__7039 = f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(val__7037, cljs.core.first(coll__7038)) : f.call(null, val__7037, cljs.core.first(coll__7038));
        if(cljs.core.reduced_QMARK_(nval__7039)) {
          return cljs.core.deref(nval__7039)
        }else {
          var G__7040 = nval__7039;
          var G__7041 = cljs.core.next(coll__7038);
          val__7037 = G__7040;
          coll__7038 = G__7041;
          continue
        }
      }else {
        return val__7037
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a__7043 = cljs.core.to_array(coll);
  goog.array.shuffle(a__7043);
  return cljs.core.vec(a__7043)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__7050__7051 = coll;
      if(G__7050__7051) {
        if(function() {
          var or__3824__auto____7052 = G__7050__7051.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7052) {
            return or__3824__auto____7052
          }else {
            return G__7050__7051.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7050__7051.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_(cljs.core.IReduce, G__7050__7051)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_(cljs.core.IReduce, G__7050__7051)
      }
    }()) {
      return cljs.core._reduce.cljs$lang$arity$2(coll, f)
    }else {
      return cljs.core.seq_reduce.cljs$lang$arity$2(f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__7053__7054 = coll;
      if(G__7053__7054) {
        if(function() {
          var or__3824__auto____7055 = G__7053__7054.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7055) {
            return or__3824__auto____7055
          }else {
            return G__7053__7054.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7053__7054.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_(cljs.core.IReduce, G__7053__7054)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_(cljs.core.IReduce, G__7053__7054)
      }
    }()) {
      return cljs.core._reduce.cljs$lang$arity$3(coll, f, val)
    }else {
      return cljs.core.seq_reduce.cljs$lang$arity$3(f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce(coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__7056 = this;
  return this__7056.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_(cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__7057__delegate = function(x, y, more) {
      return cljs.core.reduce.cljs$lang$arity$3(_PLUS_, x + y, more)
    };
    var G__7057 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7057__delegate.call(this, x, y, more)
    };
    G__7057.cljs$lang$maxFixedArity = 2;
    G__7057.cljs$lang$applyTo = function(arglist__7058) {
      var x = cljs.core.first(arglist__7058);
      var y = cljs.core.first(cljs.core.next(arglist__7058));
      var more = cljs.core.rest(cljs.core.next(arglist__7058));
      return G__7057__delegate(x, y, more)
    };
    G__7057.cljs$lang$arity$variadic = G__7057__delegate;
    return G__7057
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__7059__delegate = function(x, y, more) {
      return cljs.core.reduce.cljs$lang$arity$3(_, x - y, more)
    };
    var G__7059 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7059__delegate.call(this, x, y, more)
    };
    G__7059.cljs$lang$maxFixedArity = 2;
    G__7059.cljs$lang$applyTo = function(arglist__7060) {
      var x = cljs.core.first(arglist__7060);
      var y = cljs.core.first(cljs.core.next(arglist__7060));
      var more = cljs.core.rest(cljs.core.next(arglist__7060));
      return G__7059__delegate(x, y, more)
    };
    G__7059.cljs$lang$arity$variadic = G__7059__delegate;
    return G__7059
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__7061__delegate = function(x, y, more) {
      return cljs.core.reduce.cljs$lang$arity$3(_STAR_, x * y, more)
    };
    var G__7061 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7061__delegate.call(this, x, y, more)
    };
    G__7061.cljs$lang$maxFixedArity = 2;
    G__7061.cljs$lang$applyTo = function(arglist__7062) {
      var x = cljs.core.first(arglist__7062);
      var y = cljs.core.first(cljs.core.next(arglist__7062));
      var more = cljs.core.rest(cljs.core.next(arglist__7062));
      return G__7061__delegate(x, y, more)
    };
    G__7061.cljs$lang$arity$variadic = G__7061__delegate;
    return G__7061
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.cljs$lang$arity$2(1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__7063__delegate = function(x, y, more) {
      return cljs.core.reduce.cljs$lang$arity$3(_SLASH_, _SLASH_.cljs$lang$arity$2(x, y), more)
    };
    var G__7063 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7063__delegate.call(this, x, y, more)
    };
    G__7063.cljs$lang$maxFixedArity = 2;
    G__7063.cljs$lang$applyTo = function(arglist__7064) {
      var x = cljs.core.first(arglist__7064);
      var y = cljs.core.first(cljs.core.next(arglist__7064));
      var more = cljs.core.rest(cljs.core.next(arglist__7064));
      return G__7063__delegate(x, y, more)
    };
    G__7063.cljs$lang$arity$variadic = G__7063__delegate;
    return G__7063
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__7065__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next(more)) {
            var G__7066 = y;
            var G__7067 = cljs.core.first(more);
            var G__7068 = cljs.core.next(more);
            x = G__7066;
            y = G__7067;
            more = G__7068;
            continue
          }else {
            return y < cljs.core.first(more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7065 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7065__delegate.call(this, x, y, more)
    };
    G__7065.cljs$lang$maxFixedArity = 2;
    G__7065.cljs$lang$applyTo = function(arglist__7069) {
      var x = cljs.core.first(arglist__7069);
      var y = cljs.core.first(cljs.core.next(arglist__7069));
      var more = cljs.core.rest(cljs.core.next(arglist__7069));
      return G__7065__delegate(x, y, more)
    };
    G__7065.cljs$lang$arity$variadic = G__7065__delegate;
    return G__7065
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__7070__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next(more)) {
            var G__7071 = y;
            var G__7072 = cljs.core.first(more);
            var G__7073 = cljs.core.next(more);
            x = G__7071;
            y = G__7072;
            more = G__7073;
            continue
          }else {
            return y <= cljs.core.first(more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7070 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7070__delegate.call(this, x, y, more)
    };
    G__7070.cljs$lang$maxFixedArity = 2;
    G__7070.cljs$lang$applyTo = function(arglist__7074) {
      var x = cljs.core.first(arglist__7074);
      var y = cljs.core.first(cljs.core.next(arglist__7074));
      var more = cljs.core.rest(cljs.core.next(arglist__7074));
      return G__7070__delegate(x, y, more)
    };
    G__7070.cljs$lang$arity$variadic = G__7070__delegate;
    return G__7070
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__7075__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next(more)) {
            var G__7076 = y;
            var G__7077 = cljs.core.first(more);
            var G__7078 = cljs.core.next(more);
            x = G__7076;
            y = G__7077;
            more = G__7078;
            continue
          }else {
            return y > cljs.core.first(more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7075 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7075__delegate.call(this, x, y, more)
    };
    G__7075.cljs$lang$maxFixedArity = 2;
    G__7075.cljs$lang$applyTo = function(arglist__7079) {
      var x = cljs.core.first(arglist__7079);
      var y = cljs.core.first(cljs.core.next(arglist__7079));
      var more = cljs.core.rest(cljs.core.next(arglist__7079));
      return G__7075__delegate(x, y, more)
    };
    G__7075.cljs$lang$arity$variadic = G__7075__delegate;
    return G__7075
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__7080__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next(more)) {
            var G__7081 = y;
            var G__7082 = cljs.core.first(more);
            var G__7083 = cljs.core.next(more);
            x = G__7081;
            y = G__7082;
            more = G__7083;
            continue
          }else {
            return y >= cljs.core.first(more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7080 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7080__delegate.call(this, x, y, more)
    };
    G__7080.cljs$lang$maxFixedArity = 2;
    G__7080.cljs$lang$applyTo = function(arglist__7084) {
      var x = cljs.core.first(arglist__7084);
      var y = cljs.core.first(cljs.core.next(arglist__7084));
      var more = cljs.core.rest(cljs.core.next(arglist__7084));
      return G__7080__delegate(x, y, more)
    };
    G__7080.cljs$lang$arity$variadic = G__7080__delegate;
    return G__7080
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__7085__delegate = function(x, y, more) {
      return cljs.core.reduce.cljs$lang$arity$3(max, x > y ? x : y, more)
    };
    var G__7085 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7085__delegate.call(this, x, y, more)
    };
    G__7085.cljs$lang$maxFixedArity = 2;
    G__7085.cljs$lang$applyTo = function(arglist__7086) {
      var x = cljs.core.first(arglist__7086);
      var y = cljs.core.first(cljs.core.next(arglist__7086));
      var more = cljs.core.rest(cljs.core.next(arglist__7086));
      return G__7085__delegate(x, y, more)
    };
    G__7085.cljs$lang$arity$variadic = G__7085__delegate;
    return G__7085
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__7087__delegate = function(x, y, more) {
      return cljs.core.reduce.cljs$lang$arity$3(min, x < y ? x : y, more)
    };
    var G__7087 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7087__delegate.call(this, x, y, more)
    };
    G__7087.cljs$lang$maxFixedArity = 2;
    G__7087.cljs$lang$applyTo = function(arglist__7088) {
      var x = cljs.core.first(arglist__7088);
      var y = cljs.core.first(cljs.core.next(arglist__7088));
      var more = cljs.core.rest(cljs.core.next(arglist__7088));
      return G__7087__delegate(x, y, more)
    };
    G__7087.cljs$lang$arity$variadic = G__7087__delegate;
    return G__7087
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.cljs$lang$arity$1 ? Math.floor.cljs$lang$arity$1(q) : Math.floor.call(null, q)
  }else {
    return Math.ceil.cljs$lang$arity$1 ? Math.ceil.cljs$lang$arity$1(q) : Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix(x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix(x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__7090 = n % d;
  return cljs.core.fix((n - rem__7090) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__7092 = cljs.core.quot(n, d);
  return n - d * q__7092
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.cljs$lang$arity$0 ? Math.random.cljs$lang$arity$0() : Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.cljs$lang$arity$0()
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix(cljs.core.rand.cljs$lang$arity$1(n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__7095 = v - (v >> 1 & 1431655765);
  var v__7096 = (v__7095 & 858993459) + (v__7095 >> 2 & 858993459);
  return(v__7096 + (v__7096 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv(x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__7097__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.cljs$lang$arity$2(x, y))) {
          if(cljs.core.next(more)) {
            var G__7098 = y;
            var G__7099 = cljs.core.first(more);
            var G__7100 = cljs.core.next(more);
            x = G__7098;
            y = G__7099;
            more = G__7100;
            continue
          }else {
            return _EQ__EQ_.cljs$lang$arity$2(y, cljs.core.first(more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7097 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7097__delegate.call(this, x, y, more)
    };
    G__7097.cljs$lang$maxFixedArity = 2;
    G__7097.cljs$lang$applyTo = function(arglist__7101) {
      var x = cljs.core.first(arglist__7101);
      var y = cljs.core.first(cljs.core.next(arglist__7101));
      var more = cljs.core.rest(cljs.core.next(arglist__7101));
      return G__7097__delegate(x, y, more)
    };
    G__7097.cljs$lang$arity$variadic = G__7097__delegate;
    return G__7097
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__7105 = n;
  var xs__7106 = cljs.core.seq(coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____7107 = xs__7106;
      if(and__3822__auto____7107) {
        return n__7105 > 0
      }else {
        return and__3822__auto____7107
      }
    }())) {
      var G__7108 = n__7105 - 1;
      var G__7109 = cljs.core.next(xs__7106);
      n__7105 = G__7108;
      xs__7106 = G__7109;
      continue
    }else {
      return xs__7106
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__7110__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7111 = sb.append(str_STAR_.cljs$lang$arity$1(cljs.core.first(more)));
            var G__7112 = cljs.core.next(more);
            sb = G__7111;
            more = G__7112;
            continue
          }else {
            return str_STAR_.cljs$lang$arity$1(sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.cljs$lang$arity$1(x)), ys)
    };
    var G__7110 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7110__delegate.call(this, x, ys)
    };
    G__7110.cljs$lang$maxFixedArity = 1;
    G__7110.cljs$lang$applyTo = function(arglist__7113) {
      var x = cljs.core.first(arglist__7113);
      var ys = cljs.core.rest(arglist__7113);
      return G__7110__delegate(x, ys)
    };
    G__7110.cljs$lang$arity$variadic = G__7110__delegate;
    return G__7110
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_(x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_(x)) {
        return cljs.core.str_STAR_.cljs$lang$arity$variadic(":", cljs.core.array_seq([x.substring(2, x.length)], 0))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__7114__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7115 = sb.append(str.cljs$lang$arity$1(cljs.core.first(more)));
            var G__7116 = cljs.core.next(more);
            sb = G__7115;
            more = G__7116;
            continue
          }else {
            return cljs.core.str_STAR_.cljs$lang$arity$1(sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.cljs$lang$arity$1(x)), ys)
    };
    var G__7114 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7114__delegate.call(this, x, ys)
    };
    G__7114.cljs$lang$maxFixedArity = 1;
    G__7114.cljs$lang$applyTo = function(arglist__7117) {
      var x = cljs.core.first(arglist__7117);
      var ys = cljs.core.rest(arglist__7117);
      return G__7114__delegate(x, ys)
    };
    G__7114.cljs$lang$arity$variadic = G__7114__delegate;
    return G__7114
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.format = function() {
  var format__delegate = function(fmt, args) {
    return cljs.core.apply.cljs$lang$arity$3(goog.string.format, fmt, args)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__7118) {
    var fmt = cljs.core.first(arglist__7118);
    var args = cljs.core.rest(arglist__7118);
    return format__delegate(fmt, args)
  };
  format.cljs$lang$arity$variadic = format__delegate;
  return format
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_(name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_(name)) {
        cljs.core.str_STAR_.cljs$lang$arity$variadic("\ufdd1", cljs.core.array_seq(["'", cljs.core.subs.cljs$lang$arity$2(name, 2)], 0))
      }else {
      }
    }
    return cljs.core.str_STAR_.cljs$lang$arity$variadic("\ufdd1", cljs.core.array_seq(["'", name], 0))
  };
  var symbol__2 = function(ns, name) {
    return symbol.cljs$lang$arity$1(cljs.core.str_STAR_.cljs$lang$arity$variadic(ns, cljs.core.array_seq(["/", name], 0)))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_(name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_(name)) {
        return cljs.core.str_STAR_.cljs$lang$arity$variadic("\ufdd0", cljs.core.array_seq(["'", cljs.core.subs.cljs$lang$arity$2(name, 2)], 0))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.cljs$lang$arity$variadic("\ufdd0", cljs.core.array_seq(["'", name], 0))
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.cljs$lang$arity$1(cljs.core.str_STAR_.cljs$lang$arity$variadic(ns, cljs.core.array_seq(["/", name], 0)))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$(cljs.core.sequential_QMARK_(y) ? function() {
    var xs__7121 = cljs.core.seq(x);
    var ys__7122 = cljs.core.seq(y);
    while(true) {
      if(xs__7121 == null) {
        return ys__7122 == null
      }else {
        if(ys__7122 == null) {
          return false
        }else {
          if(cljs.core._EQ_.cljs$lang$arity$2(cljs.core.first(xs__7121), cljs.core.first(ys__7122))) {
            var G__7123 = cljs.core.next(xs__7121);
            var G__7124 = cljs.core.next(ys__7122);
            xs__7121 = G__7123;
            ys__7122 = G__7124;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.cljs$lang$arity$3(function(p1__7125_SHARP_, p2__7126_SHARP_) {
    return cljs.core.hash_combine(p1__7125_SHARP_, cljs.core.hash.cljs$lang$arity$2(p2__7126_SHARP_, false))
  }, cljs.core.hash.cljs$lang$arity$2(cljs.core.first(coll), false), cljs.core.next(coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__7130 = 0;
  var s__7131 = cljs.core.seq(m);
  while(true) {
    if(s__7131) {
      var e__7132 = cljs.core.first(s__7131);
      var G__7133 = (h__7130 + (cljs.core.hash.cljs$lang$arity$1(cljs.core.key(e__7132)) ^ cljs.core.hash.cljs$lang$arity$1(cljs.core.val(e__7132)))) % 4503599627370496;
      var G__7134 = cljs.core.next(s__7131);
      h__7130 = G__7133;
      s__7131 = G__7134;
      continue
    }else {
      return h__7130
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__7138 = 0;
  var s__7139 = cljs.core.seq(s);
  while(true) {
    if(s__7139) {
      var e__7140 = cljs.core.first(s__7139);
      var G__7141 = (h__7138 + cljs.core.hash.cljs$lang$arity$1(e__7140)) % 4503599627370496;
      var G__7142 = cljs.core.next(s__7139);
      h__7138 = G__7141;
      s__7139 = G__7142;
      continue
    }else {
      return h__7138
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__7163__7164 = cljs.core.seq(fn_map);
  if(G__7163__7164) {
    var G__7166__7168 = cljs.core.first(G__7163__7164);
    var vec__7167__7169 = G__7166__7168;
    var key_name__7170 = cljs.core.nth.cljs$lang$arity$3(vec__7167__7169, 0, null);
    var f__7171 = cljs.core.nth.cljs$lang$arity$3(vec__7167__7169, 1, null);
    var G__7163__7172 = G__7163__7164;
    var G__7166__7173 = G__7166__7168;
    var G__7163__7174 = G__7163__7172;
    while(true) {
      var vec__7175__7176 = G__7166__7173;
      var key_name__7177 = cljs.core.nth.cljs$lang$arity$3(vec__7175__7176, 0, null);
      var f__7178 = cljs.core.nth.cljs$lang$arity$3(vec__7175__7176, 1, null);
      var G__7163__7179 = G__7163__7174;
      var str_name__7180 = cljs.core.name(key_name__7177);
      obj[str_name__7180] = f__7178;
      var temp__3974__auto____7181 = cljs.core.next(G__7163__7179);
      if(temp__3974__auto____7181) {
        var G__7163__7182 = temp__3974__auto____7181;
        var G__7183 = cljs.core.first(G__7163__7182);
        var G__7184 = G__7163__7182;
        G__7166__7173 = G__7183;
        G__7163__7174 = G__7184;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7185 = this;
  var h__2192__auto____7186 = this__7185.__hash;
  if(!(h__2192__auto____7186 == null)) {
    return h__2192__auto____7186
  }else {
    var h__2192__auto____7187 = cljs.core.hash_coll(coll);
    this__7185.__hash = h__2192__auto____7187;
    return h__2192__auto____7187
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7188 = this;
  if(this__7188.count === 1) {
    return null
  }else {
    return this__7188.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7189 = this;
  return new cljs.core.List(this__7189.meta, o, coll, this__7189.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__7190 = this;
  var this__7191 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__7191], 0))
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7192 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7193 = this;
  return this__7193.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7194 = this;
  return this__7194.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7195 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7196 = this;
  return this__7196.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7197 = this;
  if(this__7197.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__7197.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7198 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7199 = this;
  return new cljs.core.List(meta, this__7199.first, this__7199.rest, this__7199.count, this__7199.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7200 = this;
  return this__7200.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7201 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7202 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7203 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7204 = this;
  return new cljs.core.List(this__7204.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__7205 = this;
  var this__7206 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__7206], 0))
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7207 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7208 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7209 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7210 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7211 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7212 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7213 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7214 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7215 = this;
  return this__7215.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7216 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__7220__7221 = coll;
  if(G__7220__7221) {
    if(function() {
      var or__3824__auto____7222 = G__7220__7221.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____7222) {
        return or__3824__auto____7222
      }else {
        return G__7220__7221.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__7220__7221.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_(cljs.core.IReversible, G__7220__7221)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_(cljs.core.IReversible, G__7220__7221)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq(coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_(coll)) {
    return cljs.core.rseq(coll)
  }else {
    return cljs.core.reduce.cljs$lang$arity$3(cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.cljs$lang$arity$2(cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.cljs$lang$arity$2(list.cljs$lang$arity$1(y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.cljs$lang$arity$2(list.cljs$lang$arity$2(y, z), x)
  };
  var list__4 = function() {
    var G__7223__delegate = function(x, y, z, items) {
      return cljs.core.conj.cljs$lang$arity$2(cljs.core.conj.cljs$lang$arity$2(cljs.core.conj.cljs$lang$arity$2(cljs.core.reduce.cljs$lang$arity$3(cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse(items)), z), y), x)
    };
    var G__7223 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7223__delegate.call(this, x, y, z, items)
    };
    G__7223.cljs$lang$maxFixedArity = 3;
    G__7223.cljs$lang$applyTo = function(arglist__7224) {
      var x = cljs.core.first(arglist__7224);
      var y = cljs.core.first(cljs.core.next(arglist__7224));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7224)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7224)));
      return G__7223__delegate(x, y, z, items)
    };
    G__7223.cljs$lang$arity$variadic = G__7223__delegate;
    return G__7223
  }();
  list = function(x, y, z, var_args) {
    var items = var_args;
    switch(arguments.length) {
      case 0:
        return list__0.call(this);
      case 1:
        return list__1.call(this, x);
      case 2:
        return list__2.call(this, x, y);
      case 3:
        return list__3.call(this, x, y, z);
      default:
        return list__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list.cljs$lang$maxFixedArity = 3;
  list.cljs$lang$applyTo = list__4.cljs$lang$applyTo;
  list.cljs$lang$arity$0 = list__0;
  list.cljs$lang$arity$1 = list__1;
  list.cljs$lang$arity$2 = list__2;
  list.cljs$lang$arity$3 = list__3;
  list.cljs$lang$arity$variadic = list__4.cljs$lang$arity$variadic;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7225 = this;
  var h__2192__auto____7226 = this__7225.__hash;
  if(!(h__2192__auto____7226 == null)) {
    return h__2192__auto____7226
  }else {
    var h__2192__auto____7227 = cljs.core.hash_coll(coll);
    this__7225.__hash = h__2192__auto____7227;
    return h__2192__auto____7227
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7228 = this;
  if(this__7228.rest == null) {
    return null
  }else {
    return cljs.core._seq(this__7228.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7229 = this;
  return new cljs.core.Cons(null, o, coll, this__7229.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__7230 = this;
  var this__7231 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__7231], 0))
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7232 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7233 = this;
  return this__7233.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7234 = this;
  if(this__7234.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7234.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7235 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7236 = this;
  return new cljs.core.Cons(meta, this__7236.first, this__7236.rest, this__7236.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7237 = this;
  return this__7237.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7238 = this;
  return cljs.core.with_meta(cljs.core.List.EMPTY, this__7238.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____7243 = coll == null;
    if(or__3824__auto____7243) {
      return or__3824__auto____7243
    }else {
      var G__7244__7245 = coll;
      if(G__7244__7245) {
        if(function() {
          var or__3824__auto____7246 = G__7244__7245.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7246) {
            return or__3824__auto____7246
          }else {
            return G__7244__7245.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7244__7245.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_(cljs.core.ISeq, G__7244__7245)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_(cljs.core.ISeq, G__7244__7245)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq(coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__7250__7251 = x;
  if(G__7250__7251) {
    if(function() {
      var or__3824__auto____7252 = G__7250__7251.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____7252) {
        return or__3824__auto____7252
      }else {
        return G__7250__7251.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__7250__7251.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_(cljs.core.IList, G__7250__7251)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_(cljs.core.IList, G__7250__7251)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__7253 = null;
  var G__7253__2 = function(string, f) {
    return cljs.core.ci_reduce.cljs$lang$arity$2(string, f)
  };
  var G__7253__3 = function(string, f, start) {
    return cljs.core.ci_reduce.cljs$lang$arity$3(string, f, start)
  };
  G__7253 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7253__2.call(this, string, f);
      case 3:
        return G__7253__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7253
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__7254 = null;
  var G__7254__2 = function(string, k) {
    return cljs.core._nth.cljs$lang$arity$2(string, k)
  };
  var G__7254__3 = function(string, k, not_found) {
    return cljs.core._nth.cljs$lang$arity$3(string, k, not_found)
  };
  G__7254 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7254__2.call(this, string, k);
      case 3:
        return G__7254__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7254
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__7255 = null;
  var G__7255__2 = function(string, n) {
    if(n < cljs.core._count(string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__7255__3 = function(string, n, not_found) {
    if(n < cljs.core._count(string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__7255 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7255__2.call(this, string, n);
      case 3:
        return G__7255__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7255
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.cljs$lang$arity$2(string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__7267 = null;
  var G__7267__2 = function(this_sym7258, coll) {
    var this__7260 = this;
    var this_sym7258__7261 = this;
    var ___7262 = this_sym7258__7261;
    if(coll == null) {
      return null
    }else {
      var strobj__7263 = coll.strobj;
      if(strobj__7263 == null) {
        return cljs.core._lookup.cljs$lang$arity$3(coll, this__7260.k, null)
      }else {
        return strobj__7263[this__7260.k]
      }
    }
  };
  var G__7267__3 = function(this_sym7259, coll, not_found) {
    var this__7260 = this;
    var this_sym7259__7264 = this;
    var ___7265 = this_sym7259__7264;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.cljs$lang$arity$3(coll, this__7260.k, not_found)
    }
  };
  G__7267 = function(this_sym7259, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7267__2.call(this, this_sym7259, coll);
      case 3:
        return G__7267__3.call(this, this_sym7259, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7267
}();
cljs.core.Keyword.prototype.apply = function(this_sym7256, args7257) {
  var this__7266 = this;
  return this_sym7256.call.apply(this_sym7256, [this_sym7256].concat(args7257.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__7276 = null;
  var G__7276__2 = function(this_sym7270, coll) {
    var this_sym7270__7272 = this;
    var this__7273 = this_sym7270__7272;
    return cljs.core._lookup.cljs$lang$arity$3(coll, this__7273.toString(), null)
  };
  var G__7276__3 = function(this_sym7271, coll, not_found) {
    var this_sym7271__7274 = this;
    var this__7275 = this_sym7271__7274;
    return cljs.core._lookup.cljs$lang$arity$3(coll, this__7275.toString(), not_found)
  };
  G__7276 = function(this_sym7271, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7276__2.call(this, this_sym7271, coll);
      case 3:
        return G__7276__3.call(this, this_sym7271, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7276
}();
String.prototype.apply = function(this_sym7268, args7269) {
  return this_sym7268.call.apply(this_sym7268, [this_sym7268].concat(args7269.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count(args) < 2) {
    return cljs.core._lookup.cljs$lang$arity$3(args[0], s, null)
  }else {
    return cljs.core._lookup.cljs$lang$arity$3(args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__7278 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__7278
  }else {
    lazy_seq.x = x__7278.cljs$lang$arity$0 ? x__7278.cljs$lang$arity$0() : x__7278.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7279 = this;
  var h__2192__auto____7280 = this__7279.__hash;
  if(!(h__2192__auto____7280 == null)) {
    return h__2192__auto____7280
  }else {
    var h__2192__auto____7281 = cljs.core.hash_coll(coll);
    this__7279.__hash = h__2192__auto____7281;
    return h__2192__auto____7281
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7282 = this;
  return cljs.core._seq(coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7283 = this;
  return cljs.core.cons(o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__7284 = this;
  var this__7285 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__7285], 0))
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7286 = this;
  return cljs.core.seq(cljs.core.lazy_seq_value(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7287 = this;
  return cljs.core.first(cljs.core.lazy_seq_value(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7288 = this;
  return cljs.core.rest(cljs.core.lazy_seq_value(coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7289 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7290 = this;
  return new cljs.core.LazySeq(meta, this__7290.realized, this__7290.x, this__7290.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7291 = this;
  return this__7291.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7292 = this;
  return cljs.core.with_meta(cljs.core.List.EMPTY, this__7292.meta)
};
cljs.core.LazySeq;
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7293 = this;
  return this__7293.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__7294 = this;
  var ___7295 = this;
  this__7294.buf[this__7294.end] = o;
  return this__7294.end = this__7294.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__7296 = this;
  var ___7297 = this;
  var ret__7298 = new cljs.core.ArrayChunk(this__7296.buf, 0, this__7296.end);
  this__7296.buf = null;
  return ret__7298
};
cljs.core.ChunkBuffer;
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.cljs$lang$arity$1(capacity), 0)
};
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__7299 = this;
  return cljs.core.ci_reduce.cljs$lang$arity$4(coll, f, this__7299.arr[this__7299.off], this__7299.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7300 = this;
  return cljs.core.ci_reduce.cljs$lang$arity$4(coll, f, start, this__7300.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__7301 = this;
  if(this__7301.off === this__7301.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__7301.arr, this__7301.off + 1, this__7301.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__7302 = this;
  return this__7302.arr[this__7302.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__7303 = this;
  if(function() {
    var and__3822__auto____7304 = i >= 0;
    if(and__3822__auto____7304) {
      return i < this__7303.end - this__7303.off
    }else {
      return and__3822__auto____7304
    }
  }()) {
    return this__7303.arr[this__7303.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7305 = this;
  return this__7305.end - this__7305.off
};
cljs.core.ArrayChunk;
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.cljs$lang$arity$3(arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.cljs$lang$arity$3(arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_chunk.cljs$lang$arity$1 = array_chunk__1;
  array_chunk.cljs$lang$arity$2 = array_chunk__2;
  array_chunk.cljs$lang$arity$3 = array_chunk__3;
  return array_chunk
}();
cljs.core.ChunkedCons = function(chunk, more, meta) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27656296
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__7306 = this;
  return cljs.core.cons(o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7307 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7308 = this;
  return cljs.core._nth.cljs$lang$arity$2(this__7308.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7309 = this;
  if(cljs.core._count(this__7309.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first(this__7309.chunk), this__7309.more, this__7309.meta)
  }else {
    if(this__7309.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__7309.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__7310 = this;
  if(this__7310.more == null) {
    return null
  }else {
    return this__7310.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7311 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__7312 = this;
  return new cljs.core.ChunkedCons(this__7312.chunk, this__7312.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7313 = this;
  return this__7313.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__7314 = this;
  return this__7314.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__7315 = this;
  if(this__7315.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7315.more
  }
};
cljs.core.ChunkedCons;
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count(chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first(s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest(s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__7319__7320 = s;
    if(G__7319__7320) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____7321 = null;
        if(cljs.core.truth_(or__3824__auto____7321)) {
          return or__3824__auto____7321
        }else {
          return G__7319__7320.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__7319__7320.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_(cljs.core.IChunkedNext, G__7319__7320)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_(cljs.core.IChunkedNext, G__7319__7320)
    }
  }()) {
    return cljs.core._chunked_next(s)
  }else {
    return cljs.core.seq(cljs.core._chunked_rest(s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__7324 = [];
  var s__7325 = s;
  while(true) {
    if(cljs.core.seq(s__7325)) {
      ary__7324.push(cljs.core.first(s__7325));
      var G__7326 = cljs.core.next(s__7325);
      s__7325 = G__7326;
      continue
    }else {
      return ary__7324
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__7330 = cljs.core.make_array.cljs$lang$arity$1(cljs.core.count(coll));
  var i__7331 = 0;
  var xs__7332 = cljs.core.seq(coll);
  while(true) {
    if(xs__7332) {
      ret__7330[i__7331] = cljs.core.to_array(cljs.core.first(xs__7332));
      var G__7333 = i__7331 + 1;
      var G__7334 = cljs.core.next(xs__7332);
      i__7331 = G__7333;
      xs__7332 = G__7334;
      continue
    }else {
    }
    break
  }
  return ret__7330
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_(size_or_seq)) {
      return long_array.cljs$lang$arity$2(size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_(size_or_seq)) {
        return cljs.core.into_array.cljs$lang$arity$1(size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__7342 = cljs.core.make_array.cljs$lang$arity$1(size);
    if(cljs.core.seq_QMARK_(init_val_or_seq)) {
      var s__7343 = cljs.core.seq(init_val_or_seq);
      var i__7344 = 0;
      var s__7345 = s__7343;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7346 = s__7345;
          if(and__3822__auto____7346) {
            return i__7344 < size
          }else {
            return and__3822__auto____7346
          }
        }())) {
          a__7342[i__7344] = cljs.core.first(s__7345);
          var G__7349 = i__7344 + 1;
          var G__7350 = cljs.core.next(s__7345);
          i__7344 = G__7349;
          s__7345 = G__7350;
          continue
        }else {
          return a__7342
        }
        break
      }
    }else {
      var n__2527__auto____7347 = size;
      var i__7348 = 0;
      while(true) {
        if(i__7348 < n__2527__auto____7347) {
          a__7342[i__7348] = init_val_or_seq;
          var G__7351 = i__7348 + 1;
          i__7348 = G__7351;
          continue
        }else {
        }
        break
      }
      return a__7342
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_(size_or_seq)) {
      return double_array.cljs$lang$arity$2(size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_(size_or_seq)) {
        return cljs.core.into_array.cljs$lang$arity$1(size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__7359 = cljs.core.make_array.cljs$lang$arity$1(size);
    if(cljs.core.seq_QMARK_(init_val_or_seq)) {
      var s__7360 = cljs.core.seq(init_val_or_seq);
      var i__7361 = 0;
      var s__7362 = s__7360;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7363 = s__7362;
          if(and__3822__auto____7363) {
            return i__7361 < size
          }else {
            return and__3822__auto____7363
          }
        }())) {
          a__7359[i__7361] = cljs.core.first(s__7362);
          var G__7366 = i__7361 + 1;
          var G__7367 = cljs.core.next(s__7362);
          i__7361 = G__7366;
          s__7362 = G__7367;
          continue
        }else {
          return a__7359
        }
        break
      }
    }else {
      var n__2527__auto____7364 = size;
      var i__7365 = 0;
      while(true) {
        if(i__7365 < n__2527__auto____7364) {
          a__7359[i__7365] = init_val_or_seq;
          var G__7368 = i__7365 + 1;
          i__7365 = G__7368;
          continue
        }else {
        }
        break
      }
      return a__7359
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_(size_or_seq)) {
      return object_array.cljs$lang$arity$2(size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_(size_or_seq)) {
        return cljs.core.into_array.cljs$lang$arity$1(size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__7376 = cljs.core.make_array.cljs$lang$arity$1(size);
    if(cljs.core.seq_QMARK_(init_val_or_seq)) {
      var s__7377 = cljs.core.seq(init_val_or_seq);
      var i__7378 = 0;
      var s__7379 = s__7377;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7380 = s__7379;
          if(and__3822__auto____7380) {
            return i__7378 < size
          }else {
            return and__3822__auto____7380
          }
        }())) {
          a__7376[i__7378] = cljs.core.first(s__7379);
          var G__7383 = i__7378 + 1;
          var G__7384 = cljs.core.next(s__7379);
          i__7378 = G__7383;
          s__7379 = G__7384;
          continue
        }else {
          return a__7376
        }
        break
      }
    }else {
      var n__2527__auto____7381 = size;
      var i__7382 = 0;
      while(true) {
        if(i__7382 < n__2527__auto____7381) {
          a__7376[i__7382] = init_val_or_seq;
          var G__7385 = i__7382 + 1;
          i__7382 = G__7385;
          continue
        }else {
        }
        break
      }
      return a__7376
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_(s)) {
    return cljs.core.count(s)
  }else {
    var s__7390 = s;
    var i__7391 = n;
    var sum__7392 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____7393 = i__7391 > 0;
        if(and__3822__auto____7393) {
          return cljs.core.seq(s__7390)
        }else {
          return and__3822__auto____7393
        }
      }())) {
        var G__7394 = cljs.core.next(s__7390);
        var G__7395 = i__7391 - 1;
        var G__7396 = sum__7392 + 1;
        s__7390 = G__7394;
        i__7391 = G__7395;
        sum__7392 = G__7396;
        continue
      }else {
        return sum__7392
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next(arglist) == null) {
      return cljs.core.seq(cljs.core.first(arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons(cljs.core.first(arglist), spread(cljs.core.next(arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__7401 = cljs.core.seq(x);
      if(s__7401) {
        if(cljs.core.chunked_seq_QMARK_(s__7401)) {
          return cljs.core.chunk_cons(cljs.core.chunk_first(s__7401), concat.cljs$lang$arity$2(cljs.core.chunk_rest(s__7401), y))
        }else {
          return cljs.core.cons(cljs.core.first(s__7401), concat.cljs$lang$arity$2(cljs.core.rest(s__7401), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__7405__delegate = function(x, y, zs) {
      var cat__7404 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__7403 = cljs.core.seq(xys);
          if(xys__7403) {
            if(cljs.core.chunked_seq_QMARK_(xys__7403)) {
              return cljs.core.chunk_cons(cljs.core.chunk_first(xys__7403), cat(cljs.core.chunk_rest(xys__7403), zs))
            }else {
              return cljs.core.cons(cljs.core.first(xys__7403), cat(cljs.core.rest(xys__7403), zs))
            }
          }else {
            if(cljs.core.truth_(zs)) {
              return cat(cljs.core.first(zs), cljs.core.next(zs))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat__7404.cljs$lang$arity$2 ? cat__7404.cljs$lang$arity$2(concat.cljs$lang$arity$2(x, y), zs) : cat__7404.call(null, concat.cljs$lang$arity$2(x, y), zs)
    };
    var G__7405 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7405__delegate.call(this, x, y, zs)
    };
    G__7405.cljs$lang$maxFixedArity = 2;
    G__7405.cljs$lang$applyTo = function(arglist__7406) {
      var x = cljs.core.first(arglist__7406);
      var y = cljs.core.first(cljs.core.next(arglist__7406));
      var zs = cljs.core.rest(cljs.core.next(arglist__7406));
      return G__7405__delegate(x, y, zs)
    };
    G__7405.cljs$lang$arity$variadic = G__7405__delegate;
    return G__7405
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq(args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons(a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons(a, cljs.core.cons(b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons(a, cljs.core.cons(b, cljs.core.cons(c, args)))
  };
  var list_STAR___5 = function() {
    var G__7407__delegate = function(a, b, c, d, more) {
      return cljs.core.cons(a, cljs.core.cons(b, cljs.core.cons(c, cljs.core.cons(d, cljs.core.spread(more)))))
    };
    var G__7407 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7407__delegate.call(this, a, b, c, d, more)
    };
    G__7407.cljs$lang$maxFixedArity = 4;
    G__7407.cljs$lang$applyTo = function(arglist__7408) {
      var a = cljs.core.first(arglist__7408);
      var b = cljs.core.first(cljs.core.next(arglist__7408));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7408)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7408))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7408))));
      return G__7407__delegate(a, b, c, d, more)
    };
    G__7407.cljs$lang$arity$variadic = G__7407__delegate;
    return G__7407
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient(coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_(tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_(tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_(tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_(tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_(tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_(tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__7450 = cljs.core.seq(args);
  if(argc === 0) {
    return f.cljs$lang$arity$0 ? f.cljs$lang$arity$0() : f.call(null)
  }else {
    var a__7451 = cljs.core._first(args__7450);
    var args__7452 = cljs.core._rest(args__7450);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__7451)
      }else {
        return f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(a__7451) : f.call(null, a__7451)
      }
    }else {
      var b__7453 = cljs.core._first(args__7452);
      var args__7454 = cljs.core._rest(args__7452);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__7451, b__7453)
        }else {
          return f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(a__7451, b__7453) : f.call(null, a__7451, b__7453)
        }
      }else {
        var c__7455 = cljs.core._first(args__7454);
        var args__7456 = cljs.core._rest(args__7454);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__7451, b__7453, c__7455)
          }else {
            return f.cljs$lang$arity$3 ? f.cljs$lang$arity$3(a__7451, b__7453, c__7455) : f.call(null, a__7451, b__7453, c__7455)
          }
        }else {
          var d__7457 = cljs.core._first(args__7456);
          var args__7458 = cljs.core._rest(args__7456);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__7451, b__7453, c__7455, d__7457)
            }else {
              return f.cljs$lang$arity$4 ? f.cljs$lang$arity$4(a__7451, b__7453, c__7455, d__7457) : f.call(null, a__7451, b__7453, c__7455, d__7457)
            }
          }else {
            var e__7459 = cljs.core._first(args__7458);
            var args__7460 = cljs.core._rest(args__7458);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__7451, b__7453, c__7455, d__7457, e__7459)
              }else {
                return f.cljs$lang$arity$5 ? f.cljs$lang$arity$5(a__7451, b__7453, c__7455, d__7457, e__7459) : f.call(null, a__7451, b__7453, c__7455, d__7457, e__7459)
              }
            }else {
              var f__7461 = cljs.core._first(args__7460);
              var args__7462 = cljs.core._rest(args__7460);
              if(argc === 6) {
                if(f__7461.cljs$lang$arity$6) {
                  return f__7461.cljs$lang$arity$6(a__7451, b__7453, c__7455, d__7457, e__7459, f__7461)
                }else {
                  return f__7461.cljs$lang$arity$6 ? f__7461.cljs$lang$arity$6(a__7451, b__7453, c__7455, d__7457, e__7459, f__7461) : f__7461.call(null, a__7451, b__7453, c__7455, d__7457, e__7459, f__7461)
                }
              }else {
                var g__7463 = cljs.core._first(args__7462);
                var args__7464 = cljs.core._rest(args__7462);
                if(argc === 7) {
                  if(f__7461.cljs$lang$arity$7) {
                    return f__7461.cljs$lang$arity$7(a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463)
                  }else {
                    return f__7461.cljs$lang$arity$7 ? f__7461.cljs$lang$arity$7(a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463) : f__7461.call(null, a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463)
                  }
                }else {
                  var h__7465 = cljs.core._first(args__7464);
                  var args__7466 = cljs.core._rest(args__7464);
                  if(argc === 8) {
                    if(f__7461.cljs$lang$arity$8) {
                      return f__7461.cljs$lang$arity$8(a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465)
                    }else {
                      return f__7461.cljs$lang$arity$8 ? f__7461.cljs$lang$arity$8(a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465) : f__7461.call(null, a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465)
                    }
                  }else {
                    var i__7467 = cljs.core._first(args__7466);
                    var args__7468 = cljs.core._rest(args__7466);
                    if(argc === 9) {
                      if(f__7461.cljs$lang$arity$9) {
                        return f__7461.cljs$lang$arity$9(a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467)
                      }else {
                        return f__7461.cljs$lang$arity$9 ? f__7461.cljs$lang$arity$9(a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467) : f__7461.call(null, a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467)
                      }
                    }else {
                      var j__7469 = cljs.core._first(args__7468);
                      var args__7470 = cljs.core._rest(args__7468);
                      if(argc === 10) {
                        if(f__7461.cljs$lang$arity$10) {
                          return f__7461.cljs$lang$arity$10(a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467, j__7469)
                        }else {
                          return f__7461.cljs$lang$arity$10 ? f__7461.cljs$lang$arity$10(a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467, j__7469) : f__7461.call(null, a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467, j__7469)
                        }
                      }else {
                        var k__7471 = cljs.core._first(args__7470);
                        var args__7472 = cljs.core._rest(args__7470);
                        if(argc === 11) {
                          if(f__7461.cljs$lang$arity$11) {
                            return f__7461.cljs$lang$arity$11(a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467, j__7469, k__7471)
                          }else {
                            return f__7461.cljs$lang$arity$11 ? f__7461.cljs$lang$arity$11(a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467, j__7469, k__7471) : f__7461.call(null, a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467, j__7469, k__7471)
                          }
                        }else {
                          var l__7473 = cljs.core._first(args__7472);
                          var args__7474 = cljs.core._rest(args__7472);
                          if(argc === 12) {
                            if(f__7461.cljs$lang$arity$12) {
                              return f__7461.cljs$lang$arity$12(a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467, j__7469, k__7471, l__7473)
                            }else {
                              return f__7461.cljs$lang$arity$12 ? f__7461.cljs$lang$arity$12(a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467, j__7469, k__7471, l__7473) : f__7461.call(null, a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467, j__7469, k__7471, l__7473)
                            }
                          }else {
                            var m__7475 = cljs.core._first(args__7474);
                            var args__7476 = cljs.core._rest(args__7474);
                            if(argc === 13) {
                              if(f__7461.cljs$lang$arity$13) {
                                return f__7461.cljs$lang$arity$13(a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467, j__7469, k__7471, l__7473, m__7475)
                              }else {
                                return f__7461.cljs$lang$arity$13 ? f__7461.cljs$lang$arity$13(a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467, j__7469, k__7471, l__7473, m__7475) : f__7461.call(null, a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467, j__7469, k__7471, l__7473, m__7475)
                              }
                            }else {
                              var n__7477 = cljs.core._first(args__7476);
                              var args__7478 = cljs.core._rest(args__7476);
                              if(argc === 14) {
                                if(f__7461.cljs$lang$arity$14) {
                                  return f__7461.cljs$lang$arity$14(a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467, j__7469, k__7471, l__7473, m__7475, n__7477)
                                }else {
                                  return f__7461.cljs$lang$arity$14 ? f__7461.cljs$lang$arity$14(a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467, j__7469, k__7471, l__7473, m__7475, n__7477) : f__7461.call(null, a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467, j__7469, k__7471, l__7473, m__7475, n__7477)
                                }
                              }else {
                                var o__7479 = cljs.core._first(args__7478);
                                var args__7480 = cljs.core._rest(args__7478);
                                if(argc === 15) {
                                  if(f__7461.cljs$lang$arity$15) {
                                    return f__7461.cljs$lang$arity$15(a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467, j__7469, k__7471, l__7473, m__7475, n__7477, o__7479)
                                  }else {
                                    return f__7461.cljs$lang$arity$15 ? f__7461.cljs$lang$arity$15(a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467, j__7469, k__7471, l__7473, m__7475, n__7477, o__7479) : f__7461.call(null, a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467, j__7469, k__7471, l__7473, m__7475, n__7477, o__7479)
                                  }
                                }else {
                                  var p__7481 = cljs.core._first(args__7480);
                                  var args__7482 = cljs.core._rest(args__7480);
                                  if(argc === 16) {
                                    if(f__7461.cljs$lang$arity$16) {
                                      return f__7461.cljs$lang$arity$16(a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467, j__7469, k__7471, l__7473, m__7475, n__7477, o__7479, p__7481)
                                    }else {
                                      return f__7461.cljs$lang$arity$16 ? f__7461.cljs$lang$arity$16(a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467, j__7469, k__7471, l__7473, m__7475, n__7477, o__7479, p__7481) : f__7461.call(null, a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467, j__7469, k__7471, l__7473, m__7475, n__7477, o__7479, p__7481)
                                    }
                                  }else {
                                    var q__7483 = cljs.core._first(args__7482);
                                    var args__7484 = cljs.core._rest(args__7482);
                                    if(argc === 17) {
                                      if(f__7461.cljs$lang$arity$17) {
                                        return f__7461.cljs$lang$arity$17(a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467, j__7469, k__7471, l__7473, m__7475, n__7477, o__7479, p__7481, q__7483)
                                      }else {
                                        return f__7461.cljs$lang$arity$17 ? f__7461.cljs$lang$arity$17(a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467, j__7469, k__7471, l__7473, m__7475, n__7477, o__7479, p__7481, q__7483) : f__7461.call(null, a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467, j__7469, k__7471, l__7473, m__7475, n__7477, o__7479, p__7481, q__7483)
                                      }
                                    }else {
                                      var r__7485 = cljs.core._first(args__7484);
                                      var args__7486 = cljs.core._rest(args__7484);
                                      if(argc === 18) {
                                        if(f__7461.cljs$lang$arity$18) {
                                          return f__7461.cljs$lang$arity$18(a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467, j__7469, k__7471, l__7473, m__7475, n__7477, o__7479, p__7481, q__7483, r__7485)
                                        }else {
                                          return f__7461.cljs$lang$arity$18 ? f__7461.cljs$lang$arity$18(a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467, j__7469, k__7471, l__7473, m__7475, n__7477, o__7479, p__7481, q__7483, r__7485) : f__7461.call(null, a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467, j__7469, k__7471, l__7473, m__7475, n__7477, o__7479, p__7481, q__7483, r__7485)
                                        }
                                      }else {
                                        var s__7487 = cljs.core._first(args__7486);
                                        var args__7488 = cljs.core._rest(args__7486);
                                        if(argc === 19) {
                                          if(f__7461.cljs$lang$arity$19) {
                                            return f__7461.cljs$lang$arity$19(a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467, j__7469, k__7471, l__7473, m__7475, n__7477, o__7479, p__7481, q__7483, r__7485, s__7487)
                                          }else {
                                            return f__7461.cljs$lang$arity$19 ? f__7461.cljs$lang$arity$19(a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467, j__7469, k__7471, l__7473, m__7475, n__7477, o__7479, p__7481, q__7483, r__7485, s__7487) : f__7461.call(null, a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467, j__7469, k__7471, l__7473, m__7475, n__7477, o__7479, p__7481, q__7483, r__7485, s__7487)
                                          }
                                        }else {
                                          var t__7489 = cljs.core._first(args__7488);
                                          var args__7490 = cljs.core._rest(args__7488);
                                          if(argc === 20) {
                                            if(f__7461.cljs$lang$arity$20) {
                                              return f__7461.cljs$lang$arity$20(a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467, j__7469, k__7471, l__7473, m__7475, n__7477, o__7479, p__7481, q__7483, r__7485, s__7487, t__7489)
                                            }else {
                                              return f__7461.cljs$lang$arity$20 ? f__7461.cljs$lang$arity$20(a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467, j__7469, k__7471, l__7473, m__7475, n__7477, o__7479, p__7481, q__7483, r__7485, s__7487, t__7489) : f__7461.call(null, a__7451, b__7453, c__7455, d__7457, e__7459, f__7461, g__7463, h__7465, i__7467, j__7469, k__7471, l__7473, m__7475, n__7477, o__7479, p__7481, q__7483, r__7485, s__7487, t__7489)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__7505 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7506 = cljs.core.bounded_count(args, fixed_arity__7505 + 1);
      if(bc__7506 <= fixed_arity__7505) {
        return cljs.core.apply_to(f, bc__7506, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array(args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__7507 = cljs.core.list_STAR_.cljs$lang$arity$2(x, args);
    var fixed_arity__7508 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7509 = cljs.core.bounded_count(arglist__7507, fixed_arity__7508 + 1);
      if(bc__7509 <= fixed_arity__7508) {
        return cljs.core.apply_to(f, bc__7509, arglist__7507)
      }else {
        return f.cljs$lang$applyTo(arglist__7507)
      }
    }else {
      return f.apply(f, cljs.core.to_array(arglist__7507))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__7510 = cljs.core.list_STAR_.cljs$lang$arity$3(x, y, args);
    var fixed_arity__7511 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7512 = cljs.core.bounded_count(arglist__7510, fixed_arity__7511 + 1);
      if(bc__7512 <= fixed_arity__7511) {
        return cljs.core.apply_to(f, bc__7512, arglist__7510)
      }else {
        return f.cljs$lang$applyTo(arglist__7510)
      }
    }else {
      return f.apply(f, cljs.core.to_array(arglist__7510))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__7513 = cljs.core.list_STAR_.cljs$lang$arity$4(x, y, z, args);
    var fixed_arity__7514 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7515 = cljs.core.bounded_count(arglist__7513, fixed_arity__7514 + 1);
      if(bc__7515 <= fixed_arity__7514) {
        return cljs.core.apply_to(f, bc__7515, arglist__7513)
      }else {
        return f.cljs$lang$applyTo(arglist__7513)
      }
    }else {
      return f.apply(f, cljs.core.to_array(arglist__7513))
    }
  };
  var apply__6 = function() {
    var G__7519__delegate = function(f, a, b, c, d, args) {
      var arglist__7516 = cljs.core.cons(a, cljs.core.cons(b, cljs.core.cons(c, cljs.core.cons(d, cljs.core.spread(args)))));
      var fixed_arity__7517 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__7518 = cljs.core.bounded_count(arglist__7516, fixed_arity__7517 + 1);
        if(bc__7518 <= fixed_arity__7517) {
          return cljs.core.apply_to(f, bc__7518, arglist__7516)
        }else {
          return f.cljs$lang$applyTo(arglist__7516)
        }
      }else {
        return f.apply(f, cljs.core.to_array(arglist__7516))
      }
    };
    var G__7519 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__7519__delegate.call(this, f, a, b, c, d, args)
    };
    G__7519.cljs$lang$maxFixedArity = 5;
    G__7519.cljs$lang$applyTo = function(arglist__7520) {
      var f = cljs.core.first(arglist__7520);
      var a = cljs.core.first(cljs.core.next(arglist__7520));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7520)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7520))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7520)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7520)))));
      return G__7519__delegate(f, a, b, c, d, args)
    };
    G__7519.cljs$lang$arity$variadic = G__7519__delegate;
    return G__7519
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta(obj, cljs.core.apply.cljs$lang$arity$3(f, cljs.core.meta(obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__7521) {
    var obj = cljs.core.first(arglist__7521);
    var f = cljs.core.first(cljs.core.next(arglist__7521));
    var args = cljs.core.rest(cljs.core.next(arglist__7521));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.cljs$lang$arity$2(x, y)
  };
  var not_EQ___3 = function() {
    var G__7522__delegate = function(x, y, more) {
      return cljs.core.not(cljs.core.apply.cljs$lang$arity$4(cljs.core._EQ_, x, y, more))
    };
    var G__7522 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7522__delegate.call(this, x, y, more)
    };
    G__7522.cljs$lang$maxFixedArity = 2;
    G__7522.cljs$lang$applyTo = function(arglist__7523) {
      var x = cljs.core.first(arglist__7523);
      var y = cljs.core.first(cljs.core.next(arglist__7523));
      var more = cljs.core.rest(cljs.core.next(arglist__7523));
      return G__7522__delegate(x, y, more)
    };
    G__7522.cljs$lang$arity$variadic = G__7522__delegate;
    return G__7522
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq(coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq(coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.cljs$lang$arity$1 ? pred.cljs$lang$arity$1(cljs.core.first(coll)) : pred.call(null, cljs.core.first(coll)))) {
        var G__7524 = pred;
        var G__7525 = cljs.core.next(coll);
        pred = G__7524;
        coll = G__7525;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_(pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq(coll)) {
      var or__3824__auto____7527 = pred.cljs$lang$arity$1 ? pred.cljs$lang$arity$1(cljs.core.first(coll)) : pred.call(null, cljs.core.first(coll));
      if(cljs.core.truth_(or__3824__auto____7527)) {
        return or__3824__auto____7527
      }else {
        var G__7528 = pred;
        var G__7529 = cljs.core.next(coll);
        pred = G__7528;
        coll = G__7529;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not(cljs.core.some(pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_(n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_(n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__7530 = null;
    var G__7530__0 = function() {
      return cljs.core.not(f.cljs$lang$arity$0 ? f.cljs$lang$arity$0() : f.call(null))
    };
    var G__7530__1 = function(x) {
      return cljs.core.not(f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(x) : f.call(null, x))
    };
    var G__7530__2 = function(x, y) {
      return cljs.core.not(f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(x, y) : f.call(null, x, y))
    };
    var G__7530__3 = function() {
      var G__7531__delegate = function(x, y, zs) {
        return cljs.core.not(cljs.core.apply.cljs$lang$arity$4(f, x, y, zs))
      };
      var G__7531 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__7531__delegate.call(this, x, y, zs)
      };
      G__7531.cljs$lang$maxFixedArity = 2;
      G__7531.cljs$lang$applyTo = function(arglist__7532) {
        var x = cljs.core.first(arglist__7532);
        var y = cljs.core.first(cljs.core.next(arglist__7532));
        var zs = cljs.core.rest(cljs.core.next(arglist__7532));
        return G__7531__delegate(x, y, zs)
      };
      G__7531.cljs$lang$arity$variadic = G__7531__delegate;
      return G__7531
    }();
    G__7530 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__7530__0.call(this);
        case 1:
          return G__7530__1.call(this, x);
        case 2:
          return G__7530__2.call(this, x, y);
        default:
          return G__7530__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__7530.cljs$lang$maxFixedArity = 2;
    G__7530.cljs$lang$applyTo = G__7530__3.cljs$lang$applyTo;
    return G__7530
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__7533__delegate = function(args) {
      return x
    };
    var G__7533 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7533__delegate.call(this, args)
    };
    G__7533.cljs$lang$maxFixedArity = 0;
    G__7533.cljs$lang$applyTo = function(arglist__7534) {
      var args = cljs.core.seq(arglist__7534);
      return G__7533__delegate(args)
    };
    G__7533.cljs$lang$arity$variadic = G__7533__delegate;
    return G__7533
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__7541 = null;
      var G__7541__0 = function() {
        return f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(g.cljs$lang$arity$0 ? g.cljs$lang$arity$0() : g.call(null)) : f.call(null, g.cljs$lang$arity$0 ? g.cljs$lang$arity$0() : g.call(null))
      };
      var G__7541__1 = function(x) {
        return f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(g.cljs$lang$arity$1 ? g.cljs$lang$arity$1(x) : g.call(null, x)) : f.call(null, g.cljs$lang$arity$1 ? g.cljs$lang$arity$1(x) : g.call(null, x))
      };
      var G__7541__2 = function(x, y) {
        return f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(g.cljs$lang$arity$2 ? g.cljs$lang$arity$2(x, y) : g.call(null, x, y)) : f.call(null, g.cljs$lang$arity$2 ? g.cljs$lang$arity$2(x, y) : g.call(null, x, y))
      };
      var G__7541__3 = function(x, y, z) {
        return f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(g.cljs$lang$arity$3 ? g.cljs$lang$arity$3(x, y, z) : g.call(null, x, y, z)) : f.call(null, g.cljs$lang$arity$3 ? g.cljs$lang$arity$3(x, y, z) : g.call(null, x, y, z))
      };
      var G__7541__4 = function() {
        var G__7542__delegate = function(x, y, z, args) {
          return f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(cljs.core.apply.cljs$lang$arity$5(g, x, y, z, args)) : f.call(null, cljs.core.apply.cljs$lang$arity$5(g, x, y, z, args))
        };
        var G__7542 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7542__delegate.call(this, x, y, z, args)
        };
        G__7542.cljs$lang$maxFixedArity = 3;
        G__7542.cljs$lang$applyTo = function(arglist__7543) {
          var x = cljs.core.first(arglist__7543);
          var y = cljs.core.first(cljs.core.next(arglist__7543));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7543)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7543)));
          return G__7542__delegate(x, y, z, args)
        };
        G__7542.cljs$lang$arity$variadic = G__7542__delegate;
        return G__7542
      }();
      G__7541 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7541__0.call(this);
          case 1:
            return G__7541__1.call(this, x);
          case 2:
            return G__7541__2.call(this, x, y);
          case 3:
            return G__7541__3.call(this, x, y, z);
          default:
            return G__7541__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7541.cljs$lang$maxFixedArity = 3;
      G__7541.cljs$lang$applyTo = G__7541__4.cljs$lang$applyTo;
      return G__7541
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__7544 = null;
      var G__7544__0 = function() {
        return f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(g.cljs$lang$arity$1 ? g.cljs$lang$arity$1(h.cljs$lang$arity$0 ? h.cljs$lang$arity$0() : h.call(null)) : g.call(null, h.cljs$lang$arity$0 ? h.cljs$lang$arity$0() : h.call(null))) : f.call(null, g.cljs$lang$arity$1 ? g.cljs$lang$arity$1(h.cljs$lang$arity$0 ? h.cljs$lang$arity$0() : h.call(null)) : g.call(null, h.cljs$lang$arity$0 ? h.cljs$lang$arity$0() : h.call(null)))
      };
      var G__7544__1 = function(x) {
        return f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(g.cljs$lang$arity$1 ? g.cljs$lang$arity$1(h.cljs$lang$arity$1 ? h.cljs$lang$arity$1(x) : h.call(null, x)) : g.call(null, h.cljs$lang$arity$1 ? h.cljs$lang$arity$1(x) : h.call(null, x))) : f.call(null, g.cljs$lang$arity$1 ? g.cljs$lang$arity$1(h.cljs$lang$arity$1 ? h.cljs$lang$arity$1(x) : h.call(null, x)) : g.call(null, h.cljs$lang$arity$1 ? h.cljs$lang$arity$1(x) : h.call(null, x)))
      };
      var G__7544__2 = function(x, y) {
        return f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(g.cljs$lang$arity$1 ? g.cljs$lang$arity$1(h.cljs$lang$arity$2 ? h.cljs$lang$arity$2(x, y) : h.call(null, x, y)) : g.call(null, h.cljs$lang$arity$2 ? h.cljs$lang$arity$2(x, y) : h.call(null, x, y))) : f.call(null, g.cljs$lang$arity$1 ? g.cljs$lang$arity$1(h.cljs$lang$arity$2 ? h.cljs$lang$arity$2(x, y) : h.call(null, x, y)) : g.call(null, h.cljs$lang$arity$2 ? h.cljs$lang$arity$2(x, y) : h.call(null, x, y)))
      };
      var G__7544__3 = function(x, y, z) {
        return f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(g.cljs$lang$arity$1 ? g.cljs$lang$arity$1(h.cljs$lang$arity$3 ? h.cljs$lang$arity$3(x, y, z) : h.call(null, x, y, z)) : g.call(null, h.cljs$lang$arity$3 ? h.cljs$lang$arity$3(x, y, z) : h.call(null, x, y, z))) : f.call(null, g.cljs$lang$arity$1 ? g.cljs$lang$arity$1(h.cljs$lang$arity$3 ? h.cljs$lang$arity$3(x, y, z) : h.call(null, x, y, z)) : g.call(null, h.cljs$lang$arity$3 ? h.cljs$lang$arity$3(x, y, z) : h.call(null, x, y, z)))
      };
      var G__7544__4 = function() {
        var G__7545__delegate = function(x, y, z, args) {
          return f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(g.cljs$lang$arity$1 ? g.cljs$lang$arity$1(cljs.core.apply.cljs$lang$arity$5(h, x, y, z, args)) : g.call(null, cljs.core.apply.cljs$lang$arity$5(h, x, y, z, args))) : f.call(null, g.cljs$lang$arity$1 ? g.cljs$lang$arity$1(cljs.core.apply.cljs$lang$arity$5(h, x, y, z, args)) : g.call(null, cljs.core.apply.cljs$lang$arity$5(h, x, y, z, args)))
        };
        var G__7545 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7545__delegate.call(this, x, y, z, args)
        };
        G__7545.cljs$lang$maxFixedArity = 3;
        G__7545.cljs$lang$applyTo = function(arglist__7546) {
          var x = cljs.core.first(arglist__7546);
          var y = cljs.core.first(cljs.core.next(arglist__7546));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7546)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7546)));
          return G__7545__delegate(x, y, z, args)
        };
        G__7545.cljs$lang$arity$variadic = G__7545__delegate;
        return G__7545
      }();
      G__7544 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7544__0.call(this);
          case 1:
            return G__7544__1.call(this, x);
          case 2:
            return G__7544__2.call(this, x, y);
          case 3:
            return G__7544__3.call(this, x, y, z);
          default:
            return G__7544__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7544.cljs$lang$maxFixedArity = 3;
      G__7544.cljs$lang$applyTo = G__7544__4.cljs$lang$applyTo;
      return G__7544
    }()
  };
  var comp__4 = function() {
    var G__7547__delegate = function(f1, f2, f3, fs) {
      var fs__7538 = cljs.core.reverse(cljs.core.list_STAR_.cljs$lang$arity$4(f1, f2, f3, fs));
      return function() {
        var G__7548__delegate = function(args) {
          var ret__7539 = cljs.core.apply.cljs$lang$arity$2(cljs.core.first(fs__7538), args);
          var fs__7540 = cljs.core.next(fs__7538);
          while(true) {
            if(fs__7540) {
              var G__7549 = cljs.core.first(fs__7540).call(null, ret__7539);
              var G__7550 = cljs.core.next(fs__7540);
              ret__7539 = G__7549;
              fs__7540 = G__7550;
              continue
            }else {
              return ret__7539
            }
            break
          }
        };
        var G__7548 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7548__delegate.call(this, args)
        };
        G__7548.cljs$lang$maxFixedArity = 0;
        G__7548.cljs$lang$applyTo = function(arglist__7551) {
          var args = cljs.core.seq(arglist__7551);
          return G__7548__delegate(args)
        };
        G__7548.cljs$lang$arity$variadic = G__7548__delegate;
        return G__7548
      }()
    };
    var G__7547 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7547__delegate.call(this, f1, f2, f3, fs)
    };
    G__7547.cljs$lang$maxFixedArity = 3;
    G__7547.cljs$lang$applyTo = function(arglist__7552) {
      var f1 = cljs.core.first(arglist__7552);
      var f2 = cljs.core.first(cljs.core.next(arglist__7552));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7552)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7552)));
      return G__7547__delegate(f1, f2, f3, fs)
    };
    G__7547.cljs$lang$arity$variadic = G__7547__delegate;
    return G__7547
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__7553__delegate = function(args) {
        return cljs.core.apply.cljs$lang$arity$3(f, arg1, args)
      };
      var G__7553 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7553__delegate.call(this, args)
      };
      G__7553.cljs$lang$maxFixedArity = 0;
      G__7553.cljs$lang$applyTo = function(arglist__7554) {
        var args = cljs.core.seq(arglist__7554);
        return G__7553__delegate(args)
      };
      G__7553.cljs$lang$arity$variadic = G__7553__delegate;
      return G__7553
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__7555__delegate = function(args) {
        return cljs.core.apply.cljs$lang$arity$4(f, arg1, arg2, args)
      };
      var G__7555 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7555__delegate.call(this, args)
      };
      G__7555.cljs$lang$maxFixedArity = 0;
      G__7555.cljs$lang$applyTo = function(arglist__7556) {
        var args = cljs.core.seq(arglist__7556);
        return G__7555__delegate(args)
      };
      G__7555.cljs$lang$arity$variadic = G__7555__delegate;
      return G__7555
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__7557__delegate = function(args) {
        return cljs.core.apply.cljs$lang$arity$5(f, arg1, arg2, arg3, args)
      };
      var G__7557 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7557__delegate.call(this, args)
      };
      G__7557.cljs$lang$maxFixedArity = 0;
      G__7557.cljs$lang$applyTo = function(arglist__7558) {
        var args = cljs.core.seq(arglist__7558);
        return G__7557__delegate(args)
      };
      G__7557.cljs$lang$arity$variadic = G__7557__delegate;
      return G__7557
    }()
  };
  var partial__5 = function() {
    var G__7559__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__7560__delegate = function(args) {
          return cljs.core.apply.cljs$lang$arity$5(f, arg1, arg2, arg3, cljs.core.concat.cljs$lang$arity$2(more, args))
        };
        var G__7560 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7560__delegate.call(this, args)
        };
        G__7560.cljs$lang$maxFixedArity = 0;
        G__7560.cljs$lang$applyTo = function(arglist__7561) {
          var args = cljs.core.seq(arglist__7561);
          return G__7560__delegate(args)
        };
        G__7560.cljs$lang$arity$variadic = G__7560__delegate;
        return G__7560
      }()
    };
    var G__7559 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7559__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__7559.cljs$lang$maxFixedArity = 4;
    G__7559.cljs$lang$applyTo = function(arglist__7562) {
      var f = cljs.core.first(arglist__7562);
      var arg1 = cljs.core.first(cljs.core.next(arglist__7562));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7562)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7562))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7562))));
      return G__7559__delegate(f, arg1, arg2, arg3, more)
    };
    G__7559.cljs$lang$arity$variadic = G__7559__delegate;
    return G__7559
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__7563 = null;
      var G__7563__1 = function(a) {
        return f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(a == null ? x : a) : f.call(null, a == null ? x : a)
      };
      var G__7563__2 = function(a, b) {
        return f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(a == null ? x : a, b) : f.call(null, a == null ? x : a, b)
      };
      var G__7563__3 = function(a, b, c) {
        return f.cljs$lang$arity$3 ? f.cljs$lang$arity$3(a == null ? x : a, b, c) : f.call(null, a == null ? x : a, b, c)
      };
      var G__7563__4 = function() {
        var G__7564__delegate = function(a, b, c, ds) {
          return cljs.core.apply.cljs$lang$arity$5(f, a == null ? x : a, b, c, ds)
        };
        var G__7564 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7564__delegate.call(this, a, b, c, ds)
        };
        G__7564.cljs$lang$maxFixedArity = 3;
        G__7564.cljs$lang$applyTo = function(arglist__7565) {
          var a = cljs.core.first(arglist__7565);
          var b = cljs.core.first(cljs.core.next(arglist__7565));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7565)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7565)));
          return G__7564__delegate(a, b, c, ds)
        };
        G__7564.cljs$lang$arity$variadic = G__7564__delegate;
        return G__7564
      }();
      G__7563 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__7563__1.call(this, a);
          case 2:
            return G__7563__2.call(this, a, b);
          case 3:
            return G__7563__3.call(this, a, b, c);
          default:
            return G__7563__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7563.cljs$lang$maxFixedArity = 3;
      G__7563.cljs$lang$applyTo = G__7563__4.cljs$lang$applyTo;
      return G__7563
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__7566 = null;
      var G__7566__2 = function(a, b) {
        return f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(a == null ? x : a, b == null ? y : b) : f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7566__3 = function(a, b, c) {
        return f.cljs$lang$arity$3 ? f.cljs$lang$arity$3(a == null ? x : a, b == null ? y : b, c) : f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__7566__4 = function() {
        var G__7567__delegate = function(a, b, c, ds) {
          return cljs.core.apply.cljs$lang$arity$5(f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__7567 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7567__delegate.call(this, a, b, c, ds)
        };
        G__7567.cljs$lang$maxFixedArity = 3;
        G__7567.cljs$lang$applyTo = function(arglist__7568) {
          var a = cljs.core.first(arglist__7568);
          var b = cljs.core.first(cljs.core.next(arglist__7568));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7568)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7568)));
          return G__7567__delegate(a, b, c, ds)
        };
        G__7567.cljs$lang$arity$variadic = G__7567__delegate;
        return G__7567
      }();
      G__7566 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7566__2.call(this, a, b);
          case 3:
            return G__7566__3.call(this, a, b, c);
          default:
            return G__7566__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7566.cljs$lang$maxFixedArity = 3;
      G__7566.cljs$lang$applyTo = G__7566__4.cljs$lang$applyTo;
      return G__7566
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__7569 = null;
      var G__7569__2 = function(a, b) {
        return f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(a == null ? x : a, b == null ? y : b) : f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7569__3 = function(a, b, c) {
        return f.cljs$lang$arity$3 ? f.cljs$lang$arity$3(a == null ? x : a, b == null ? y : b, c == null ? z : c) : f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__7569__4 = function() {
        var G__7570__delegate = function(a, b, c, ds) {
          return cljs.core.apply.cljs$lang$arity$5(f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__7570 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7570__delegate.call(this, a, b, c, ds)
        };
        G__7570.cljs$lang$maxFixedArity = 3;
        G__7570.cljs$lang$applyTo = function(arglist__7571) {
          var a = cljs.core.first(arglist__7571);
          var b = cljs.core.first(cljs.core.next(arglist__7571));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7571)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7571)));
          return G__7570__delegate(a, b, c, ds)
        };
        G__7570.cljs$lang$arity$variadic = G__7570__delegate;
        return G__7570
      }();
      G__7569 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7569__2.call(this, a, b);
          case 3:
            return G__7569__3.call(this, a, b, c);
          default:
            return G__7569__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7569.cljs$lang$maxFixedArity = 3;
      G__7569.cljs$lang$applyTo = G__7569__4.cljs$lang$applyTo;
      return G__7569
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__7587 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____7595 = cljs.core.seq(coll);
      if(temp__3974__auto____7595) {
        var s__7596 = temp__3974__auto____7595;
        if(cljs.core.chunked_seq_QMARK_(s__7596)) {
          var c__7597 = cljs.core.chunk_first(s__7596);
          var size__7598 = cljs.core.count(c__7597);
          var b__7599 = cljs.core.chunk_buffer(size__7598);
          var n__2527__auto____7600 = size__7598;
          var i__7601 = 0;
          while(true) {
            if(i__7601 < n__2527__auto____7600) {
              cljs.core.chunk_append(b__7599, f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(idx + i__7601, cljs.core._nth.cljs$lang$arity$2(c__7597, i__7601)) : f.call(null, idx + i__7601, cljs.core._nth.cljs$lang$arity$2(c__7597, i__7601)));
              var G__7602 = i__7601 + 1;
              i__7601 = G__7602;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons(cljs.core.chunk(b__7599), mapi(idx + size__7598, cljs.core.chunk_rest(s__7596)))
        }else {
          return cljs.core.cons(f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(idx, cljs.core.first(s__7596)) : f.call(null, idx, cljs.core.first(s__7596)), mapi(idx + 1, cljs.core.rest(s__7596)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__7587.cljs$lang$arity$2 ? mapi__7587.cljs$lang$arity$2(0, coll) : mapi__7587.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____7612 = cljs.core.seq(coll);
    if(temp__3974__auto____7612) {
      var s__7613 = temp__3974__auto____7612;
      if(cljs.core.chunked_seq_QMARK_(s__7613)) {
        var c__7614 = cljs.core.chunk_first(s__7613);
        var size__7615 = cljs.core.count(c__7614);
        var b__7616 = cljs.core.chunk_buffer(size__7615);
        var n__2527__auto____7617 = size__7615;
        var i__7618 = 0;
        while(true) {
          if(i__7618 < n__2527__auto____7617) {
            var x__7619 = f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(cljs.core._nth.cljs$lang$arity$2(c__7614, i__7618)) : f.call(null, cljs.core._nth.cljs$lang$arity$2(c__7614, i__7618));
            if(x__7619 == null) {
            }else {
              cljs.core.chunk_append(b__7616, x__7619)
            }
            var G__7621 = i__7618 + 1;
            i__7618 = G__7621;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons(cljs.core.chunk(b__7616), keep(f, cljs.core.chunk_rest(s__7613)))
      }else {
        var x__7620 = f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(cljs.core.first(s__7613)) : f.call(null, cljs.core.first(s__7613));
        if(x__7620 == null) {
          return keep(f, cljs.core.rest(s__7613))
        }else {
          return cljs.core.cons(x__7620, keep(f, cljs.core.rest(s__7613)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__7647 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____7657 = cljs.core.seq(coll);
      if(temp__3974__auto____7657) {
        var s__7658 = temp__3974__auto____7657;
        if(cljs.core.chunked_seq_QMARK_(s__7658)) {
          var c__7659 = cljs.core.chunk_first(s__7658);
          var size__7660 = cljs.core.count(c__7659);
          var b__7661 = cljs.core.chunk_buffer(size__7660);
          var n__2527__auto____7662 = size__7660;
          var i__7663 = 0;
          while(true) {
            if(i__7663 < n__2527__auto____7662) {
              var x__7664 = f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(idx + i__7663, cljs.core._nth.cljs$lang$arity$2(c__7659, i__7663)) : f.call(null, idx + i__7663, cljs.core._nth.cljs$lang$arity$2(c__7659, i__7663));
              if(x__7664 == null) {
              }else {
                cljs.core.chunk_append(b__7661, x__7664)
              }
              var G__7666 = i__7663 + 1;
              i__7663 = G__7666;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons(cljs.core.chunk(b__7661), keepi(idx + size__7660, cljs.core.chunk_rest(s__7658)))
        }else {
          var x__7665 = f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(idx, cljs.core.first(s__7658)) : f.call(null, idx, cljs.core.first(s__7658));
          if(x__7665 == null) {
            return keepi(idx + 1, cljs.core.rest(s__7658))
          }else {
            return cljs.core.cons(x__7665, keepi(idx + 1, cljs.core.rest(s__7658)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__7647.cljs$lang$arity$2 ? keepi__7647.cljs$lang$arity$2(0, coll) : keepi__7647.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$(p.cljs$lang$arity$1 ? p.cljs$lang$arity$1(x) : p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$(function() {
          var and__3822__auto____7752 = p.cljs$lang$arity$1 ? p.cljs$lang$arity$1(x) : p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7752)) {
            return p.cljs$lang$arity$1 ? p.cljs$lang$arity$1(y) : p.call(null, y)
          }else {
            return and__3822__auto____7752
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$(function() {
          var and__3822__auto____7753 = p.cljs$lang$arity$1 ? p.cljs$lang$arity$1(x) : p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7753)) {
            var and__3822__auto____7754 = p.cljs$lang$arity$1 ? p.cljs$lang$arity$1(y) : p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7754)) {
              return p.cljs$lang$arity$1 ? p.cljs$lang$arity$1(z) : p.call(null, z)
            }else {
              return and__3822__auto____7754
            }
          }else {
            return and__3822__auto____7753
          }
        }())
      };
      var ep1__4 = function() {
        var G__7823__delegate = function(x, y, z, args) {
          return cljs.core.boolean$(function() {
            var and__3822__auto____7755 = ep1.cljs$lang$arity$3(x, y, z);
            if(cljs.core.truth_(and__3822__auto____7755)) {
              return cljs.core.every_QMARK_(p, args)
            }else {
              return and__3822__auto____7755
            }
          }())
        };
        var G__7823 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7823__delegate.call(this, x, y, z, args)
        };
        G__7823.cljs$lang$maxFixedArity = 3;
        G__7823.cljs$lang$applyTo = function(arglist__7824) {
          var x = cljs.core.first(arglist__7824);
          var y = cljs.core.first(cljs.core.next(arglist__7824));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7824)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7824)));
          return G__7823__delegate(x, y, z, args)
        };
        G__7823.cljs$lang$arity$variadic = G__7823__delegate;
        return G__7823
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$(function() {
          var and__3822__auto____7767 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(x) : p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7767)) {
            return p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(x) : p2.call(null, x)
          }else {
            return and__3822__auto____7767
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$(function() {
          var and__3822__auto____7768 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(x) : p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7768)) {
            var and__3822__auto____7769 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(y) : p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7769)) {
              var and__3822__auto____7770 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(x) : p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7770)) {
                return p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(y) : p2.call(null, y)
              }else {
                return and__3822__auto____7770
              }
            }else {
              return and__3822__auto____7769
            }
          }else {
            return and__3822__auto____7768
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$(function() {
          var and__3822__auto____7771 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(x) : p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7771)) {
            var and__3822__auto____7772 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(y) : p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7772)) {
              var and__3822__auto____7773 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(z) : p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____7773)) {
                var and__3822__auto____7774 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(x) : p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____7774)) {
                  var and__3822__auto____7775 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(y) : p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7775)) {
                    return p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(z) : p2.call(null, z)
                  }else {
                    return and__3822__auto____7775
                  }
                }else {
                  return and__3822__auto____7774
                }
              }else {
                return and__3822__auto____7773
              }
            }else {
              return and__3822__auto____7772
            }
          }else {
            return and__3822__auto____7771
          }
        }())
      };
      var ep2__4 = function() {
        var G__7825__delegate = function(x, y, z, args) {
          return cljs.core.boolean$(function() {
            var and__3822__auto____7776 = ep2.cljs$lang$arity$3(x, y, z);
            if(cljs.core.truth_(and__3822__auto____7776)) {
              return cljs.core.every_QMARK_(function(p1__7622_SHARP_) {
                var and__3822__auto____7777 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(p1__7622_SHARP_) : p1.call(null, p1__7622_SHARP_);
                if(cljs.core.truth_(and__3822__auto____7777)) {
                  return p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(p1__7622_SHARP_) : p2.call(null, p1__7622_SHARP_)
                }else {
                  return and__3822__auto____7777
                }
              }, args)
            }else {
              return and__3822__auto____7776
            }
          }())
        };
        var G__7825 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7825__delegate.call(this, x, y, z, args)
        };
        G__7825.cljs$lang$maxFixedArity = 3;
        G__7825.cljs$lang$applyTo = function(arglist__7826) {
          var x = cljs.core.first(arglist__7826);
          var y = cljs.core.first(cljs.core.next(arglist__7826));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7826)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7826)));
          return G__7825__delegate(x, y, z, args)
        };
        G__7825.cljs$lang$arity$variadic = G__7825__delegate;
        return G__7825
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$(function() {
          var and__3822__auto____7796 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(x) : p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7796)) {
            var and__3822__auto____7797 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(x) : p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7797)) {
              return p3.cljs$lang$arity$1 ? p3.cljs$lang$arity$1(x) : p3.call(null, x)
            }else {
              return and__3822__auto____7797
            }
          }else {
            return and__3822__auto____7796
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$(function() {
          var and__3822__auto____7798 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(x) : p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7798)) {
            var and__3822__auto____7799 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(x) : p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7799)) {
              var and__3822__auto____7800 = p3.cljs$lang$arity$1 ? p3.cljs$lang$arity$1(x) : p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7800)) {
                var and__3822__auto____7801 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(y) : p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____7801)) {
                  var and__3822__auto____7802 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(y) : p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7802)) {
                    return p3.cljs$lang$arity$1 ? p3.cljs$lang$arity$1(y) : p3.call(null, y)
                  }else {
                    return and__3822__auto____7802
                  }
                }else {
                  return and__3822__auto____7801
                }
              }else {
                return and__3822__auto____7800
              }
            }else {
              return and__3822__auto____7799
            }
          }else {
            return and__3822__auto____7798
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$(function() {
          var and__3822__auto____7803 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(x) : p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7803)) {
            var and__3822__auto____7804 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(x) : p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7804)) {
              var and__3822__auto____7805 = p3.cljs$lang$arity$1 ? p3.cljs$lang$arity$1(x) : p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7805)) {
                var and__3822__auto____7806 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(y) : p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____7806)) {
                  var and__3822__auto____7807 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(y) : p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7807)) {
                    var and__3822__auto____7808 = p3.cljs$lang$arity$1 ? p3.cljs$lang$arity$1(y) : p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____7808)) {
                      var and__3822__auto____7809 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(z) : p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____7809)) {
                        var and__3822__auto____7810 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(z) : p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____7810)) {
                          return p3.cljs$lang$arity$1 ? p3.cljs$lang$arity$1(z) : p3.call(null, z)
                        }else {
                          return and__3822__auto____7810
                        }
                      }else {
                        return and__3822__auto____7809
                      }
                    }else {
                      return and__3822__auto____7808
                    }
                  }else {
                    return and__3822__auto____7807
                  }
                }else {
                  return and__3822__auto____7806
                }
              }else {
                return and__3822__auto____7805
              }
            }else {
              return and__3822__auto____7804
            }
          }else {
            return and__3822__auto____7803
          }
        }())
      };
      var ep3__4 = function() {
        var G__7827__delegate = function(x, y, z, args) {
          return cljs.core.boolean$(function() {
            var and__3822__auto____7811 = ep3.cljs$lang$arity$3(x, y, z);
            if(cljs.core.truth_(and__3822__auto____7811)) {
              return cljs.core.every_QMARK_(function(p1__7623_SHARP_) {
                var and__3822__auto____7812 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(p1__7623_SHARP_) : p1.call(null, p1__7623_SHARP_);
                if(cljs.core.truth_(and__3822__auto____7812)) {
                  var and__3822__auto____7813 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(p1__7623_SHARP_) : p2.call(null, p1__7623_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____7813)) {
                    return p3.cljs$lang$arity$1 ? p3.cljs$lang$arity$1(p1__7623_SHARP_) : p3.call(null, p1__7623_SHARP_)
                  }else {
                    return and__3822__auto____7813
                  }
                }else {
                  return and__3822__auto____7812
                }
              }, args)
            }else {
              return and__3822__auto____7811
            }
          }())
        };
        var G__7827 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7827__delegate.call(this, x, y, z, args)
        };
        G__7827.cljs$lang$maxFixedArity = 3;
        G__7827.cljs$lang$applyTo = function(arglist__7828) {
          var x = cljs.core.first(arglist__7828);
          var y = cljs.core.first(cljs.core.next(arglist__7828));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7828)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7828)));
          return G__7827__delegate(x, y, z, args)
        };
        G__7827.cljs$lang$arity$variadic = G__7827__delegate;
        return G__7827
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__7829__delegate = function(p1, p2, p3, ps) {
      var ps__7814 = cljs.core.list_STAR_.cljs$lang$arity$4(p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_(function(p1__7624_SHARP_) {
            return p1__7624_SHARP_.cljs$lang$arity$1 ? p1__7624_SHARP_.cljs$lang$arity$1(x) : p1__7624_SHARP_.call(null, x)
          }, ps__7814)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_(function(p1__7625_SHARP_) {
            var and__3822__auto____7819 = p1__7625_SHARP_.cljs$lang$arity$1 ? p1__7625_SHARP_.cljs$lang$arity$1(x) : p1__7625_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7819)) {
              return p1__7625_SHARP_.cljs$lang$arity$1 ? p1__7625_SHARP_.cljs$lang$arity$1(y) : p1__7625_SHARP_.call(null, y)
            }else {
              return and__3822__auto____7819
            }
          }, ps__7814)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_(function(p1__7626_SHARP_) {
            var and__3822__auto____7820 = p1__7626_SHARP_.cljs$lang$arity$1 ? p1__7626_SHARP_.cljs$lang$arity$1(x) : p1__7626_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7820)) {
              var and__3822__auto____7821 = p1__7626_SHARP_.cljs$lang$arity$1 ? p1__7626_SHARP_.cljs$lang$arity$1(y) : p1__7626_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____7821)) {
                return p1__7626_SHARP_.cljs$lang$arity$1 ? p1__7626_SHARP_.cljs$lang$arity$1(z) : p1__7626_SHARP_.call(null, z)
              }else {
                return and__3822__auto____7821
              }
            }else {
              return and__3822__auto____7820
            }
          }, ps__7814)
        };
        var epn__4 = function() {
          var G__7830__delegate = function(x, y, z, args) {
            return cljs.core.boolean$(function() {
              var and__3822__auto____7822 = epn.cljs$lang$arity$3(x, y, z);
              if(cljs.core.truth_(and__3822__auto____7822)) {
                return cljs.core.every_QMARK_(function(p1__7627_SHARP_) {
                  return cljs.core.every_QMARK_(p1__7627_SHARP_, args)
                }, ps__7814)
              }else {
                return and__3822__auto____7822
              }
            }())
          };
          var G__7830 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__7830__delegate.call(this, x, y, z, args)
          };
          G__7830.cljs$lang$maxFixedArity = 3;
          G__7830.cljs$lang$applyTo = function(arglist__7831) {
            var x = cljs.core.first(arglist__7831);
            var y = cljs.core.first(cljs.core.next(arglist__7831));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7831)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7831)));
            return G__7830__delegate(x, y, z, args)
          };
          G__7830.cljs$lang$arity$variadic = G__7830__delegate;
          return G__7830
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__7829 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7829__delegate.call(this, p1, p2, p3, ps)
    };
    G__7829.cljs$lang$maxFixedArity = 3;
    G__7829.cljs$lang$applyTo = function(arglist__7832) {
      var p1 = cljs.core.first(arglist__7832);
      var p2 = cljs.core.first(cljs.core.next(arglist__7832));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7832)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7832)));
      return G__7829__delegate(p1, p2, p3, ps)
    };
    G__7829.cljs$lang$arity$variadic = G__7829__delegate;
    return G__7829
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.cljs$lang$arity$1 ? p.cljs$lang$arity$1(x) : p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3824__auto____7913 = p.cljs$lang$arity$1 ? p.cljs$lang$arity$1(x) : p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7913)) {
          return or__3824__auto____7913
        }else {
          return p.cljs$lang$arity$1 ? p.cljs$lang$arity$1(y) : p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____7914 = p.cljs$lang$arity$1 ? p.cljs$lang$arity$1(x) : p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7914)) {
          return or__3824__auto____7914
        }else {
          var or__3824__auto____7915 = p.cljs$lang$arity$1 ? p.cljs$lang$arity$1(y) : p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7915)) {
            return or__3824__auto____7915
          }else {
            return p.cljs$lang$arity$1 ? p.cljs$lang$arity$1(z) : p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__7984__delegate = function(x, y, z, args) {
          var or__3824__auto____7916 = sp1.cljs$lang$arity$3(x, y, z);
          if(cljs.core.truth_(or__3824__auto____7916)) {
            return or__3824__auto____7916
          }else {
            return cljs.core.some(p, args)
          }
        };
        var G__7984 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7984__delegate.call(this, x, y, z, args)
        };
        G__7984.cljs$lang$maxFixedArity = 3;
        G__7984.cljs$lang$applyTo = function(arglist__7985) {
          var x = cljs.core.first(arglist__7985);
          var y = cljs.core.first(cljs.core.next(arglist__7985));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7985)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7985)));
          return G__7984__delegate(x, y, z, args)
        };
        G__7984.cljs$lang$arity$variadic = G__7984__delegate;
        return G__7984
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3824__auto____7928 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(x) : p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7928)) {
          return or__3824__auto____7928
        }else {
          return p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(x) : p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____7929 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(x) : p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7929)) {
          return or__3824__auto____7929
        }else {
          var or__3824__auto____7930 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(y) : p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7930)) {
            return or__3824__auto____7930
          }else {
            var or__3824__auto____7931 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(x) : p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7931)) {
              return or__3824__auto____7931
            }else {
              return p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(y) : p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____7932 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(x) : p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7932)) {
          return or__3824__auto____7932
        }else {
          var or__3824__auto____7933 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(y) : p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7933)) {
            return or__3824__auto____7933
          }else {
            var or__3824__auto____7934 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(z) : p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____7934)) {
              return or__3824__auto____7934
            }else {
              var or__3824__auto____7935 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(x) : p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____7935)) {
                return or__3824__auto____7935
              }else {
                var or__3824__auto____7936 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(y) : p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____7936)) {
                  return or__3824__auto____7936
                }else {
                  return p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(z) : p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__7986__delegate = function(x, y, z, args) {
          var or__3824__auto____7937 = sp2.cljs$lang$arity$3(x, y, z);
          if(cljs.core.truth_(or__3824__auto____7937)) {
            return or__3824__auto____7937
          }else {
            return cljs.core.some(function(p1__7667_SHARP_) {
              var or__3824__auto____7938 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(p1__7667_SHARP_) : p1.call(null, p1__7667_SHARP_);
              if(cljs.core.truth_(or__3824__auto____7938)) {
                return or__3824__auto____7938
              }else {
                return p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(p1__7667_SHARP_) : p2.call(null, p1__7667_SHARP_)
              }
            }, args)
          }
        };
        var G__7986 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7986__delegate.call(this, x, y, z, args)
        };
        G__7986.cljs$lang$maxFixedArity = 3;
        G__7986.cljs$lang$applyTo = function(arglist__7987) {
          var x = cljs.core.first(arglist__7987);
          var y = cljs.core.first(cljs.core.next(arglist__7987));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7987)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7987)));
          return G__7986__delegate(x, y, z, args)
        };
        G__7986.cljs$lang$arity$variadic = G__7986__delegate;
        return G__7986
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3824__auto____7957 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(x) : p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7957)) {
          return or__3824__auto____7957
        }else {
          var or__3824__auto____7958 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(x) : p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____7958)) {
            return or__3824__auto____7958
          }else {
            return p3.cljs$lang$arity$1 ? p3.cljs$lang$arity$1(x) : p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____7959 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(x) : p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7959)) {
          return or__3824__auto____7959
        }else {
          var or__3824__auto____7960 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(x) : p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____7960)) {
            return or__3824__auto____7960
          }else {
            var or__3824__auto____7961 = p3.cljs$lang$arity$1 ? p3.cljs$lang$arity$1(x) : p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7961)) {
              return or__3824__auto____7961
            }else {
              var or__3824__auto____7962 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(y) : p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____7962)) {
                return or__3824__auto____7962
              }else {
                var or__3824__auto____7963 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(y) : p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____7963)) {
                  return or__3824__auto____7963
                }else {
                  return p3.cljs$lang$arity$1 ? p3.cljs$lang$arity$1(y) : p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____7964 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(x) : p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7964)) {
          return or__3824__auto____7964
        }else {
          var or__3824__auto____7965 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(x) : p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____7965)) {
            return or__3824__auto____7965
          }else {
            var or__3824__auto____7966 = p3.cljs$lang$arity$1 ? p3.cljs$lang$arity$1(x) : p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7966)) {
              return or__3824__auto____7966
            }else {
              var or__3824__auto____7967 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(y) : p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____7967)) {
                return or__3824__auto____7967
              }else {
                var or__3824__auto____7968 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(y) : p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____7968)) {
                  return or__3824__auto____7968
                }else {
                  var or__3824__auto____7969 = p3.cljs$lang$arity$1 ? p3.cljs$lang$arity$1(y) : p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____7969)) {
                    return or__3824__auto____7969
                  }else {
                    var or__3824__auto____7970 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(z) : p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____7970)) {
                      return or__3824__auto____7970
                    }else {
                      var or__3824__auto____7971 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(z) : p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____7971)) {
                        return or__3824__auto____7971
                      }else {
                        return p3.cljs$lang$arity$1 ? p3.cljs$lang$arity$1(z) : p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__7988__delegate = function(x, y, z, args) {
          var or__3824__auto____7972 = sp3.cljs$lang$arity$3(x, y, z);
          if(cljs.core.truth_(or__3824__auto____7972)) {
            return or__3824__auto____7972
          }else {
            return cljs.core.some(function(p1__7668_SHARP_) {
              var or__3824__auto____7973 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(p1__7668_SHARP_) : p1.call(null, p1__7668_SHARP_);
              if(cljs.core.truth_(or__3824__auto____7973)) {
                return or__3824__auto____7973
              }else {
                var or__3824__auto____7974 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(p1__7668_SHARP_) : p2.call(null, p1__7668_SHARP_);
                if(cljs.core.truth_(or__3824__auto____7974)) {
                  return or__3824__auto____7974
                }else {
                  return p3.cljs$lang$arity$1 ? p3.cljs$lang$arity$1(p1__7668_SHARP_) : p3.call(null, p1__7668_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__7988 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7988__delegate.call(this, x, y, z, args)
        };
        G__7988.cljs$lang$maxFixedArity = 3;
        G__7988.cljs$lang$applyTo = function(arglist__7989) {
          var x = cljs.core.first(arglist__7989);
          var y = cljs.core.first(cljs.core.next(arglist__7989));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7989)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7989)));
          return G__7988__delegate(x, y, z, args)
        };
        G__7988.cljs$lang$arity$variadic = G__7988__delegate;
        return G__7988
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__7990__delegate = function(p1, p2, p3, ps) {
      var ps__7975 = cljs.core.list_STAR_.cljs$lang$arity$4(p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some(function(p1__7669_SHARP_) {
            return p1__7669_SHARP_.cljs$lang$arity$1 ? p1__7669_SHARP_.cljs$lang$arity$1(x) : p1__7669_SHARP_.call(null, x)
          }, ps__7975)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some(function(p1__7670_SHARP_) {
            var or__3824__auto____7980 = p1__7670_SHARP_.cljs$lang$arity$1 ? p1__7670_SHARP_.cljs$lang$arity$1(x) : p1__7670_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7980)) {
              return or__3824__auto____7980
            }else {
              return p1__7670_SHARP_.cljs$lang$arity$1 ? p1__7670_SHARP_.cljs$lang$arity$1(y) : p1__7670_SHARP_.call(null, y)
            }
          }, ps__7975)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some(function(p1__7671_SHARP_) {
            var or__3824__auto____7981 = p1__7671_SHARP_.cljs$lang$arity$1 ? p1__7671_SHARP_.cljs$lang$arity$1(x) : p1__7671_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7981)) {
              return or__3824__auto____7981
            }else {
              var or__3824__auto____7982 = p1__7671_SHARP_.cljs$lang$arity$1 ? p1__7671_SHARP_.cljs$lang$arity$1(y) : p1__7671_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____7982)) {
                return or__3824__auto____7982
              }else {
                return p1__7671_SHARP_.cljs$lang$arity$1 ? p1__7671_SHARP_.cljs$lang$arity$1(z) : p1__7671_SHARP_.call(null, z)
              }
            }
          }, ps__7975)
        };
        var spn__4 = function() {
          var G__7991__delegate = function(x, y, z, args) {
            var or__3824__auto____7983 = spn.cljs$lang$arity$3(x, y, z);
            if(cljs.core.truth_(or__3824__auto____7983)) {
              return or__3824__auto____7983
            }else {
              return cljs.core.some(function(p1__7672_SHARP_) {
                return cljs.core.some(p1__7672_SHARP_, args)
              }, ps__7975)
            }
          };
          var G__7991 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__7991__delegate.call(this, x, y, z, args)
          };
          G__7991.cljs$lang$maxFixedArity = 3;
          G__7991.cljs$lang$applyTo = function(arglist__7992) {
            var x = cljs.core.first(arglist__7992);
            var y = cljs.core.first(cljs.core.next(arglist__7992));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7992)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7992)));
            return G__7991__delegate(x, y, z, args)
          };
          G__7991.cljs$lang$arity$variadic = G__7991__delegate;
          return G__7991
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__7990 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7990__delegate.call(this, p1, p2, p3, ps)
    };
    G__7990.cljs$lang$maxFixedArity = 3;
    G__7990.cljs$lang$applyTo = function(arglist__7993) {
      var p1 = cljs.core.first(arglist__7993);
      var p2 = cljs.core.first(cljs.core.next(arglist__7993));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7993)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7993)));
      return G__7990__delegate(p1, p2, p3, ps)
    };
    G__7990.cljs$lang$arity$variadic = G__7990__delegate;
    return G__7990
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8012 = cljs.core.seq(coll);
      if(temp__3974__auto____8012) {
        var s__8013 = temp__3974__auto____8012;
        if(cljs.core.chunked_seq_QMARK_(s__8013)) {
          var c__8014 = cljs.core.chunk_first(s__8013);
          var size__8015 = cljs.core.count(c__8014);
          var b__8016 = cljs.core.chunk_buffer(size__8015);
          var n__2527__auto____8017 = size__8015;
          var i__8018 = 0;
          while(true) {
            if(i__8018 < n__2527__auto____8017) {
              cljs.core.chunk_append(b__8016, f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(cljs.core._nth.cljs$lang$arity$2(c__8014, i__8018)) : f.call(null, cljs.core._nth.cljs$lang$arity$2(c__8014, i__8018)));
              var G__8030 = i__8018 + 1;
              i__8018 = G__8030;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons(cljs.core.chunk(b__8016), map.cljs$lang$arity$2(f, cljs.core.chunk_rest(s__8013)))
        }else {
          return cljs.core.cons(f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(cljs.core.first(s__8013)) : f.call(null, cljs.core.first(s__8013)), map.cljs$lang$arity$2(f, cljs.core.rest(s__8013)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8019 = cljs.core.seq(c1);
      var s2__8020 = cljs.core.seq(c2);
      if(function() {
        var and__3822__auto____8021 = s1__8019;
        if(and__3822__auto____8021) {
          return s2__8020
        }else {
          return and__3822__auto____8021
        }
      }()) {
        return cljs.core.cons(f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(cljs.core.first(s1__8019), cljs.core.first(s2__8020)) : f.call(null, cljs.core.first(s1__8019), cljs.core.first(s2__8020)), map.cljs$lang$arity$3(f, cljs.core.rest(s1__8019), cljs.core.rest(s2__8020)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8022 = cljs.core.seq(c1);
      var s2__8023 = cljs.core.seq(c2);
      var s3__8024 = cljs.core.seq(c3);
      if(function() {
        var and__3822__auto____8025 = s1__8022;
        if(and__3822__auto____8025) {
          var and__3822__auto____8026 = s2__8023;
          if(and__3822__auto____8026) {
            return s3__8024
          }else {
            return and__3822__auto____8026
          }
        }else {
          return and__3822__auto____8025
        }
      }()) {
        return cljs.core.cons(f.cljs$lang$arity$3 ? f.cljs$lang$arity$3(cljs.core.first(s1__8022), cljs.core.first(s2__8023), cljs.core.first(s3__8024)) : f.call(null, cljs.core.first(s1__8022), cljs.core.first(s2__8023), cljs.core.first(s3__8024)), map.cljs$lang$arity$4(f, cljs.core.rest(s1__8022), cljs.core.rest(s2__8023), cljs.core.rest(s3__8024)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__8031__delegate = function(f, c1, c2, c3, colls) {
      var step__8029 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__8028 = map.cljs$lang$arity$2(cljs.core.seq, cs);
          if(cljs.core.every_QMARK_(cljs.core.identity, ss__8028)) {
            return cljs.core.cons(map.cljs$lang$arity$2(cljs.core.first, ss__8028), step(map.cljs$lang$arity$2(cljs.core.rest, ss__8028)))
          }else {
            return null
          }
        }, null)
      };
      return map.cljs$lang$arity$2(function(p1__7833_SHARP_) {
        return cljs.core.apply.cljs$lang$arity$2(f, p1__7833_SHARP_)
      }, step__8029.cljs$lang$arity$1 ? step__8029.cljs$lang$arity$1(cljs.core.conj.cljs$lang$arity$variadic(colls, c3, cljs.core.array_seq([c2, c1], 0))) : step__8029.call(null, cljs.core.conj.cljs$lang$arity$variadic(colls, c3, cljs.core.array_seq([c2, c1], 0))))
    };
    var G__8031 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8031__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8031.cljs$lang$maxFixedArity = 4;
    G__8031.cljs$lang$applyTo = function(arglist__8032) {
      var f = cljs.core.first(arglist__8032);
      var c1 = cljs.core.first(cljs.core.next(arglist__8032));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8032)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8032))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8032))));
      return G__8031__delegate(f, c1, c2, c3, colls)
    };
    G__8031.cljs$lang$arity$variadic = G__8031__delegate;
    return G__8031
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3974__auto____8035 = cljs.core.seq(coll);
      if(temp__3974__auto____8035) {
        var s__8036 = temp__3974__auto____8035;
        return cljs.core.cons(cljs.core.first(s__8036), take(n - 1, cljs.core.rest(s__8036)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__8042 = function(n, coll) {
    while(true) {
      var s__8040 = cljs.core.seq(coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8041 = n > 0;
        if(and__3822__auto____8041) {
          return s__8040
        }else {
          return and__3822__auto____8041
        }
      }())) {
        var G__8043 = n - 1;
        var G__8044 = cljs.core.rest(s__8040);
        n = G__8043;
        coll = G__8044;
        continue
      }else {
        return s__8040
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8042.cljs$lang$arity$2 ? step__8042.cljs$lang$arity$2(n, coll) : step__8042.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.cljs$lang$arity$2(1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.cljs$lang$arity$3(function(x, _) {
      return x
    }, s, cljs.core.drop(n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__8047 = cljs.core.seq(coll);
  var lead__8048 = cljs.core.seq(cljs.core.drop(n, coll));
  while(true) {
    if(lead__8048) {
      var G__8049 = cljs.core.next(s__8047);
      var G__8050 = cljs.core.next(lead__8048);
      s__8047 = G__8049;
      lead__8048 = G__8050;
      continue
    }else {
      return s__8047
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__8056 = function(pred, coll) {
    while(true) {
      var s__8054 = cljs.core.seq(coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8055 = s__8054;
        if(and__3822__auto____8055) {
          return pred.cljs$lang$arity$1 ? pred.cljs$lang$arity$1(cljs.core.first(s__8054)) : pred.call(null, cljs.core.first(s__8054))
        }else {
          return and__3822__auto____8055
        }
      }())) {
        var G__8057 = pred;
        var G__8058 = cljs.core.rest(s__8054);
        pred = G__8057;
        coll = G__8058;
        continue
      }else {
        return s__8054
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8056.cljs$lang$arity$2 ? step__8056.cljs$lang$arity$2(pred, coll) : step__8056.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8061 = cljs.core.seq(coll);
    if(temp__3974__auto____8061) {
      var s__8062 = temp__3974__auto____8061;
      return cljs.core.concat.cljs$lang$arity$2(s__8062, cycle(s__8062))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take(n, coll), cljs.core.drop(n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons(x, repeat.cljs$lang$arity$1(x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take(n, repeat.cljs$lang$arity$1(x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take(n, cljs.core.repeat.cljs$lang$arity$1(x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons(f.cljs$lang$arity$0 ? f.cljs$lang$arity$0() : f.call(null), repeatedly.cljs$lang$arity$1(f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take(n, repeatedly.cljs$lang$arity$1(f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons(x, new cljs.core.LazySeq(null, false, function() {
    return iterate(f, f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(x) : f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8067 = cljs.core.seq(c1);
      var s2__8068 = cljs.core.seq(c2);
      if(function() {
        var and__3822__auto____8069 = s1__8067;
        if(and__3822__auto____8069) {
          return s2__8068
        }else {
          return and__3822__auto____8069
        }
      }()) {
        return cljs.core.cons(cljs.core.first(s1__8067), cljs.core.cons(cljs.core.first(s2__8068), interleave.cljs$lang$arity$2(cljs.core.rest(s1__8067), cljs.core.rest(s2__8068))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__8071__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__8070 = cljs.core.map.cljs$lang$arity$2(cljs.core.seq, cljs.core.conj.cljs$lang$arity$variadic(colls, c2, cljs.core.array_seq([c1], 0)));
        if(cljs.core.every_QMARK_(cljs.core.identity, ss__8070)) {
          return cljs.core.concat.cljs$lang$arity$2(cljs.core.map.cljs$lang$arity$2(cljs.core.first, ss__8070), cljs.core.apply.cljs$lang$arity$2(interleave, cljs.core.map.cljs$lang$arity$2(cljs.core.rest, ss__8070)))
        }else {
          return null
        }
      }, null)
    };
    var G__8071 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8071__delegate.call(this, c1, c2, colls)
    };
    G__8071.cljs$lang$maxFixedArity = 2;
    G__8071.cljs$lang$applyTo = function(arglist__8072) {
      var c1 = cljs.core.first(arglist__8072);
      var c2 = cljs.core.first(cljs.core.next(arglist__8072));
      var colls = cljs.core.rest(cljs.core.next(arglist__8072));
      return G__8071__delegate(c1, c2, colls)
    };
    G__8071.cljs$lang$arity$variadic = G__8071__delegate;
    return G__8071
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop(1, cljs.core.interleave.cljs$lang$arity$2(cljs.core.repeat.cljs$lang$arity$1(sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__8082 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____8080 = cljs.core.seq(coll);
      if(temp__3971__auto____8080) {
        var coll__8081 = temp__3971__auto____8080;
        return cljs.core.cons(cljs.core.first(coll__8081), cat(cljs.core.rest(coll__8081), colls))
      }else {
        if(cljs.core.seq(colls)) {
          return cat(cljs.core.first(colls), cljs.core.rest(colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__8082.cljs$lang$arity$2 ? cat__8082.cljs$lang$arity$2(null, colls) : cat__8082.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1(cljs.core.map.cljs$lang$arity$2(f, coll))
  };
  var mapcat__3 = function() {
    var G__8083__delegate = function(f, coll, colls) {
      return cljs.core.flatten1(cljs.core.apply.cljs$lang$arity$4(cljs.core.map, f, coll, colls))
    };
    var G__8083 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8083__delegate.call(this, f, coll, colls)
    };
    G__8083.cljs$lang$maxFixedArity = 2;
    G__8083.cljs$lang$applyTo = function(arglist__8084) {
      var f = cljs.core.first(arglist__8084);
      var coll = cljs.core.first(cljs.core.next(arglist__8084));
      var colls = cljs.core.rest(cljs.core.next(arglist__8084));
      return G__8083__delegate(f, coll, colls)
    };
    G__8083.cljs$lang$arity$variadic = G__8083__delegate;
    return G__8083
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8094 = cljs.core.seq(coll);
    if(temp__3974__auto____8094) {
      var s__8095 = temp__3974__auto____8094;
      if(cljs.core.chunked_seq_QMARK_(s__8095)) {
        var c__8096 = cljs.core.chunk_first(s__8095);
        var size__8097 = cljs.core.count(c__8096);
        var b__8098 = cljs.core.chunk_buffer(size__8097);
        var n__2527__auto____8099 = size__8097;
        var i__8100 = 0;
        while(true) {
          if(i__8100 < n__2527__auto____8099) {
            if(cljs.core.truth_(pred.cljs$lang$arity$1 ? pred.cljs$lang$arity$1(cljs.core._nth.cljs$lang$arity$2(c__8096, i__8100)) : pred.call(null, cljs.core._nth.cljs$lang$arity$2(c__8096, i__8100)))) {
              cljs.core.chunk_append(b__8098, cljs.core._nth.cljs$lang$arity$2(c__8096, i__8100))
            }else {
            }
            var G__8103 = i__8100 + 1;
            i__8100 = G__8103;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons(cljs.core.chunk(b__8098), filter(pred, cljs.core.chunk_rest(s__8095)))
      }else {
        var f__8101 = cljs.core.first(s__8095);
        var r__8102 = cljs.core.rest(s__8095);
        if(cljs.core.truth_(pred.cljs$lang$arity$1 ? pred.cljs$lang$arity$1(f__8101) : pred.call(null, f__8101))) {
          return cljs.core.cons(f__8101, filter(pred, r__8102))
        }else {
          return filter(pred, r__8102)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter(cljs.core.complement(pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__8106 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons(node, cljs.core.truth_(branch_QMARK_.cljs$lang$arity$1 ? branch_QMARK_.cljs$lang$arity$1(node) : branch_QMARK_.call(null, node)) ? cljs.core.mapcat.cljs$lang$arity$2(walk, children.cljs$lang$arity$1 ? children.cljs$lang$arity$1(node) : children.call(null, node)) : null)
    }, null)
  };
  return walk__8106.cljs$lang$arity$1 ? walk__8106.cljs$lang$arity$1(root) : walk__8106.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter(function(p1__8104_SHARP_) {
    return!cljs.core.sequential_QMARK_(p1__8104_SHARP_)
  }, cljs.core.rest(cljs.core.tree_seq(cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__8110__8111 = to;
    if(G__8110__8111) {
      if(function() {
        var or__3824__auto____8112 = G__8110__8111.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____8112) {
          return or__3824__auto____8112
        }else {
          return G__8110__8111.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__8110__8111.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_(cljs.core.IEditableCollection, G__8110__8111)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_(cljs.core.IEditableCollection, G__8110__8111)
    }
  }()) {
    return cljs.core.persistent_BANG_(cljs.core.reduce.cljs$lang$arity$3(cljs.core._conj_BANG_, cljs.core.transient$(to), from))
  }else {
    return cljs.core.reduce.cljs$lang$arity$3(cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_(cljs.core.reduce.cljs$lang$arity$3(function(v, o) {
      return cljs.core.conj_BANG_(v, f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(o) : f.call(null, o))
    }, cljs.core.transient$(cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into(cljs.core.PersistentVector.EMPTY, cljs.core.map.cljs$lang$arity$3(f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into(cljs.core.PersistentVector.EMPTY, cljs.core.map.cljs$lang$arity$4(f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__8113__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into(cljs.core.PersistentVector.EMPTY, cljs.core.apply.cljs$lang$arity$variadic(cljs.core.map, f, c1, c2, c3, cljs.core.array_seq([colls], 0)))
    };
    var G__8113 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8113__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8113.cljs$lang$maxFixedArity = 4;
    G__8113.cljs$lang$applyTo = function(arglist__8114) {
      var f = cljs.core.first(arglist__8114);
      var c1 = cljs.core.first(cljs.core.next(arglist__8114));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8114)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8114))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8114))));
      return G__8113__delegate(f, c1, c2, c3, colls)
    };
    G__8113.cljs$lang$arity$variadic = G__8113__delegate;
    return G__8113
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_(cljs.core.reduce.cljs$lang$arity$3(function(v, o) {
    if(cljs.core.truth_(pred.cljs$lang$arity$1 ? pred.cljs$lang$arity$1(o) : pred.call(null, o))) {
      return cljs.core.conj_BANG_(v, o)
    }else {
      return v
    }
  }, cljs.core.transient$(cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.cljs$lang$arity$3(n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8121 = cljs.core.seq(coll);
      if(temp__3974__auto____8121) {
        var s__8122 = temp__3974__auto____8121;
        var p__8123 = cljs.core.take(n, s__8122);
        if(n === cljs.core.count(p__8123)) {
          return cljs.core.cons(p__8123, partition.cljs$lang$arity$3(n, step, cljs.core.drop(step, s__8122)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8124 = cljs.core.seq(coll);
      if(temp__3974__auto____8124) {
        var s__8125 = temp__3974__auto____8124;
        var p__8126 = cljs.core.take(n, s__8125);
        if(n === cljs.core.count(p__8126)) {
          return cljs.core.cons(p__8126, partition.cljs$lang$arity$4(n, step, pad, cljs.core.drop(step, s__8125)))
        }else {
          return cljs.core.list.cljs$lang$arity$1(cljs.core.take(n, cljs.core.concat.cljs$lang$arity$2(p__8126, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.cljs$lang$arity$3(cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__8131 = cljs.core.lookup_sentinel;
    var m__8132 = m;
    var ks__8133 = cljs.core.seq(ks);
    while(true) {
      if(ks__8133) {
        var m__8134 = cljs.core._lookup.cljs$lang$arity$3(m__8132, cljs.core.first(ks__8133), sentinel__8131);
        if(sentinel__8131 === m__8134) {
          return not_found
        }else {
          var G__8135 = sentinel__8131;
          var G__8136 = m__8134;
          var G__8137 = cljs.core.next(ks__8133);
          sentinel__8131 = G__8135;
          m__8132 = G__8136;
          ks__8133 = G__8137;
          continue
        }
      }else {
        return m__8132
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__8138, v) {
  var vec__8143__8144 = p__8138;
  var k__8145 = cljs.core.nth.cljs$lang$arity$3(vec__8143__8144, 0, null);
  var ks__8146 = cljs.core.nthnext(vec__8143__8144, 1);
  if(cljs.core.truth_(ks__8146)) {
    return cljs.core.assoc.cljs$lang$arity$3(m, k__8145, assoc_in(cljs.core._lookup.cljs$lang$arity$3(m, k__8145, null), ks__8146, v))
  }else {
    return cljs.core.assoc.cljs$lang$arity$3(m, k__8145, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__8147, f, args) {
    var vec__8152__8153 = p__8147;
    var k__8154 = cljs.core.nth.cljs$lang$arity$3(vec__8152__8153, 0, null);
    var ks__8155 = cljs.core.nthnext(vec__8152__8153, 1);
    if(cljs.core.truth_(ks__8155)) {
      return cljs.core.assoc.cljs$lang$arity$3(m, k__8154, cljs.core.apply.cljs$lang$arity$5(update_in, cljs.core._lookup.cljs$lang$arity$3(m, k__8154, null), ks__8155, f, args))
    }else {
      return cljs.core.assoc.cljs$lang$arity$3(m, k__8154, cljs.core.apply.cljs$lang$arity$3(f, cljs.core._lookup.cljs$lang$arity$3(m, k__8154, null), args))
    }
  };
  var update_in = function(m, p__8147, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__8147, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__8156) {
    var m = cljs.core.first(arglist__8156);
    var p__8147 = cljs.core.first(cljs.core.next(arglist__8156));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8156)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8156)));
    return update_in__delegate(m, p__8147, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8159 = this;
  var h__2192__auto____8160 = this__8159.__hash;
  if(!(h__2192__auto____8160 == null)) {
    return h__2192__auto____8160
  }else {
    var h__2192__auto____8161 = cljs.core.hash_coll(coll);
    this__8159.__hash = h__2192__auto____8161;
    return h__2192__auto____8161
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8162 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8163 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8164 = this;
  var new_array__8165 = this__8164.array.slice();
  new_array__8165[k] = v;
  return new cljs.core.Vector(this__8164.meta, new_array__8165, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__8196 = null;
  var G__8196__2 = function(this_sym8166, k) {
    var this__8168 = this;
    var this_sym8166__8169 = this;
    var coll__8170 = this_sym8166__8169;
    return coll__8170.cljs$core$ILookup$_lookup$arity$2(coll__8170, k)
  };
  var G__8196__3 = function(this_sym8167, k, not_found) {
    var this__8168 = this;
    var this_sym8167__8171 = this;
    var coll__8172 = this_sym8167__8171;
    return coll__8172.cljs$core$ILookup$_lookup$arity$3(coll__8172, k, not_found)
  };
  G__8196 = function(this_sym8167, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8196__2.call(this, this_sym8167, k);
      case 3:
        return G__8196__3.call(this, this_sym8167, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8196
}();
cljs.core.Vector.prototype.apply = function(this_sym8157, args8158) {
  var this__8173 = this;
  return this_sym8157.call.apply(this_sym8157, [this_sym8157].concat(args8158.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8174 = this;
  var new_array__8175 = this__8174.array.slice();
  new_array__8175.push(o);
  return new cljs.core.Vector(this__8174.meta, new_array__8175, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__8176 = this;
  var this__8177 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__8177], 0))
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8178 = this;
  return cljs.core.ci_reduce.cljs$lang$arity$2(this__8178.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8179 = this;
  return cljs.core.ci_reduce.cljs$lang$arity$3(this__8179.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8180 = this;
  if(this__8180.array.length > 0) {
    var vector_seq__8181 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__8180.array.length) {
          return cljs.core.cons(this__8180.array[i], vector_seq(i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__8181.cljs$lang$arity$1 ? vector_seq__8181.cljs$lang$arity$1(0) : vector_seq__8181.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8182 = this;
  return this__8182.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8183 = this;
  var count__8184 = this__8183.array.length;
  if(count__8184 > 0) {
    return this__8183.array[count__8184 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8185 = this;
  if(this__8185.array.length > 0) {
    var new_array__8186 = this__8185.array.slice();
    new_array__8186.pop();
    return new cljs.core.Vector(this__8185.meta, new_array__8186, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8187 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8188 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8189 = this;
  return new cljs.core.Vector(meta, this__8189.array, this__8189.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8190 = this;
  return this__8190.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8191 = this;
  if(function() {
    var and__3822__auto____8192 = 0 <= n;
    if(and__3822__auto____8192) {
      return n < this__8191.array.length
    }else {
      return and__3822__auto____8192
    }
  }()) {
    return this__8191.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8193 = this;
  if(function() {
    var and__3822__auto____8194 = 0 <= n;
    if(and__3822__auto____8194) {
      return n < this__8193.array.length
    }else {
      return and__3822__auto____8194
    }
  }()) {
    return this__8193.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8195 = this;
  return cljs.core.with_meta(cljs.core.Vector.EMPTY, this__8195.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__2310__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.cljs$lang$arity$1(32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__8198 = pv.cnt;
  if(cnt__8198 < 32) {
    return 0
  }else {
    return cnt__8198 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__8204 = level;
  var ret__8205 = node;
  while(true) {
    if(ll__8204 === 0) {
      return ret__8205
    }else {
      var embed__8206 = ret__8205;
      var r__8207 = cljs.core.pv_fresh_node(edit);
      var ___8208 = cljs.core.pv_aset(r__8207, 0, embed__8206);
      var G__8209 = ll__8204 - 5;
      var G__8210 = r__8207;
      ll__8204 = G__8209;
      ret__8205 = G__8210;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__8216 = cljs.core.pv_clone_node(parent);
  var subidx__8217 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset(ret__8216, subidx__8217, tailnode);
    return ret__8216
  }else {
    var child__8218 = cljs.core.pv_aget(parent, subidx__8217);
    if(!(child__8218 == null)) {
      var node_to_insert__8219 = push_tail(pv, level - 5, child__8218, tailnode);
      cljs.core.pv_aset(ret__8216, subidx__8217, node_to_insert__8219);
      return ret__8216
    }else {
      var node_to_insert__8220 = cljs.core.new_path(null, level - 5, tailnode);
      cljs.core.pv_aset(ret__8216, subidx__8217, node_to_insert__8220);
      return ret__8216
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____8224 = 0 <= i;
    if(and__3822__auto____8224) {
      return i < pv.cnt
    }else {
      return and__3822__auto____8224
    }
  }()) {
    if(i >= cljs.core.tail_off(pv)) {
      return pv.tail
    }else {
      var node__8225 = pv.root;
      var level__8226 = pv.shift;
      while(true) {
        if(level__8226 > 0) {
          var G__8227 = cljs.core.pv_aget(node__8225, i >>> level__8226 & 31);
          var G__8228 = level__8226 - 5;
          node__8225 = G__8227;
          level__8226 = G__8228;
          continue
        }else {
          return node__8225.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__8231 = cljs.core.pv_clone_node(node);
  if(level === 0) {
    cljs.core.pv_aset(ret__8231, i & 31, val);
    return ret__8231
  }else {
    var subidx__8232 = i >>> level & 31;
    cljs.core.pv_aset(ret__8231, subidx__8232, do_assoc(pv, level - 5, cljs.core.pv_aget(node, subidx__8232), i, val));
    return ret__8231
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__8238 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8239 = pop_tail(pv, level - 5, cljs.core.pv_aget(node, subidx__8238));
    if(function() {
      var and__3822__auto____8240 = new_child__8239 == null;
      if(and__3822__auto____8240) {
        return subidx__8238 === 0
      }else {
        return and__3822__auto____8240
      }
    }()) {
      return null
    }else {
      var ret__8241 = cljs.core.pv_clone_node(node);
      cljs.core.pv_aset(ret__8241, subidx__8238, new_child__8239);
      return ret__8241
    }
  }else {
    if(subidx__8238 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__8242 = cljs.core.pv_clone_node(node);
        cljs.core.pv_aset(ret__8242, subidx__8238, null);
        return ret__8242
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8245 = this;
  return new cljs.core.TransientVector(this__8245.cnt, this__8245.shift, cljs.core.tv_editable_root(this__8245.root), cljs.core.tv_editable_tail(this__8245.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8246 = this;
  var h__2192__auto____8247 = this__8246.__hash;
  if(!(h__2192__auto____8247 == null)) {
    return h__2192__auto____8247
  }else {
    var h__2192__auto____8248 = cljs.core.hash_coll(coll);
    this__8246.__hash = h__2192__auto____8248;
    return h__2192__auto____8248
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8249 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8250 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8251 = this;
  if(function() {
    var and__3822__auto____8252 = 0 <= k;
    if(and__3822__auto____8252) {
      return k < this__8251.cnt
    }else {
      return and__3822__auto____8252
    }
  }()) {
    if(cljs.core.tail_off(coll) <= k) {
      var new_tail__8253 = this__8251.tail.slice();
      new_tail__8253[k & 31] = v;
      return new cljs.core.PersistentVector(this__8251.meta, this__8251.cnt, this__8251.shift, this__8251.root, new_tail__8253, null)
    }else {
      return new cljs.core.PersistentVector(this__8251.meta, this__8251.cnt, this__8251.shift, cljs.core.do_assoc(coll, this__8251.shift, this__8251.root, k, v), this__8251.tail, null)
    }
  }else {
    if(k === this__8251.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__8251.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__8301 = null;
  var G__8301__2 = function(this_sym8254, k) {
    var this__8256 = this;
    var this_sym8254__8257 = this;
    var coll__8258 = this_sym8254__8257;
    return coll__8258.cljs$core$ILookup$_lookup$arity$2(coll__8258, k)
  };
  var G__8301__3 = function(this_sym8255, k, not_found) {
    var this__8256 = this;
    var this_sym8255__8259 = this;
    var coll__8260 = this_sym8255__8259;
    return coll__8260.cljs$core$ILookup$_lookup$arity$3(coll__8260, k, not_found)
  };
  G__8301 = function(this_sym8255, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8301__2.call(this, this_sym8255, k);
      case 3:
        return G__8301__3.call(this, this_sym8255, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8301
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym8243, args8244) {
  var this__8261 = this;
  return this_sym8243.call.apply(this_sym8243, [this_sym8243].concat(args8244.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__8262 = this;
  var step_init__8263 = [0, init];
  var i__8264 = 0;
  while(true) {
    if(i__8264 < this__8262.cnt) {
      var arr__8265 = cljs.core.array_for(v, i__8264);
      var len__8266 = arr__8265.length;
      var init__8270 = function() {
        var j__8267 = 0;
        var init__8268 = step_init__8263[1];
        while(true) {
          if(j__8267 < len__8266) {
            var init__8269 = f.cljs$lang$arity$3 ? f.cljs$lang$arity$3(init__8268, j__8267 + i__8264, arr__8265[j__8267]) : f.call(null, init__8268, j__8267 + i__8264, arr__8265[j__8267]);
            if(cljs.core.reduced_QMARK_(init__8269)) {
              return init__8269
            }else {
              var G__8302 = j__8267 + 1;
              var G__8303 = init__8269;
              j__8267 = G__8302;
              init__8268 = G__8303;
              continue
            }
          }else {
            step_init__8263[0] = len__8266;
            step_init__8263[1] = init__8268;
            return init__8268
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_(init__8270)) {
        return cljs.core.deref(init__8270)
      }else {
        var G__8304 = i__8264 + step_init__8263[0];
        i__8264 = G__8304;
        continue
      }
    }else {
      return step_init__8263[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8271 = this;
  if(this__8271.cnt - cljs.core.tail_off(coll) < 32) {
    var new_tail__8272 = this__8271.tail.slice();
    new_tail__8272.push(o);
    return new cljs.core.PersistentVector(this__8271.meta, this__8271.cnt + 1, this__8271.shift, this__8271.root, new_tail__8272, null)
  }else {
    var root_overflow_QMARK___8273 = this__8271.cnt >>> 5 > 1 << this__8271.shift;
    var new_shift__8274 = root_overflow_QMARK___8273 ? this__8271.shift + 5 : this__8271.shift;
    var new_root__8276 = root_overflow_QMARK___8273 ? function() {
      var n_r__8275 = cljs.core.pv_fresh_node(null);
      cljs.core.pv_aset(n_r__8275, 0, this__8271.root);
      cljs.core.pv_aset(n_r__8275, 1, cljs.core.new_path(null, this__8271.shift, new cljs.core.VectorNode(null, this__8271.tail)));
      return n_r__8275
    }() : cljs.core.push_tail(coll, this__8271.shift, this__8271.root, new cljs.core.VectorNode(null, this__8271.tail));
    return new cljs.core.PersistentVector(this__8271.meta, this__8271.cnt + 1, new_shift__8274, new_root__8276, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__8277 = this;
  if(this__8277.cnt > 0) {
    return new cljs.core.RSeq(coll, this__8277.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__8278 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__8279 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__8280 = this;
  var this__8281 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__8281], 0))
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8282 = this;
  return cljs.core.ci_reduce.cljs$lang$arity$2(v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8283 = this;
  return cljs.core.ci_reduce.cljs$lang$arity$3(v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8284 = this;
  if(this__8284.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.cljs$lang$arity$3(coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8285 = this;
  return this__8285.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8286 = this;
  if(this__8286.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__8286.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8287 = this;
  if(this__8287.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__8287.cnt) {
      return cljs.core._with_meta(cljs.core.PersistentVector.EMPTY, this__8287.meta)
    }else {
      if(1 < this__8287.cnt - cljs.core.tail_off(coll)) {
        return new cljs.core.PersistentVector(this__8287.meta, this__8287.cnt - 1, this__8287.shift, this__8287.root, this__8287.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__8288 = cljs.core.array_for(coll, this__8287.cnt - 2);
          var nr__8289 = cljs.core.pop_tail(coll, this__8287.shift, this__8287.root);
          var new_root__8290 = nr__8289 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__8289;
          var cnt_1__8291 = this__8287.cnt - 1;
          if(function() {
            var and__3822__auto____8292 = 5 < this__8287.shift;
            if(and__3822__auto____8292) {
              return cljs.core.pv_aget(new_root__8290, 1) == null
            }else {
              return and__3822__auto____8292
            }
          }()) {
            return new cljs.core.PersistentVector(this__8287.meta, cnt_1__8291, this__8287.shift - 5, cljs.core.pv_aget(new_root__8290, 0), new_tail__8288, null)
          }else {
            return new cljs.core.PersistentVector(this__8287.meta, cnt_1__8291, this__8287.shift, new_root__8290, new_tail__8288, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8293 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8294 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8295 = this;
  return new cljs.core.PersistentVector(meta, this__8295.cnt, this__8295.shift, this__8295.root, this__8295.tail, this__8295.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8296 = this;
  return this__8296.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8297 = this;
  return cljs.core.array_for(coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8298 = this;
  if(function() {
    var and__3822__auto____8299 = 0 <= n;
    if(and__3822__auto____8299) {
      return n < this__8298.cnt
    }else {
      return and__3822__auto____8299
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8300 = this;
  return cljs.core.with_meta(cljs.core.PersistentVector.EMPTY, this__8300.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node(null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__8305 = xs.length;
  var xs__8306 = no_clone === true ? xs : xs.slice();
  if(l__8305 < 32) {
    return new cljs.core.PersistentVector(null, l__8305, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__8306, null)
  }else {
    var node__8307 = xs__8306.slice(0, 32);
    var v__8308 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__8307, null);
    var i__8309 = 32;
    var out__8310 = cljs.core._as_transient(v__8308);
    while(true) {
      if(i__8309 < l__8305) {
        var G__8311 = i__8309 + 1;
        var G__8312 = cljs.core.conj_BANG_(out__8310, xs__8306[i__8309]);
        i__8309 = G__8311;
        out__8310 = G__8312;
        continue
      }else {
        return cljs.core.persistent_BANG_(out__8310)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_(cljs.core.reduce.cljs$lang$arity$3(cljs.core._conj_BANG_, cljs.core._as_transient(cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec(args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__8313) {
    var args = cljs.core.seq(arglist__8313);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.ChunkedSeq = function(vec, node, i, off, meta) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27525356
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8314 = this;
  if(this__8314.off + 1 < this__8314.node.length) {
    var s__8315 = cljs.core.chunked_seq.cljs$lang$arity$4(this__8314.vec, this__8314.node, this__8314.i, this__8314.off + 1);
    if(s__8315 == null) {
      return null
    }else {
      return s__8315
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8316 = this;
  return cljs.core.cons(o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8317 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8318 = this;
  return this__8318.node[this__8318.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8319 = this;
  if(this__8319.off + 1 < this__8319.node.length) {
    var s__8320 = cljs.core.chunked_seq.cljs$lang$arity$4(this__8319.vec, this__8319.node, this__8319.i, this__8319.off + 1);
    if(s__8320 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__8320
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__8321 = this;
  var l__8322 = this__8321.node.length;
  var s__8323 = this__8321.i + l__8322 < cljs.core._count(this__8321.vec) ? cljs.core.chunked_seq.cljs$lang$arity$3(this__8321.vec, this__8321.i + l__8322, 0) : null;
  if(s__8323 == null) {
    return null
  }else {
    return s__8323
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8324 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__8325 = this;
  return cljs.core.chunked_seq.cljs$lang$arity$5(this__8325.vec, this__8325.node, this__8325.i, this__8325.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__8326 = this;
  return this__8326.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8327 = this;
  return cljs.core.with_meta(cljs.core.PersistentVector.EMPTY, this__8327.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__8328 = this;
  return cljs.core.array_chunk.cljs$lang$arity$2(this__8328.node, this__8328.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__8329 = this;
  var l__8330 = this__8329.node.length;
  var s__8331 = this__8329.i + l__8330 < cljs.core._count(this__8329.vec) ? cljs.core.chunked_seq.cljs$lang$arity$3(this__8329.vec, this__8329.i + l__8330, 0) : null;
  if(s__8331 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__8331
  }
};
cljs.core.ChunkedSeq;
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.cljs$lang$arity$5(vec, cljs.core.array_for(vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.cljs$lang$arity$5(vec, node, i, off, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw"Invalid arity: " + arguments.length;
  };
  chunked_seq.cljs$lang$arity$3 = chunked_seq__3;
  chunked_seq.cljs$lang$arity$4 = chunked_seq__4;
  chunked_seq.cljs$lang$arity$5 = chunked_seq__5;
  return chunked_seq
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8334 = this;
  var h__2192__auto____8335 = this__8334.__hash;
  if(!(h__2192__auto____8335 == null)) {
    return h__2192__auto____8335
  }else {
    var h__2192__auto____8336 = cljs.core.hash_coll(coll);
    this__8334.__hash = h__2192__auto____8336;
    return h__2192__auto____8336
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8337 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8338 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__8339 = this;
  var v_pos__8340 = this__8339.start + key;
  return new cljs.core.Subvec(this__8339.meta, cljs.core._assoc(this__8339.v, v_pos__8340, val), this__8339.start, this__8339.end > v_pos__8340 + 1 ? this__8339.end : v_pos__8340 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__8366 = null;
  var G__8366__2 = function(this_sym8341, k) {
    var this__8343 = this;
    var this_sym8341__8344 = this;
    var coll__8345 = this_sym8341__8344;
    return coll__8345.cljs$core$ILookup$_lookup$arity$2(coll__8345, k)
  };
  var G__8366__3 = function(this_sym8342, k, not_found) {
    var this__8343 = this;
    var this_sym8342__8346 = this;
    var coll__8347 = this_sym8342__8346;
    return coll__8347.cljs$core$ILookup$_lookup$arity$3(coll__8347, k, not_found)
  };
  G__8366 = function(this_sym8342, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8366__2.call(this, this_sym8342, k);
      case 3:
        return G__8366__3.call(this, this_sym8342, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8366
}();
cljs.core.Subvec.prototype.apply = function(this_sym8332, args8333) {
  var this__8348 = this;
  return this_sym8332.call.apply(this_sym8332, [this_sym8332].concat(args8333.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8349 = this;
  return new cljs.core.Subvec(this__8349.meta, cljs.core._assoc_n(this__8349.v, this__8349.end, o), this__8349.start, this__8349.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__8350 = this;
  var this__8351 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__8351], 0))
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__8352 = this;
  return cljs.core.ci_reduce.cljs$lang$arity$2(coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__8353 = this;
  return cljs.core.ci_reduce.cljs$lang$arity$3(coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8354 = this;
  var subvec_seq__8355 = function subvec_seq(i) {
    if(i === this__8354.end) {
      return null
    }else {
      return cljs.core.cons(cljs.core._nth.cljs$lang$arity$2(this__8354.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq(i + 1)
      }, null))
    }
  };
  return subvec_seq__8355.cljs$lang$arity$1 ? subvec_seq__8355.cljs$lang$arity$1(this__8354.start) : subvec_seq__8355.call(null, this__8354.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8356 = this;
  return this__8356.end - this__8356.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8357 = this;
  return cljs.core._nth.cljs$lang$arity$2(this__8357.v, this__8357.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8358 = this;
  if(this__8358.start === this__8358.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__8358.meta, this__8358.v, this__8358.start, this__8358.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8359 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8360 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8361 = this;
  return new cljs.core.Subvec(meta, this__8361.v, this__8361.start, this__8361.end, this__8361.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8362 = this;
  return this__8362.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8363 = this;
  return cljs.core._nth.cljs$lang$arity$2(this__8363.v, this__8363.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8364 = this;
  return cljs.core._nth.cljs$lang$arity$3(this__8364.v, this__8364.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8365 = this;
  return cljs.core.with_meta(cljs.core.Vector.EMPTY, this__8365.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.cljs$lang$arity$3(v, start, cljs.core.count(v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__8368 = cljs.core.make_array.cljs$lang$arity$1(32);
  cljs.core.array_copy(tl, 0, ret__8368, 0, tl.length);
  return ret__8368
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__8372 = cljs.core.tv_ensure_editable(tv.root.edit, parent);
  var subidx__8373 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset(ret__8372, subidx__8373, level === 5 ? tail_node : function() {
    var child__8374 = cljs.core.pv_aget(ret__8372, subidx__8373);
    if(!(child__8374 == null)) {
      return tv_push_tail(tv, level - 5, child__8374, tail_node)
    }else {
      return cljs.core.new_path(tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__8372
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__8379 = cljs.core.tv_ensure_editable(tv.root.edit, node);
  var subidx__8380 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8381 = tv_pop_tail(tv, level - 5, cljs.core.pv_aget(node__8379, subidx__8380));
    if(function() {
      var and__3822__auto____8382 = new_child__8381 == null;
      if(and__3822__auto____8382) {
        return subidx__8380 === 0
      }else {
        return and__3822__auto____8382
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset(node__8379, subidx__8380, new_child__8381);
      return node__8379
    }
  }else {
    if(subidx__8380 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset(node__8379, subidx__8380, null);
        return node__8379
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____8387 = 0 <= i;
    if(and__3822__auto____8387) {
      return i < tv.cnt
    }else {
      return and__3822__auto____8387
    }
  }()) {
    if(i >= cljs.core.tail_off(tv)) {
      return tv.tail
    }else {
      var root__8388 = tv.root;
      var node__8389 = root__8388;
      var level__8390 = tv.shift;
      while(true) {
        if(level__8390 > 0) {
          var G__8391 = cljs.core.tv_ensure_editable(root__8388.edit, cljs.core.pv_aget(node__8389, i >>> level__8390 & 31));
          var G__8392 = level__8390 - 5;
          node__8389 = G__8391;
          level__8390 = G__8392;
          continue
        }else {
          return node__8389.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 22
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__8432 = null;
  var G__8432__2 = function(this_sym8395, k) {
    var this__8397 = this;
    var this_sym8395__8398 = this;
    var coll__8399 = this_sym8395__8398;
    return coll__8399.cljs$core$ILookup$_lookup$arity$2(coll__8399, k)
  };
  var G__8432__3 = function(this_sym8396, k, not_found) {
    var this__8397 = this;
    var this_sym8396__8400 = this;
    var coll__8401 = this_sym8396__8400;
    return coll__8401.cljs$core$ILookup$_lookup$arity$3(coll__8401, k, not_found)
  };
  G__8432 = function(this_sym8396, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8432__2.call(this, this_sym8396, k);
      case 3:
        return G__8432__3.call(this, this_sym8396, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8432
}();
cljs.core.TransientVector.prototype.apply = function(this_sym8393, args8394) {
  var this__8402 = this;
  return this_sym8393.call.apply(this_sym8393, [this_sym8393].concat(args8394.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8403 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8404 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8405 = this;
  if(this__8405.root.edit) {
    return cljs.core.array_for(coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8406 = this;
  if(function() {
    var and__3822__auto____8407 = 0 <= n;
    if(and__3822__auto____8407) {
      return n < this__8406.cnt
    }else {
      return and__3822__auto____8407
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8408 = this;
  if(this__8408.root.edit) {
    return this__8408.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__8409 = this;
  if(this__8409.root.edit) {
    if(function() {
      var and__3822__auto____8410 = 0 <= n;
      if(and__3822__auto____8410) {
        return n < this__8409.cnt
      }else {
        return and__3822__auto____8410
      }
    }()) {
      if(cljs.core.tail_off(tcoll) <= n) {
        this__8409.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__8415 = function go(level, node) {
          var node__8413 = cljs.core.tv_ensure_editable(this__8409.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset(node__8413, n & 31, val);
            return node__8413
          }else {
            var subidx__8414 = n >>> level & 31;
            cljs.core.pv_aset(node__8413, subidx__8414, go(level - 5, cljs.core.pv_aget(node__8413, subidx__8414)));
            return node__8413
          }
        }.call(null, this__8409.shift, this__8409.root);
        this__8409.root = new_root__8415;
        return tcoll
      }
    }else {
      if(n === this__8409.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__8409.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__8416 = this;
  if(this__8416.root.edit) {
    if(this__8416.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__8416.cnt) {
        this__8416.cnt = 0;
        return tcoll
      }else {
        if((this__8416.cnt - 1 & 31) > 0) {
          this__8416.cnt = this__8416.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__8417 = cljs.core.editable_array_for(tcoll, this__8416.cnt - 2);
            var new_root__8419 = function() {
              var nr__8418 = cljs.core.tv_pop_tail(tcoll, this__8416.shift, this__8416.root);
              if(!(nr__8418 == null)) {
                return nr__8418
              }else {
                return new cljs.core.VectorNode(this__8416.root.edit, cljs.core.make_array.cljs$lang$arity$1(32))
              }
            }();
            if(function() {
              var and__3822__auto____8420 = 5 < this__8416.shift;
              if(and__3822__auto____8420) {
                return cljs.core.pv_aget(new_root__8419, 1) == null
              }else {
                return and__3822__auto____8420
              }
            }()) {
              var new_root__8421 = cljs.core.tv_ensure_editable(this__8416.root.edit, cljs.core.pv_aget(new_root__8419, 0));
              this__8416.root = new_root__8421;
              this__8416.shift = this__8416.shift - 5;
              this__8416.cnt = this__8416.cnt - 1;
              this__8416.tail = new_tail__8417;
              return tcoll
            }else {
              this__8416.root = new_root__8419;
              this__8416.cnt = this__8416.cnt - 1;
              this__8416.tail = new_tail__8417;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8422 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8423 = this;
  if(this__8423.root.edit) {
    if(this__8423.cnt - cljs.core.tail_off(tcoll) < 32) {
      this__8423.tail[this__8423.cnt & 31] = o;
      this__8423.cnt = this__8423.cnt + 1;
      return tcoll
    }else {
      var tail_node__8424 = new cljs.core.VectorNode(this__8423.root.edit, this__8423.tail);
      var new_tail__8425 = cljs.core.make_array.cljs$lang$arity$1(32);
      new_tail__8425[0] = o;
      this__8423.tail = new_tail__8425;
      if(this__8423.cnt >>> 5 > 1 << this__8423.shift) {
        var new_root_array__8426 = cljs.core.make_array.cljs$lang$arity$1(32);
        var new_shift__8427 = this__8423.shift + 5;
        new_root_array__8426[0] = this__8423.root;
        new_root_array__8426[1] = cljs.core.new_path(this__8423.root.edit, this__8423.shift, tail_node__8424);
        this__8423.root = new cljs.core.VectorNode(this__8423.root.edit, new_root_array__8426);
        this__8423.shift = new_shift__8427;
        this__8423.cnt = this__8423.cnt + 1;
        return tcoll
      }else {
        var new_root__8428 = cljs.core.tv_push_tail(tcoll, this__8423.shift, this__8423.root, tail_node__8424);
        this__8423.root = new_root__8428;
        this__8423.cnt = this__8423.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8429 = this;
  if(this__8429.root.edit) {
    this__8429.root.edit = null;
    var len__8430 = this__8429.cnt - cljs.core.tail_off(tcoll);
    var trimmed_tail__8431 = cljs.core.make_array.cljs$lang$arity$1(len__8430);
    cljs.core.array_copy(this__8429.tail, 0, trimmed_tail__8431, 0, len__8430);
    return new cljs.core.PersistentVector(null, this__8429.cnt, this__8429.shift, this__8429.root, trimmed_tail__8431, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8433 = this;
  var h__2192__auto____8434 = this__8433.__hash;
  if(!(h__2192__auto____8434 == null)) {
    return h__2192__auto____8434
  }else {
    var h__2192__auto____8435 = cljs.core.hash_coll(coll);
    this__8433.__hash = h__2192__auto____8435;
    return h__2192__auto____8435
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8436 = this;
  return cljs.core.cons(o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__8437 = this;
  var this__8438 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__8438], 0))
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8439 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8440 = this;
  return cljs.core._first(this__8440.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8441 = this;
  var temp__3971__auto____8442 = cljs.core.next(this__8441.front);
  if(temp__3971__auto____8442) {
    var f1__8443 = temp__3971__auto____8442;
    return new cljs.core.PersistentQueueSeq(this__8441.meta, f1__8443, this__8441.rear, null)
  }else {
    if(this__8441.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__8441.meta, this__8441.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8444 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8445 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__8445.front, this__8445.rear, this__8445.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8446 = this;
  return this__8446.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8447 = this;
  return cljs.core.with_meta(cljs.core.List.EMPTY, this__8447.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8448 = this;
  var h__2192__auto____8449 = this__8448.__hash;
  if(!(h__2192__auto____8449 == null)) {
    return h__2192__auto____8449
  }else {
    var h__2192__auto____8450 = cljs.core.hash_coll(coll);
    this__8448.__hash = h__2192__auto____8450;
    return h__2192__auto____8450
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8451 = this;
  if(cljs.core.truth_(this__8451.front)) {
    return new cljs.core.PersistentQueue(this__8451.meta, this__8451.count + 1, this__8451.front, cljs.core.conj.cljs$lang$arity$2(function() {
      var or__3824__auto____8452 = this__8451.rear;
      if(cljs.core.truth_(or__3824__auto____8452)) {
        return or__3824__auto____8452
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__8451.meta, this__8451.count + 1, cljs.core.conj.cljs$lang$arity$2(this__8451.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__8453 = this;
  var this__8454 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__8454], 0))
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8455 = this;
  var rear__8456 = cljs.core.seq(this__8455.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____8457 = this__8455.front;
    if(cljs.core.truth_(or__3824__auto____8457)) {
      return or__3824__auto____8457
    }else {
      return rear__8456
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__8455.front, cljs.core.seq(rear__8456), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8458 = this;
  return this__8458.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8459 = this;
  return cljs.core._first(this__8459.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8460 = this;
  if(cljs.core.truth_(this__8460.front)) {
    var temp__3971__auto____8461 = cljs.core.next(this__8460.front);
    if(temp__3971__auto____8461) {
      var f1__8462 = temp__3971__auto____8461;
      return new cljs.core.PersistentQueue(this__8460.meta, this__8460.count - 1, f1__8462, this__8460.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__8460.meta, this__8460.count - 1, cljs.core.seq(this__8460.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8463 = this;
  return cljs.core.first(this__8463.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8464 = this;
  return cljs.core.rest(cljs.core.seq(coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8465 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8466 = this;
  return new cljs.core.PersistentQueue(meta, this__8466.count, this__8466.front, this__8466.rear, this__8466.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8467 = this;
  return this__8467.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8468 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__8469 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$(cljs.core.map_QMARK_(y) ? cljs.core.count(x) === cljs.core.count(y) ? cljs.core.every_QMARK_(cljs.core.identity, cljs.core.map.cljs$lang$arity$2(function(xkv) {
    return cljs.core._EQ_.cljs$lang$arity$2(cljs.core._lookup.cljs$lang$arity$3(y, cljs.core.first(xkv), cljs.core.never_equiv), cljs.core.second(xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__8472 = array.length;
  var i__8473 = 0;
  while(true) {
    if(i__8473 < len__8472) {
      if(k === array[i__8473]) {
        return i__8473
      }else {
        var G__8474 = i__8473 + incr;
        i__8473 = G__8474;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__8477 = cljs.core.hash.cljs$lang$arity$1(a);
  var b__8478 = cljs.core.hash.cljs$lang$arity$1(b);
  if(a__8477 < b__8478) {
    return-1
  }else {
    if(a__8477 > b__8478) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__8486 = m.keys;
  var len__8487 = ks__8486.length;
  var so__8488 = m.strobj;
  var out__8489 = cljs.core.with_meta(cljs.core.PersistentHashMap.EMPTY, cljs.core.meta(m));
  var i__8490 = 0;
  var out__8491 = cljs.core.transient$(out__8489);
  while(true) {
    if(i__8490 < len__8487) {
      var k__8492 = ks__8486[i__8490];
      var G__8493 = i__8490 + 1;
      var G__8494 = cljs.core.assoc_BANG_(out__8491, k__8492, so__8488[k__8492]);
      i__8490 = G__8493;
      out__8491 = G__8494;
      continue
    }else {
      return cljs.core.persistent_BANG_(cljs.core.assoc_BANG_(out__8491, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__8500 = {};
  var l__8501 = ks.length;
  var i__8502 = 0;
  while(true) {
    if(i__8502 < l__8501) {
      var k__8503 = ks[i__8502];
      new_obj__8500[k__8503] = obj[k__8503];
      var G__8504 = i__8502 + 1;
      i__8502 = G__8504;
      continue
    }else {
    }
    break
  }
  return new_obj__8500
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8507 = this;
  return cljs.core.transient$(cljs.core.into(cljs.core.hash_map(), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8508 = this;
  var h__2192__auto____8509 = this__8508.__hash;
  if(!(h__2192__auto____8509 == null)) {
    return h__2192__auto____8509
  }else {
    var h__2192__auto____8510 = cljs.core.hash_imap(coll);
    this__8508.__hash = h__2192__auto____8510;
    return h__2192__auto____8510
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8511 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8512 = this;
  if(function() {
    var and__3822__auto____8513 = goog.isString(k);
    if(and__3822__auto____8513) {
      return!(cljs.core.scan_array(1, k, this__8512.keys) == null)
    }else {
      return and__3822__auto____8513
    }
  }()) {
    return this__8512.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8514 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____8515 = this__8514.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____8515) {
        return or__3824__auto____8515
      }else {
        return this__8514.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map(coll, k, v)
    }else {
      if(!(cljs.core.scan_array(1, k, this__8514.keys) == null)) {
        var new_strobj__8516 = cljs.core.obj_clone(this__8514.strobj, this__8514.keys);
        new_strobj__8516[k] = v;
        return new cljs.core.ObjMap(this__8514.meta, this__8514.keys, new_strobj__8516, this__8514.update_count + 1, null)
      }else {
        var new_strobj__8517 = cljs.core.obj_clone(this__8514.strobj, this__8514.keys);
        var new_keys__8518 = this__8514.keys.slice();
        new_strobj__8517[k] = v;
        new_keys__8518.push(k);
        return new cljs.core.ObjMap(this__8514.meta, new_keys__8518, new_strobj__8517, this__8514.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map(coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8519 = this;
  if(function() {
    var and__3822__auto____8520 = goog.isString(k);
    if(and__3822__auto____8520) {
      return!(cljs.core.scan_array(1, k, this__8519.keys) == null)
    }else {
      return and__3822__auto____8520
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__8542 = null;
  var G__8542__2 = function(this_sym8521, k) {
    var this__8523 = this;
    var this_sym8521__8524 = this;
    var coll__8525 = this_sym8521__8524;
    return coll__8525.cljs$core$ILookup$_lookup$arity$2(coll__8525, k)
  };
  var G__8542__3 = function(this_sym8522, k, not_found) {
    var this__8523 = this;
    var this_sym8522__8526 = this;
    var coll__8527 = this_sym8522__8526;
    return coll__8527.cljs$core$ILookup$_lookup$arity$3(coll__8527, k, not_found)
  };
  G__8542 = function(this_sym8522, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8542__2.call(this, this_sym8522, k);
      case 3:
        return G__8542__3.call(this, this_sym8522, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8542
}();
cljs.core.ObjMap.prototype.apply = function(this_sym8505, args8506) {
  var this__8528 = this;
  return this_sym8505.call.apply(this_sym8505, [this_sym8505].concat(args8506.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8529 = this;
  if(cljs.core.vector_QMARK_(entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.cljs$lang$arity$2(entry, 0), cljs.core._nth.cljs$lang$arity$2(entry, 1))
  }else {
    return cljs.core.reduce.cljs$lang$arity$3(cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__8530 = this;
  var this__8531 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__8531], 0))
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8532 = this;
  if(this__8532.keys.length > 0) {
    return cljs.core.map.cljs$lang$arity$2(function(p1__8495_SHARP_) {
      return cljs.core.vector.cljs$lang$arity$variadic(cljs.core.array_seq([p1__8495_SHARP_, this__8532.strobj[p1__8495_SHARP_]], 0))
    }, this__8532.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8533 = this;
  return this__8533.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8534 = this;
  return cljs.core.equiv_map(coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8535 = this;
  return new cljs.core.ObjMap(meta, this__8535.keys, this__8535.strobj, this__8535.update_count, this__8535.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8536 = this;
  return this__8536.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8537 = this;
  return cljs.core.with_meta(cljs.core.ObjMap.EMPTY, this__8537.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8538 = this;
  if(function() {
    var and__3822__auto____8539 = goog.isString(k);
    if(and__3822__auto____8539) {
      return!(cljs.core.scan_array(1, k, this__8538.keys) == null)
    }else {
      return and__3822__auto____8539
    }
  }()) {
    var new_keys__8540 = this__8538.keys.slice();
    var new_strobj__8541 = cljs.core.obj_clone(this__8538.strobj, this__8538.keys);
    new_keys__8540.splice(cljs.core.scan_array(1, k, new_keys__8540), 1);
    cljs.core.js_delete(new_strobj__8541, k);
    return new cljs.core.ObjMap(this__8538.meta, new_keys__8540, new_strobj__8541, this__8538.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8546 = this;
  var h__2192__auto____8547 = this__8546.__hash;
  if(!(h__2192__auto____8547 == null)) {
    return h__2192__auto____8547
  }else {
    var h__2192__auto____8548 = cljs.core.hash_imap(coll);
    this__8546.__hash = h__2192__auto____8548;
    return h__2192__auto____8548
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8549 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8550 = this;
  var bucket__8551 = this__8550.hashobj[cljs.core.hash.cljs$lang$arity$1(k)];
  var i__8552 = cljs.core.truth_(bucket__8551) ? cljs.core.scan_array(2, k, bucket__8551) : null;
  if(cljs.core.truth_(i__8552)) {
    return bucket__8551[i__8552 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8553 = this;
  var h__8554 = cljs.core.hash.cljs$lang$arity$1(k);
  var bucket__8555 = this__8553.hashobj[h__8554];
  if(cljs.core.truth_(bucket__8555)) {
    var new_bucket__8556 = bucket__8555.slice();
    var new_hashobj__8557 = goog.object.clone(this__8553.hashobj);
    new_hashobj__8557[h__8554] = new_bucket__8556;
    var temp__3971__auto____8558 = cljs.core.scan_array(2, k, new_bucket__8556);
    if(cljs.core.truth_(temp__3971__auto____8558)) {
      var i__8559 = temp__3971__auto____8558;
      new_bucket__8556[i__8559 + 1] = v;
      return new cljs.core.HashMap(this__8553.meta, this__8553.count, new_hashobj__8557, null)
    }else {
      new_bucket__8556.push(k, v);
      return new cljs.core.HashMap(this__8553.meta, this__8553.count + 1, new_hashobj__8557, null)
    }
  }else {
    var new_hashobj__8560 = goog.object.clone(this__8553.hashobj);
    new_hashobj__8560[h__8554] = [k, v];
    return new cljs.core.HashMap(this__8553.meta, this__8553.count + 1, new_hashobj__8560, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8561 = this;
  var bucket__8562 = this__8561.hashobj[cljs.core.hash.cljs$lang$arity$1(k)];
  var i__8563 = cljs.core.truth_(bucket__8562) ? cljs.core.scan_array(2, k, bucket__8562) : null;
  if(cljs.core.truth_(i__8563)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__8588 = null;
  var G__8588__2 = function(this_sym8564, k) {
    var this__8566 = this;
    var this_sym8564__8567 = this;
    var coll__8568 = this_sym8564__8567;
    return coll__8568.cljs$core$ILookup$_lookup$arity$2(coll__8568, k)
  };
  var G__8588__3 = function(this_sym8565, k, not_found) {
    var this__8566 = this;
    var this_sym8565__8569 = this;
    var coll__8570 = this_sym8565__8569;
    return coll__8570.cljs$core$ILookup$_lookup$arity$3(coll__8570, k, not_found)
  };
  G__8588 = function(this_sym8565, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8588__2.call(this, this_sym8565, k);
      case 3:
        return G__8588__3.call(this, this_sym8565, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8588
}();
cljs.core.HashMap.prototype.apply = function(this_sym8544, args8545) {
  var this__8571 = this;
  return this_sym8544.call.apply(this_sym8544, [this_sym8544].concat(args8545.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8572 = this;
  if(cljs.core.vector_QMARK_(entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.cljs$lang$arity$2(entry, 0), cljs.core._nth.cljs$lang$arity$2(entry, 1))
  }else {
    return cljs.core.reduce.cljs$lang$arity$3(cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__8573 = this;
  var this__8574 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__8574], 0))
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8575 = this;
  if(this__8575.count > 0) {
    var hashes__8576 = cljs.core.js_keys(this__8575.hashobj).sort();
    return cljs.core.mapcat.cljs$lang$arity$2(function(p1__8543_SHARP_) {
      return cljs.core.map.cljs$lang$arity$2(cljs.core.vec, cljs.core.partition.cljs$lang$arity$2(2, this__8575.hashobj[p1__8543_SHARP_]))
    }, hashes__8576)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8577 = this;
  return this__8577.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8578 = this;
  return cljs.core.equiv_map(coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8579 = this;
  return new cljs.core.HashMap(meta, this__8579.count, this__8579.hashobj, this__8579.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8580 = this;
  return this__8580.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8581 = this;
  return cljs.core.with_meta(cljs.core.HashMap.EMPTY, this__8581.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8582 = this;
  var h__8583 = cljs.core.hash.cljs$lang$arity$1(k);
  var bucket__8584 = this__8582.hashobj[h__8583];
  var i__8585 = cljs.core.truth_(bucket__8584) ? cljs.core.scan_array(2, k, bucket__8584) : null;
  if(cljs.core.not(i__8585)) {
    return coll
  }else {
    var new_hashobj__8586 = goog.object.clone(this__8582.hashobj);
    if(3 > bucket__8584.length) {
      cljs.core.js_delete(new_hashobj__8586, h__8583)
    }else {
      var new_bucket__8587 = bucket__8584.slice();
      new_bucket__8587.splice(i__8585, 2);
      new_hashobj__8586[h__8583] = new_bucket__8587
    }
    return new cljs.core.HashMap(this__8582.meta, this__8582.count - 1, new_hashobj__8586, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__8589 = ks.length;
  var i__8590 = 0;
  var out__8591 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__8590 < len__8589) {
      var G__8592 = i__8590 + 1;
      var G__8593 = cljs.core.assoc.cljs$lang$arity$3(out__8591, ks[i__8590], vs[i__8590]);
      i__8590 = G__8592;
      out__8591 = G__8593;
      continue
    }else {
      return out__8591
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__8597 = m.arr;
  var len__8598 = arr__8597.length;
  var i__8599 = 0;
  while(true) {
    if(len__8598 <= i__8599) {
      return-1
    }else {
      if(cljs.core._EQ_.cljs$lang$arity$2(arr__8597[i__8599], k)) {
        return i__8599
      }else {
        if("\ufdd0'else") {
          var G__8600 = i__8599 + 2;
          i__8599 = G__8600;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8603 = this;
  return new cljs.core.TransientArrayMap({}, this__8603.arr.length, this__8603.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8604 = this;
  var h__2192__auto____8605 = this__8604.__hash;
  if(!(h__2192__auto____8605 == null)) {
    return h__2192__auto____8605
  }else {
    var h__2192__auto____8606 = cljs.core.hash_imap(coll);
    this__8604.__hash = h__2192__auto____8606;
    return h__2192__auto____8606
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8607 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8608 = this;
  var idx__8609 = cljs.core.array_map_index_of(coll, k);
  if(idx__8609 === -1) {
    return not_found
  }else {
    return this__8608.arr[idx__8609 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8610 = this;
  var idx__8611 = cljs.core.array_map_index_of(coll, k);
  if(idx__8611 === -1) {
    if(this__8610.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__8610.meta, this__8610.cnt + 1, function() {
        var G__8612__8613 = this__8610.arr.slice();
        G__8612__8613.push(k);
        G__8612__8613.push(v);
        return G__8612__8613
      }(), null)
    }else {
      return cljs.core.persistent_BANG_(cljs.core.assoc_BANG_(cljs.core.transient$(cljs.core.into(cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__8610.arr[idx__8611 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__8610.meta, this__8610.cnt, function() {
          var G__8614__8615 = this__8610.arr.slice();
          G__8614__8615[idx__8611 + 1] = v;
          return G__8614__8615
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8616 = this;
  return!(cljs.core.array_map_index_of(coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__8648 = null;
  var G__8648__2 = function(this_sym8617, k) {
    var this__8619 = this;
    var this_sym8617__8620 = this;
    var coll__8621 = this_sym8617__8620;
    return coll__8621.cljs$core$ILookup$_lookup$arity$2(coll__8621, k)
  };
  var G__8648__3 = function(this_sym8618, k, not_found) {
    var this__8619 = this;
    var this_sym8618__8622 = this;
    var coll__8623 = this_sym8618__8622;
    return coll__8623.cljs$core$ILookup$_lookup$arity$3(coll__8623, k, not_found)
  };
  G__8648 = function(this_sym8618, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8648__2.call(this, this_sym8618, k);
      case 3:
        return G__8648__3.call(this, this_sym8618, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8648
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym8601, args8602) {
  var this__8624 = this;
  return this_sym8601.call.apply(this_sym8601, [this_sym8601].concat(args8602.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8625 = this;
  var len__8626 = this__8625.arr.length;
  var i__8627 = 0;
  var init__8628 = init;
  while(true) {
    if(i__8627 < len__8626) {
      var init__8629 = f.cljs$lang$arity$3 ? f.cljs$lang$arity$3(init__8628, this__8625.arr[i__8627], this__8625.arr[i__8627 + 1]) : f.call(null, init__8628, this__8625.arr[i__8627], this__8625.arr[i__8627 + 1]);
      if(cljs.core.reduced_QMARK_(init__8629)) {
        return cljs.core.deref(init__8629)
      }else {
        var G__8649 = i__8627 + 2;
        var G__8650 = init__8629;
        i__8627 = G__8649;
        init__8628 = G__8650;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8630 = this;
  if(cljs.core.vector_QMARK_(entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.cljs$lang$arity$2(entry, 0), cljs.core._nth.cljs$lang$arity$2(entry, 1))
  }else {
    return cljs.core.reduce.cljs$lang$arity$3(cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__8631 = this;
  var this__8632 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__8632], 0))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8633 = this;
  if(this__8633.cnt > 0) {
    var len__8634 = this__8633.arr.length;
    var array_map_seq__8635 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__8634) {
          return cljs.core.cons(cljs.core.PersistentVector.fromArray([this__8633.arr[i], this__8633.arr[i + 1]], true), array_map_seq(i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__8635.cljs$lang$arity$1 ? array_map_seq__8635.cljs$lang$arity$1(0) : array_map_seq__8635.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8636 = this;
  return this__8636.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8637 = this;
  return cljs.core.equiv_map(coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8638 = this;
  return new cljs.core.PersistentArrayMap(meta, this__8638.cnt, this__8638.arr, this__8638.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8639 = this;
  return this__8639.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8640 = this;
  return cljs.core._with_meta(cljs.core.PersistentArrayMap.EMPTY, this__8640.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8641 = this;
  var idx__8642 = cljs.core.array_map_index_of(coll, k);
  if(idx__8642 >= 0) {
    var len__8643 = this__8641.arr.length;
    var new_len__8644 = len__8643 - 2;
    if(new_len__8644 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__8645 = cljs.core.make_array.cljs$lang$arity$1(new_len__8644);
      var s__8646 = 0;
      var d__8647 = 0;
      while(true) {
        if(s__8646 >= len__8643) {
          return new cljs.core.PersistentArrayMap(this__8641.meta, this__8641.cnt - 1, new_arr__8645, null)
        }else {
          if(cljs.core._EQ_.cljs$lang$arity$2(k, this__8641.arr[s__8646])) {
            var G__8651 = s__8646 + 2;
            var G__8652 = d__8647;
            s__8646 = G__8651;
            d__8647 = G__8652;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__8645[d__8647] = this__8641.arr[s__8646];
              new_arr__8645[d__8647 + 1] = this__8641.arr[s__8646 + 1];
              var G__8653 = s__8646 + 2;
              var G__8654 = d__8647 + 2;
              s__8646 = G__8653;
              d__8647 = G__8654;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__8655 = cljs.core.count(ks);
  var i__8656 = 0;
  var out__8657 = cljs.core.transient$(cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__8656 < len__8655) {
      var G__8658 = i__8656 + 1;
      var G__8659 = cljs.core.assoc_BANG_(out__8657, ks[i__8656], vs[i__8656]);
      i__8656 = G__8658;
      out__8657 = G__8659;
      continue
    }else {
      return cljs.core.persistent_BANG_(out__8657)
    }
    break
  }
};
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__8660 = this;
  if(cljs.core.truth_(this__8660.editable_QMARK_)) {
    var idx__8661 = cljs.core.array_map_index_of(tcoll, key);
    if(idx__8661 >= 0) {
      this__8660.arr[idx__8661] = this__8660.arr[this__8660.len - 2];
      this__8660.arr[idx__8661 + 1] = this__8660.arr[this__8660.len - 1];
      var G__8662__8663 = this__8660.arr;
      G__8662__8663.pop();
      G__8662__8663.pop();
      G__8662__8663;
      this__8660.len = this__8660.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8664 = this;
  if(cljs.core.truth_(this__8664.editable_QMARK_)) {
    var idx__8665 = cljs.core.array_map_index_of(tcoll, key);
    if(idx__8665 === -1) {
      if(this__8664.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__8664.len = this__8664.len + 2;
        this__8664.arr.push(key);
        this__8664.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_(cljs.core.array__GT_transient_hash_map(this__8664.len, this__8664.arr), key, val)
      }
    }else {
      if(val === this__8664.arr[idx__8665 + 1]) {
        return tcoll
      }else {
        this__8664.arr[idx__8665 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8666 = this;
  if(cljs.core.truth_(this__8666.editable_QMARK_)) {
    if(function() {
      var G__8667__8668 = o;
      if(G__8667__8668) {
        if(function() {
          var or__3824__auto____8669 = G__8667__8668.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____8669) {
            return or__3824__auto____8669
          }else {
            return G__8667__8668.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__8667__8668.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_(cljs.core.IMapEntry, G__8667__8668)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_(cljs.core.IMapEntry, G__8667__8668)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key(o), cljs.core.val(o))
    }else {
      var es__8670 = cljs.core.seq(o);
      var tcoll__8671 = tcoll;
      while(true) {
        var temp__3971__auto____8672 = cljs.core.first(es__8670);
        if(cljs.core.truth_(temp__3971__auto____8672)) {
          var e__8673 = temp__3971__auto____8672;
          var G__8679 = cljs.core.next(es__8670);
          var G__8680 = tcoll__8671.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__8671, cljs.core.key(e__8673), cljs.core.val(e__8673));
          es__8670 = G__8679;
          tcoll__8671 = G__8680;
          continue
        }else {
          return tcoll__8671
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8674 = this;
  if(cljs.core.truth_(this__8674.editable_QMARK_)) {
    this__8674.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot(this__8674.len, 2), this__8674.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__8675 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__8676 = this;
  if(cljs.core.truth_(this__8676.editable_QMARK_)) {
    var idx__8677 = cljs.core.array_map_index_of(tcoll, k);
    if(idx__8677 === -1) {
      return not_found
    }else {
      return this__8676.arr[idx__8677 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__8678 = this;
  if(cljs.core.truth_(this__8678.editable_QMARK_)) {
    return cljs.core.quot(this__8678.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__8683 = cljs.core.transient$(cljs.core.ObjMap.EMPTY);
  var i__8684 = 0;
  while(true) {
    if(i__8684 < len) {
      var G__8685 = cljs.core.assoc_BANG_(out__8683, arr[i__8684], arr[i__8684 + 1]);
      var G__8686 = i__8684 + 2;
      out__8683 = G__8685;
      i__8684 = G__8686;
      continue
    }else {
      return out__8683
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2310__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/Box")
};
cljs.core.Box;
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.cljs$lang$arity$2(key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__8691__8692 = arr.slice();
    G__8691__8692[i] = a;
    return G__8691__8692
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__8693__8694 = arr.slice();
    G__8693__8694[i] = a;
    G__8693__8694[j] = b;
    return G__8693__8694
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__8696 = cljs.core.make_array.cljs$lang$arity$1(arr.length - 2);
  cljs.core.array_copy(arr, 0, new_arr__8696, 0, 2 * i);
  cljs.core.array_copy(arr, 2 * (i + 1), new_arr__8696, 2 * i, new_arr__8696.length - 2 * i);
  return new_arr__8696
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count(bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__8699 = inode.ensure_editable(edit);
    editable__8699.arr[i] = a;
    return editable__8699
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__8700 = inode.ensure_editable(edit);
    editable__8700.arr[i] = a;
    editable__8700.arr[j] = b;
    return editable__8700
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__8707 = arr.length;
  var i__8708 = 0;
  var init__8709 = init;
  while(true) {
    if(i__8708 < len__8707) {
      var init__8712 = function() {
        var k__8710 = arr[i__8708];
        if(!(k__8710 == null)) {
          return f.cljs$lang$arity$3 ? f.cljs$lang$arity$3(init__8709, k__8710, arr[i__8708 + 1]) : f.call(null, init__8709, k__8710, arr[i__8708 + 1])
        }else {
          var node__8711 = arr[i__8708 + 1];
          if(!(node__8711 == null)) {
            return node__8711.kv_reduce(f, init__8709)
          }else {
            return init__8709
          }
        }
      }();
      if(cljs.core.reduced_QMARK_(init__8712)) {
        return cljs.core.deref(init__8712)
      }else {
        var G__8713 = i__8708 + 2;
        var G__8714 = init__8712;
        i__8708 = G__8713;
        init__8709 = G__8714;
        continue
      }
    }else {
      return init__8709
    }
    break
  }
};
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__8715 = this;
  var inode__8716 = this;
  if(this__8715.bitmap === bit) {
    return null
  }else {
    var editable__8717 = inode__8716.ensure_editable(e);
    var earr__8718 = editable__8717.arr;
    var len__8719 = earr__8718.length;
    editable__8717.bitmap = bit ^ editable__8717.bitmap;
    cljs.core.array_copy(earr__8718, 2 * (i + 1), earr__8718, 2 * i, len__8719 - 2 * (i + 1));
    earr__8718[len__8719 - 2] = null;
    earr__8718[len__8719 - 1] = null;
    return editable__8717
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8720 = this;
  var inode__8721 = this;
  var bit__8722 = 1 << (hash >>> shift & 31);
  var idx__8723 = cljs.core.bitmap_indexed_node_index(this__8720.bitmap, bit__8722);
  if((this__8720.bitmap & bit__8722) === 0) {
    var n__8724 = cljs.core.bit_count(this__8720.bitmap);
    if(2 * n__8724 < this__8720.arr.length) {
      var editable__8725 = inode__8721.ensure_editable(edit);
      var earr__8726 = editable__8725.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward(earr__8726, 2 * idx__8723, earr__8726, 2 * (idx__8723 + 1), 2 * (n__8724 - idx__8723));
      earr__8726[2 * idx__8723] = key;
      earr__8726[2 * idx__8723 + 1] = val;
      editable__8725.bitmap = editable__8725.bitmap | bit__8722;
      return editable__8725
    }else {
      if(n__8724 >= 16) {
        var nodes__8727 = cljs.core.make_array.cljs$lang$arity$1(32);
        var jdx__8728 = hash >>> shift & 31;
        nodes__8727[jdx__8728] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__8729 = 0;
        var j__8730 = 0;
        while(true) {
          if(i__8729 < 32) {
            if((this__8720.bitmap >>> i__8729 & 1) === 0) {
              var G__8783 = i__8729 + 1;
              var G__8784 = j__8730;
              i__8729 = G__8783;
              j__8730 = G__8784;
              continue
            }else {
              nodes__8727[i__8729] = !(this__8720.arr[j__8730] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.cljs$lang$arity$1(this__8720.arr[j__8730]), this__8720.arr[j__8730], this__8720.arr[j__8730 + 1], added_leaf_QMARK_) : this__8720.arr[j__8730 + 1];
              var G__8785 = i__8729 + 1;
              var G__8786 = j__8730 + 2;
              i__8729 = G__8785;
              j__8730 = G__8786;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__8724 + 1, nodes__8727)
      }else {
        if("\ufdd0'else") {
          var new_arr__8731 = cljs.core.make_array.cljs$lang$arity$1(2 * (n__8724 + 4));
          cljs.core.array_copy(this__8720.arr, 0, new_arr__8731, 0, 2 * idx__8723);
          new_arr__8731[2 * idx__8723] = key;
          new_arr__8731[2 * idx__8723 + 1] = val;
          cljs.core.array_copy(this__8720.arr, 2 * idx__8723, new_arr__8731, 2 * (idx__8723 + 1), 2 * (n__8724 - idx__8723));
          added_leaf_QMARK_.val = true;
          var editable__8732 = inode__8721.ensure_editable(edit);
          editable__8732.arr = new_arr__8731;
          editable__8732.bitmap = editable__8732.bitmap | bit__8722;
          return editable__8732
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__8733 = this__8720.arr[2 * idx__8723];
    var val_or_node__8734 = this__8720.arr[2 * idx__8723 + 1];
    if(key_or_nil__8733 == null) {
      var n__8735 = val_or_node__8734.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8735 === val_or_node__8734) {
        return inode__8721
      }else {
        return cljs.core.edit_and_set.cljs$lang$arity$4(inode__8721, edit, 2 * idx__8723 + 1, n__8735)
      }
    }else {
      if(cljs.core.key_test(key, key_or_nil__8733)) {
        if(val === val_or_node__8734) {
          return inode__8721
        }else {
          return cljs.core.edit_and_set.cljs$lang$arity$4(inode__8721, edit, 2 * idx__8723 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.cljs$lang$arity$6(inode__8721, edit, 2 * idx__8723, null, 2 * idx__8723 + 1, cljs.core.create_node.cljs$lang$arity$7(edit, shift + 5, key_or_nil__8733, val_or_node__8734, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__8736 = this;
  var inode__8737 = this;
  return cljs.core.create_inode_seq.cljs$lang$arity$1(this__8736.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8738 = this;
  var inode__8739 = this;
  var bit__8740 = 1 << (hash >>> shift & 31);
  if((this__8738.bitmap & bit__8740) === 0) {
    return inode__8739
  }else {
    var idx__8741 = cljs.core.bitmap_indexed_node_index(this__8738.bitmap, bit__8740);
    var key_or_nil__8742 = this__8738.arr[2 * idx__8741];
    var val_or_node__8743 = this__8738.arr[2 * idx__8741 + 1];
    if(key_or_nil__8742 == null) {
      var n__8744 = val_or_node__8743.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__8744 === val_or_node__8743) {
        return inode__8739
      }else {
        if(!(n__8744 == null)) {
          return cljs.core.edit_and_set.cljs$lang$arity$4(inode__8739, edit, 2 * idx__8741 + 1, n__8744)
        }else {
          if(this__8738.bitmap === bit__8740) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__8739.edit_and_remove_pair(edit, bit__8740, idx__8741)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test(key, key_or_nil__8742)) {
        removed_leaf_QMARK_[0] = true;
        return inode__8739.edit_and_remove_pair(edit, bit__8740, idx__8741)
      }else {
        if("\ufdd0'else") {
          return inode__8739
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__8745 = this;
  var inode__8746 = this;
  if(e === this__8745.edit) {
    return inode__8746
  }else {
    var n__8747 = cljs.core.bit_count(this__8745.bitmap);
    var new_arr__8748 = cljs.core.make_array.cljs$lang$arity$1(n__8747 < 0 ? 4 : 2 * (n__8747 + 1));
    cljs.core.array_copy(this__8745.arr, 0, new_arr__8748, 0, 2 * n__8747);
    return new cljs.core.BitmapIndexedNode(e, this__8745.bitmap, new_arr__8748)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__8749 = this;
  var inode__8750 = this;
  return cljs.core.inode_kv_reduce(this__8749.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8751 = this;
  var inode__8752 = this;
  var bit__8753 = 1 << (hash >>> shift & 31);
  if((this__8751.bitmap & bit__8753) === 0) {
    return not_found
  }else {
    var idx__8754 = cljs.core.bitmap_indexed_node_index(this__8751.bitmap, bit__8753);
    var key_or_nil__8755 = this__8751.arr[2 * idx__8754];
    var val_or_node__8756 = this__8751.arr[2 * idx__8754 + 1];
    if(key_or_nil__8755 == null) {
      return val_or_node__8756.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test(key, key_or_nil__8755)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__8755, val_or_node__8756], true)
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__8757 = this;
  var inode__8758 = this;
  var bit__8759 = 1 << (hash >>> shift & 31);
  if((this__8757.bitmap & bit__8759) === 0) {
    return inode__8758
  }else {
    var idx__8760 = cljs.core.bitmap_indexed_node_index(this__8757.bitmap, bit__8759);
    var key_or_nil__8761 = this__8757.arr[2 * idx__8760];
    var val_or_node__8762 = this__8757.arr[2 * idx__8760 + 1];
    if(key_or_nil__8761 == null) {
      var n__8763 = val_or_node__8762.inode_without(shift + 5, hash, key);
      if(n__8763 === val_or_node__8762) {
        return inode__8758
      }else {
        if(!(n__8763 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__8757.bitmap, cljs.core.clone_and_set.cljs$lang$arity$3(this__8757.arr, 2 * idx__8760 + 1, n__8763))
        }else {
          if(this__8757.bitmap === bit__8759) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__8757.bitmap ^ bit__8759, cljs.core.remove_pair(this__8757.arr, idx__8760))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test(key, key_or_nil__8761)) {
        return new cljs.core.BitmapIndexedNode(null, this__8757.bitmap ^ bit__8759, cljs.core.remove_pair(this__8757.arr, idx__8760))
      }else {
        if("\ufdd0'else") {
          return inode__8758
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8764 = this;
  var inode__8765 = this;
  var bit__8766 = 1 << (hash >>> shift & 31);
  var idx__8767 = cljs.core.bitmap_indexed_node_index(this__8764.bitmap, bit__8766);
  if((this__8764.bitmap & bit__8766) === 0) {
    var n__8768 = cljs.core.bit_count(this__8764.bitmap);
    if(n__8768 >= 16) {
      var nodes__8769 = cljs.core.make_array.cljs$lang$arity$1(32);
      var jdx__8770 = hash >>> shift & 31;
      nodes__8769[jdx__8770] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__8771 = 0;
      var j__8772 = 0;
      while(true) {
        if(i__8771 < 32) {
          if((this__8764.bitmap >>> i__8771 & 1) === 0) {
            var G__8787 = i__8771 + 1;
            var G__8788 = j__8772;
            i__8771 = G__8787;
            j__8772 = G__8788;
            continue
          }else {
            nodes__8769[i__8771] = !(this__8764.arr[j__8772] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.cljs$lang$arity$1(this__8764.arr[j__8772]), this__8764.arr[j__8772], this__8764.arr[j__8772 + 1], added_leaf_QMARK_) : this__8764.arr[j__8772 + 1];
            var G__8789 = i__8771 + 1;
            var G__8790 = j__8772 + 2;
            i__8771 = G__8789;
            j__8772 = G__8790;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__8768 + 1, nodes__8769)
    }else {
      var new_arr__8773 = cljs.core.make_array.cljs$lang$arity$1(2 * (n__8768 + 1));
      cljs.core.array_copy(this__8764.arr, 0, new_arr__8773, 0, 2 * idx__8767);
      new_arr__8773[2 * idx__8767] = key;
      new_arr__8773[2 * idx__8767 + 1] = val;
      cljs.core.array_copy(this__8764.arr, 2 * idx__8767, new_arr__8773, 2 * (idx__8767 + 1), 2 * (n__8768 - idx__8767));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__8764.bitmap | bit__8766, new_arr__8773)
    }
  }else {
    var key_or_nil__8774 = this__8764.arr[2 * idx__8767];
    var val_or_node__8775 = this__8764.arr[2 * idx__8767 + 1];
    if(key_or_nil__8774 == null) {
      var n__8776 = val_or_node__8775.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8776 === val_or_node__8775) {
        return inode__8765
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__8764.bitmap, cljs.core.clone_and_set.cljs$lang$arity$3(this__8764.arr, 2 * idx__8767 + 1, n__8776))
      }
    }else {
      if(cljs.core.key_test(key, key_or_nil__8774)) {
        if(val === val_or_node__8775) {
          return inode__8765
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__8764.bitmap, cljs.core.clone_and_set.cljs$lang$arity$3(this__8764.arr, 2 * idx__8767 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__8764.bitmap, cljs.core.clone_and_set.cljs$lang$arity$5(this__8764.arr, 2 * idx__8767, null, 2 * idx__8767 + 1, cljs.core.create_node.cljs$lang$arity$6(shift + 5, key_or_nil__8774, val_or_node__8775, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8777 = this;
  var inode__8778 = this;
  var bit__8779 = 1 << (hash >>> shift & 31);
  if((this__8777.bitmap & bit__8779) === 0) {
    return not_found
  }else {
    var idx__8780 = cljs.core.bitmap_indexed_node_index(this__8777.bitmap, bit__8779);
    var key_or_nil__8781 = this__8777.arr[2 * idx__8780];
    var val_or_node__8782 = this__8777.arr[2 * idx__8780 + 1];
    if(key_or_nil__8781 == null) {
      return val_or_node__8782.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test(key, key_or_nil__8781)) {
        return val_or_node__8782
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.cljs$lang$arity$1(0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__8798 = array_node.arr;
  var len__8799 = 2 * (array_node.cnt - 1);
  var new_arr__8800 = cljs.core.make_array.cljs$lang$arity$1(len__8799);
  var i__8801 = 0;
  var j__8802 = 1;
  var bitmap__8803 = 0;
  while(true) {
    if(i__8801 < len__8799) {
      if(function() {
        var and__3822__auto____8804 = !(i__8801 === idx);
        if(and__3822__auto____8804) {
          return!(arr__8798[i__8801] == null)
        }else {
          return and__3822__auto____8804
        }
      }()) {
        new_arr__8800[j__8802] = arr__8798[i__8801];
        var G__8805 = i__8801 + 1;
        var G__8806 = j__8802 + 2;
        var G__8807 = bitmap__8803 | 1 << i__8801;
        i__8801 = G__8805;
        j__8802 = G__8806;
        bitmap__8803 = G__8807;
        continue
      }else {
        var G__8808 = i__8801 + 1;
        var G__8809 = j__8802;
        var G__8810 = bitmap__8803;
        i__8801 = G__8808;
        j__8802 = G__8809;
        bitmap__8803 = G__8810;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__8803, new_arr__8800)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8811 = this;
  var inode__8812 = this;
  var idx__8813 = hash >>> shift & 31;
  var node__8814 = this__8811.arr[idx__8813];
  if(node__8814 == null) {
    var editable__8815 = cljs.core.edit_and_set.cljs$lang$arity$4(inode__8812, edit, idx__8813, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__8815.cnt = editable__8815.cnt + 1;
    return editable__8815
  }else {
    var n__8816 = node__8814.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8816 === node__8814) {
      return inode__8812
    }else {
      return cljs.core.edit_and_set.cljs$lang$arity$4(inode__8812, edit, idx__8813, n__8816)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__8817 = this;
  var inode__8818 = this;
  return cljs.core.create_array_node_seq.cljs$lang$arity$1(this__8817.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8819 = this;
  var inode__8820 = this;
  var idx__8821 = hash >>> shift & 31;
  var node__8822 = this__8819.arr[idx__8821];
  if(node__8822 == null) {
    return inode__8820
  }else {
    var n__8823 = node__8822.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__8823 === node__8822) {
      return inode__8820
    }else {
      if(n__8823 == null) {
        if(this__8819.cnt <= 8) {
          return cljs.core.pack_array_node(inode__8820, edit, idx__8821)
        }else {
          var editable__8824 = cljs.core.edit_and_set.cljs$lang$arity$4(inode__8820, edit, idx__8821, n__8823);
          editable__8824.cnt = editable__8824.cnt - 1;
          return editable__8824
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.cljs$lang$arity$4(inode__8820, edit, idx__8821, n__8823)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__8825 = this;
  var inode__8826 = this;
  if(e === this__8825.edit) {
    return inode__8826
  }else {
    return new cljs.core.ArrayNode(e, this__8825.cnt, this__8825.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__8827 = this;
  var inode__8828 = this;
  var len__8829 = this__8827.arr.length;
  var i__8830 = 0;
  var init__8831 = init;
  while(true) {
    if(i__8830 < len__8829) {
      var node__8832 = this__8827.arr[i__8830];
      if(!(node__8832 == null)) {
        var init__8833 = node__8832.kv_reduce(f, init__8831);
        if(cljs.core.reduced_QMARK_(init__8833)) {
          return cljs.core.deref(init__8833)
        }else {
          var G__8852 = i__8830 + 1;
          var G__8853 = init__8833;
          i__8830 = G__8852;
          init__8831 = G__8853;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__8831
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8834 = this;
  var inode__8835 = this;
  var idx__8836 = hash >>> shift & 31;
  var node__8837 = this__8834.arr[idx__8836];
  if(!(node__8837 == null)) {
    return node__8837.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__8838 = this;
  var inode__8839 = this;
  var idx__8840 = hash >>> shift & 31;
  var node__8841 = this__8838.arr[idx__8840];
  if(!(node__8841 == null)) {
    var n__8842 = node__8841.inode_without(shift + 5, hash, key);
    if(n__8842 === node__8841) {
      return inode__8839
    }else {
      if(n__8842 == null) {
        if(this__8838.cnt <= 8) {
          return cljs.core.pack_array_node(inode__8839, null, idx__8840)
        }else {
          return new cljs.core.ArrayNode(null, this__8838.cnt - 1, cljs.core.clone_and_set.cljs$lang$arity$3(this__8838.arr, idx__8840, n__8842))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__8838.cnt, cljs.core.clone_and_set.cljs$lang$arity$3(this__8838.arr, idx__8840, n__8842))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__8839
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8843 = this;
  var inode__8844 = this;
  var idx__8845 = hash >>> shift & 31;
  var node__8846 = this__8843.arr[idx__8845];
  if(node__8846 == null) {
    return new cljs.core.ArrayNode(null, this__8843.cnt + 1, cljs.core.clone_and_set.cljs$lang$arity$3(this__8843.arr, idx__8845, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__8847 = node__8846.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8847 === node__8846) {
      return inode__8844
    }else {
      return new cljs.core.ArrayNode(null, this__8843.cnt, cljs.core.clone_and_set.cljs$lang$arity$3(this__8843.arr, idx__8845, n__8847))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8848 = this;
  var inode__8849 = this;
  var idx__8850 = hash >>> shift & 31;
  var node__8851 = this__8848.arr[idx__8850];
  if(!(node__8851 == null)) {
    return node__8851.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__8856 = 2 * cnt;
  var i__8857 = 0;
  while(true) {
    if(i__8857 < lim__8856) {
      if(cljs.core.key_test(key, arr[i__8857])) {
        return i__8857
      }else {
        var G__8858 = i__8857 + 2;
        i__8857 = G__8858;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8859 = this;
  var inode__8860 = this;
  if(hash === this__8859.collision_hash) {
    var idx__8861 = cljs.core.hash_collision_node_find_index(this__8859.arr, this__8859.cnt, key);
    if(idx__8861 === -1) {
      if(this__8859.arr.length > 2 * this__8859.cnt) {
        var editable__8862 = cljs.core.edit_and_set.cljs$lang$arity$6(inode__8860, edit, 2 * this__8859.cnt, key, 2 * this__8859.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__8862.cnt = editable__8862.cnt + 1;
        return editable__8862
      }else {
        var len__8863 = this__8859.arr.length;
        var new_arr__8864 = cljs.core.make_array.cljs$lang$arity$1(len__8863 + 2);
        cljs.core.array_copy(this__8859.arr, 0, new_arr__8864, 0, len__8863);
        new_arr__8864[len__8863] = key;
        new_arr__8864[len__8863 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__8860.ensure_editable_array(edit, this__8859.cnt + 1, new_arr__8864)
      }
    }else {
      if(this__8859.arr[idx__8861 + 1] === val) {
        return inode__8860
      }else {
        return cljs.core.edit_and_set.cljs$lang$arity$4(inode__8860, edit, idx__8861 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__8859.collision_hash >>> shift & 31), [null, inode__8860, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__8865 = this;
  var inode__8866 = this;
  return cljs.core.create_inode_seq.cljs$lang$arity$1(this__8865.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8867 = this;
  var inode__8868 = this;
  var idx__8869 = cljs.core.hash_collision_node_find_index(this__8867.arr, this__8867.cnt, key);
  if(idx__8869 === -1) {
    return inode__8868
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__8867.cnt === 1) {
      return null
    }else {
      var editable__8870 = inode__8868.ensure_editable(edit);
      var earr__8871 = editable__8870.arr;
      earr__8871[idx__8869] = earr__8871[2 * this__8867.cnt - 2];
      earr__8871[idx__8869 + 1] = earr__8871[2 * this__8867.cnt - 1];
      earr__8871[2 * this__8867.cnt - 1] = null;
      earr__8871[2 * this__8867.cnt - 2] = null;
      editable__8870.cnt = editable__8870.cnt - 1;
      return editable__8870
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__8872 = this;
  var inode__8873 = this;
  if(e === this__8872.edit) {
    return inode__8873
  }else {
    var new_arr__8874 = cljs.core.make_array.cljs$lang$arity$1(2 * (this__8872.cnt + 1));
    cljs.core.array_copy(this__8872.arr, 0, new_arr__8874, 0, 2 * this__8872.cnt);
    return new cljs.core.HashCollisionNode(e, this__8872.collision_hash, this__8872.cnt, new_arr__8874)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__8875 = this;
  var inode__8876 = this;
  return cljs.core.inode_kv_reduce(this__8875.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8877 = this;
  var inode__8878 = this;
  var idx__8879 = cljs.core.hash_collision_node_find_index(this__8877.arr, this__8877.cnt, key);
  if(idx__8879 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test(key, this__8877.arr[idx__8879])) {
      return cljs.core.PersistentVector.fromArray([this__8877.arr[idx__8879], this__8877.arr[idx__8879 + 1]], true)
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__8880 = this;
  var inode__8881 = this;
  var idx__8882 = cljs.core.hash_collision_node_find_index(this__8880.arr, this__8880.cnt, key);
  if(idx__8882 === -1) {
    return inode__8881
  }else {
    if(this__8880.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__8880.collision_hash, this__8880.cnt - 1, cljs.core.remove_pair(this__8880.arr, cljs.core.quot(idx__8882, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8883 = this;
  var inode__8884 = this;
  if(hash === this__8883.collision_hash) {
    var idx__8885 = cljs.core.hash_collision_node_find_index(this__8883.arr, this__8883.cnt, key);
    if(idx__8885 === -1) {
      var len__8886 = this__8883.arr.length;
      var new_arr__8887 = cljs.core.make_array.cljs$lang$arity$1(len__8886 + 2);
      cljs.core.array_copy(this__8883.arr, 0, new_arr__8887, 0, len__8886);
      new_arr__8887[len__8886] = key;
      new_arr__8887[len__8886 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__8883.collision_hash, this__8883.cnt + 1, new_arr__8887)
    }else {
      if(cljs.core._EQ_.cljs$lang$arity$2(this__8883.arr[idx__8885], val)) {
        return inode__8884
      }else {
        return new cljs.core.HashCollisionNode(null, this__8883.collision_hash, this__8883.cnt, cljs.core.clone_and_set.cljs$lang$arity$3(this__8883.arr, idx__8885 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__8883.collision_hash >>> shift & 31), [null, inode__8884])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8888 = this;
  var inode__8889 = this;
  var idx__8890 = cljs.core.hash_collision_node_find_index(this__8888.arr, this__8888.cnt, key);
  if(idx__8890 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test(key, this__8888.arr[idx__8890])) {
      return this__8888.arr[idx__8890 + 1]
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var this__8891 = this;
  var inode__8892 = this;
  if(e === this__8891.edit) {
    this__8891.arr = array;
    this__8891.cnt = count;
    return inode__8892
  }else {
    return new cljs.core.HashCollisionNode(this__8891.edit, this__8891.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8897 = cljs.core.hash.cljs$lang$arity$1(key1);
    if(key1hash__8897 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8897, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8898 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__8897, key1, val1, added_leaf_QMARK___8898).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___8898)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8899 = cljs.core.hash.cljs$lang$arity$1(key1);
    if(key1hash__8899 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8899, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8900 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__8899, key1, val1, added_leaf_QMARK___8900).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___8900)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8901 = this;
  var h__2192__auto____8902 = this__8901.__hash;
  if(!(h__2192__auto____8902 == null)) {
    return h__2192__auto____8902
  }else {
    var h__2192__auto____8903 = cljs.core.hash_coll(coll);
    this__8901.__hash = h__2192__auto____8903;
    return h__2192__auto____8903
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8904 = this;
  return cljs.core.cons(o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__8905 = this;
  var this__8906 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__8906], 0))
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8907 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8908 = this;
  if(this__8908.s == null) {
    return cljs.core.PersistentVector.fromArray([this__8908.nodes[this__8908.i], this__8908.nodes[this__8908.i + 1]], true)
  }else {
    return cljs.core.first(this__8908.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8909 = this;
  if(this__8909.s == null) {
    return cljs.core.create_inode_seq.cljs$lang$arity$3(this__8909.nodes, this__8909.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.cljs$lang$arity$3(this__8909.nodes, this__8909.i, cljs.core.next(this__8909.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8910 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8911 = this;
  return new cljs.core.NodeSeq(meta, this__8911.nodes, this__8911.i, this__8911.s, this__8911.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8912 = this;
  return this__8912.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8913 = this;
  return cljs.core.with_meta(cljs.core.List.EMPTY, this__8913.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.cljs$lang$arity$3(nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__8920 = nodes.length;
      var j__8921 = i;
      while(true) {
        if(j__8921 < len__8920) {
          if(!(nodes[j__8921] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__8921, null, null)
          }else {
            var temp__3971__auto____8922 = nodes[j__8921 + 1];
            if(cljs.core.truth_(temp__3971__auto____8922)) {
              var node__8923 = temp__3971__auto____8922;
              var temp__3971__auto____8924 = node__8923.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____8924)) {
                var node_seq__8925 = temp__3971__auto____8924;
                return new cljs.core.NodeSeq(null, nodes, j__8921 + 2, node_seq__8925, null)
              }else {
                var G__8926 = j__8921 + 2;
                j__8921 = G__8926;
                continue
              }
            }else {
              var G__8927 = j__8921 + 2;
              j__8921 = G__8927;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8928 = this;
  var h__2192__auto____8929 = this__8928.__hash;
  if(!(h__2192__auto____8929 == null)) {
    return h__2192__auto____8929
  }else {
    var h__2192__auto____8930 = cljs.core.hash_coll(coll);
    this__8928.__hash = h__2192__auto____8930;
    return h__2192__auto____8930
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8931 = this;
  return cljs.core.cons(o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__8932 = this;
  var this__8933 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__8933], 0))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8934 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8935 = this;
  return cljs.core.first(this__8935.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8936 = this;
  return cljs.core.create_array_node_seq.cljs$lang$arity$4(null, this__8936.nodes, this__8936.i, cljs.core.next(this__8936.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8937 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8938 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__8938.nodes, this__8938.i, this__8938.s, this__8938.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8939 = this;
  return this__8939.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8940 = this;
  return cljs.core.with_meta(cljs.core.List.EMPTY, this__8940.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.cljs$lang$arity$4(null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__8947 = nodes.length;
      var j__8948 = i;
      while(true) {
        if(j__8948 < len__8947) {
          var temp__3971__auto____8949 = nodes[j__8948];
          if(cljs.core.truth_(temp__3971__auto____8949)) {
            var nj__8950 = temp__3971__auto____8949;
            var temp__3971__auto____8951 = nj__8950.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____8951)) {
              var ns__8952 = temp__3971__auto____8951;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__8948 + 1, ns__8952, null)
            }else {
              var G__8953 = j__8948 + 1;
              j__8948 = G__8953;
              continue
            }
          }else {
            var G__8954 = j__8948 + 1;
            j__8948 = G__8954;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8957 = this;
  return new cljs.core.TransientHashMap({}, this__8957.root, this__8957.cnt, this__8957.has_nil_QMARK_, this__8957.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8958 = this;
  var h__2192__auto____8959 = this__8958.__hash;
  if(!(h__2192__auto____8959 == null)) {
    return h__2192__auto____8959
  }else {
    var h__2192__auto____8960 = cljs.core.hash_imap(coll);
    this__8958.__hash = h__2192__auto____8960;
    return h__2192__auto____8960
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8961 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8962 = this;
  if(k == null) {
    if(this__8962.has_nil_QMARK_) {
      return this__8962.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__8962.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__8962.root.inode_lookup(0, cljs.core.hash.cljs$lang$arity$1(k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8963 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____8964 = this__8963.has_nil_QMARK_;
      if(and__3822__auto____8964) {
        return v === this__8963.nil_val
      }else {
        return and__3822__auto____8964
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__8963.meta, this__8963.has_nil_QMARK_ ? this__8963.cnt : this__8963.cnt + 1, this__8963.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___8965 = new cljs.core.Box(false);
    var new_root__8966 = (this__8963.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__8963.root).inode_assoc(0, cljs.core.hash.cljs$lang$arity$1(k), k, v, added_leaf_QMARK___8965);
    if(new_root__8966 === this__8963.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__8963.meta, added_leaf_QMARK___8965.val ? this__8963.cnt + 1 : this__8963.cnt, new_root__8966, this__8963.has_nil_QMARK_, this__8963.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8967 = this;
  if(k == null) {
    return this__8967.has_nil_QMARK_
  }else {
    if(this__8967.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__8967.root.inode_lookup(0, cljs.core.hash.cljs$lang$arity$1(k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__8990 = null;
  var G__8990__2 = function(this_sym8968, k) {
    var this__8970 = this;
    var this_sym8968__8971 = this;
    var coll__8972 = this_sym8968__8971;
    return coll__8972.cljs$core$ILookup$_lookup$arity$2(coll__8972, k)
  };
  var G__8990__3 = function(this_sym8969, k, not_found) {
    var this__8970 = this;
    var this_sym8969__8973 = this;
    var coll__8974 = this_sym8969__8973;
    return coll__8974.cljs$core$ILookup$_lookup$arity$3(coll__8974, k, not_found)
  };
  G__8990 = function(this_sym8969, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8990__2.call(this, this_sym8969, k);
      case 3:
        return G__8990__3.call(this, this_sym8969, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8990
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym8955, args8956) {
  var this__8975 = this;
  return this_sym8955.call.apply(this_sym8955, [this_sym8955].concat(args8956.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8976 = this;
  var init__8977 = this__8976.has_nil_QMARK_ ? f.cljs$lang$arity$3 ? f.cljs$lang$arity$3(init, null, this__8976.nil_val) : f.call(null, init, null, this__8976.nil_val) : init;
  if(cljs.core.reduced_QMARK_(init__8977)) {
    return cljs.core.deref(init__8977)
  }else {
    if(!(this__8976.root == null)) {
      return this__8976.root.kv_reduce(f, init__8977)
    }else {
      if("\ufdd0'else") {
        return init__8977
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8978 = this;
  if(cljs.core.vector_QMARK_(entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.cljs$lang$arity$2(entry, 0), cljs.core._nth.cljs$lang$arity$2(entry, 1))
  }else {
    return cljs.core.reduce.cljs$lang$arity$3(cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__8979 = this;
  var this__8980 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__8980], 0))
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8981 = this;
  if(this__8981.cnt > 0) {
    var s__8982 = !(this__8981.root == null) ? this__8981.root.inode_seq() : null;
    if(this__8981.has_nil_QMARK_) {
      return cljs.core.cons(cljs.core.PersistentVector.fromArray([null, this__8981.nil_val], true), s__8982)
    }else {
      return s__8982
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8983 = this;
  return this__8983.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8984 = this;
  return cljs.core.equiv_map(coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8985 = this;
  return new cljs.core.PersistentHashMap(meta, this__8985.cnt, this__8985.root, this__8985.has_nil_QMARK_, this__8985.nil_val, this__8985.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8986 = this;
  return this__8986.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8987 = this;
  return cljs.core._with_meta(cljs.core.PersistentHashMap.EMPTY, this__8987.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8988 = this;
  if(k == null) {
    if(this__8988.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__8988.meta, this__8988.cnt - 1, this__8988.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__8988.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__8989 = this__8988.root.inode_without(0, cljs.core.hash.cljs$lang$arity$1(k), k);
        if(new_root__8989 === this__8988.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__8988.meta, this__8988.cnt - 1, new_root__8989, this__8988.has_nil_QMARK_, this__8988.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__8991 = ks.length;
  var i__8992 = 0;
  var out__8993 = cljs.core.transient$(cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__8992 < len__8991) {
      var G__8994 = i__8992 + 1;
      var G__8995 = cljs.core.assoc_BANG_(out__8993, ks[i__8992], vs[i__8992]);
      i__8992 = G__8994;
      out__8993 = G__8995;
      continue
    }else {
      return cljs.core.persistent_BANG_(out__8993)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__8996 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8997 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__8998 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8999 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9000 = this;
  if(k == null) {
    if(this__9000.has_nil_QMARK_) {
      return this__9000.nil_val
    }else {
      return null
    }
  }else {
    if(this__9000.root == null) {
      return null
    }else {
      return this__9000.root.inode_lookup(0, cljs.core.hash.cljs$lang$arity$1(k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9001 = this;
  if(k == null) {
    if(this__9001.has_nil_QMARK_) {
      return this__9001.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9001.root == null) {
      return not_found
    }else {
      return this__9001.root.inode_lookup(0, cljs.core.hash.cljs$lang$arity$1(k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9002 = this;
  if(this__9002.edit) {
    return this__9002.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__9003 = this;
  var tcoll__9004 = this;
  if(this__9003.edit) {
    if(function() {
      var G__9005__9006 = o;
      if(G__9005__9006) {
        if(function() {
          var or__3824__auto____9007 = G__9005__9006.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____9007) {
            return or__3824__auto____9007
          }else {
            return G__9005__9006.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9005__9006.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_(cljs.core.IMapEntry, G__9005__9006)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_(cljs.core.IMapEntry, G__9005__9006)
      }
    }()) {
      return tcoll__9004.assoc_BANG_(cljs.core.key(o), cljs.core.val(o))
    }else {
      var es__9008 = cljs.core.seq(o);
      var tcoll__9009 = tcoll__9004;
      while(true) {
        var temp__3971__auto____9010 = cljs.core.first(es__9008);
        if(cljs.core.truth_(temp__3971__auto____9010)) {
          var e__9011 = temp__3971__auto____9010;
          var G__9022 = cljs.core.next(es__9008);
          var G__9023 = tcoll__9009.assoc_BANG_(cljs.core.key(e__9011), cljs.core.val(e__9011));
          es__9008 = G__9022;
          tcoll__9009 = G__9023;
          continue
        }else {
          return tcoll__9009
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__9012 = this;
  var tcoll__9013 = this;
  if(this__9012.edit) {
    if(k == null) {
      if(this__9012.nil_val === v) {
      }else {
        this__9012.nil_val = v
      }
      if(this__9012.has_nil_QMARK_) {
      }else {
        this__9012.count = this__9012.count + 1;
        this__9012.has_nil_QMARK_ = true
      }
      return tcoll__9013
    }else {
      var added_leaf_QMARK___9014 = new cljs.core.Box(false);
      var node__9015 = (this__9012.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9012.root).inode_assoc_BANG_(this__9012.edit, 0, cljs.core.hash.cljs$lang$arity$1(k), k, v, added_leaf_QMARK___9014);
      if(node__9015 === this__9012.root) {
      }else {
        this__9012.root = node__9015
      }
      if(added_leaf_QMARK___9014.val) {
        this__9012.count = this__9012.count + 1
      }else {
      }
      return tcoll__9013
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__9016 = this;
  var tcoll__9017 = this;
  if(this__9016.edit) {
    if(k == null) {
      if(this__9016.has_nil_QMARK_) {
        this__9016.has_nil_QMARK_ = false;
        this__9016.nil_val = null;
        this__9016.count = this__9016.count - 1;
        return tcoll__9017
      }else {
        return tcoll__9017
      }
    }else {
      if(this__9016.root == null) {
        return tcoll__9017
      }else {
        var removed_leaf_QMARK___9018 = new cljs.core.Box(false);
        var node__9019 = this__9016.root.inode_without_BANG_(this__9016.edit, 0, cljs.core.hash.cljs$lang$arity$1(k), k, removed_leaf_QMARK___9018);
        if(node__9019 === this__9016.root) {
        }else {
          this__9016.root = node__9019
        }
        if(cljs.core.truth_(removed_leaf_QMARK___9018[0])) {
          this__9016.count = this__9016.count - 1
        }else {
        }
        return tcoll__9017
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__9020 = this;
  var tcoll__9021 = this;
  if(this__9020.edit) {
    this__9020.edit = null;
    return new cljs.core.PersistentHashMap(null, this__9020.count, this__9020.root, this__9020.has_nil_QMARK_, this__9020.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__9026 = node;
  var stack__9027 = stack;
  while(true) {
    if(!(t__9026 == null)) {
      var G__9028 = ascending_QMARK_ ? t__9026.left : t__9026.right;
      var G__9029 = cljs.core.conj.cljs$lang$arity$2(stack__9027, t__9026);
      t__9026 = G__9028;
      stack__9027 = G__9029;
      continue
    }else {
      return stack__9027
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9030 = this;
  var h__2192__auto____9031 = this__9030.__hash;
  if(!(h__2192__auto____9031 == null)) {
    return h__2192__auto____9031
  }else {
    var h__2192__auto____9032 = cljs.core.hash_coll(coll);
    this__9030.__hash = h__2192__auto____9032;
    return h__2192__auto____9032
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9033 = this;
  return cljs.core.cons(o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__9034 = this;
  var this__9035 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__9035], 0))
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9036 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9037 = this;
  if(this__9037.cnt < 0) {
    return cljs.core.count(cljs.core.next(coll)) + 1
  }else {
    return this__9037.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__9038 = this;
  return cljs.core.peek(this__9038.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__9039 = this;
  var t__9040 = cljs.core.first(this__9039.stack);
  var next_stack__9041 = cljs.core.tree_map_seq_push(this__9039.ascending_QMARK_ ? t__9040.right : t__9040.left, cljs.core.next(this__9039.stack), this__9039.ascending_QMARK_);
  if(!(next_stack__9041 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__9041, this__9039.ascending_QMARK_, this__9039.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9042 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9043 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__9043.stack, this__9043.ascending_QMARK_, this__9043.cnt, this__9043.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9044 = this;
  return this__9044.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push(tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_(cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_(cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_(cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_(cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_(cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_(cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_(cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_(cljs.core.BlackNode, right)) {
      return cljs.core.balance_right(key, val, del, right.redden())
    }else {
      if(function() {
        var and__3822__auto____9046 = cljs.core.instance_QMARK_(cljs.core.RedNode, right);
        if(and__3822__auto____9046) {
          return cljs.core.instance_QMARK_(cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____9046
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right(right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_(cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_(cljs.core.BlackNode, left)) {
      return cljs.core.balance_left(key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3822__auto____9048 = cljs.core.instance_QMARK_(cljs.core.RedNode, left);
        if(and__3822__auto____9048) {
          return cljs.core.instance_QMARK_(cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____9048
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left(left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__9052 = f.cljs$lang$arity$3 ? f.cljs$lang$arity$3(init, node.key, node.val) : f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_(init__9052)) {
    return cljs.core.deref(init__9052)
  }else {
    var init__9053 = !(node.left == null) ? tree_map_kv_reduce(node.left, f, init__9052) : init__9052;
    if(cljs.core.reduced_QMARK_(init__9053)) {
      return cljs.core.deref(init__9053)
    }else {
      var init__9054 = !(node.right == null) ? tree_map_kv_reduce(node.right, f, init__9053) : init__9053;
      if(cljs.core.reduced_QMARK_(init__9054)) {
        return cljs.core.deref(init__9054)
      }else {
        return init__9054
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9057 = this;
  var h__2192__auto____9058 = this__9057.__hash;
  if(!(h__2192__auto____9058 == null)) {
    return h__2192__auto____9058
  }else {
    var h__2192__auto____9059 = cljs.core.hash_coll(coll);
    this__9057.__hash = h__2192__auto____9059;
    return h__2192__auto____9059
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9060 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9061 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9062 = this;
  return cljs.core.assoc.cljs$lang$arity$3(cljs.core.PersistentVector.fromArray([this__9062.key, this__9062.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__9110 = null;
  var G__9110__2 = function(this_sym9063, k) {
    var this__9065 = this;
    var this_sym9063__9066 = this;
    var node__9067 = this_sym9063__9066;
    return node__9067.cljs$core$ILookup$_lookup$arity$2(node__9067, k)
  };
  var G__9110__3 = function(this_sym9064, k, not_found) {
    var this__9065 = this;
    var this_sym9064__9068 = this;
    var node__9069 = this_sym9064__9068;
    return node__9069.cljs$core$ILookup$_lookup$arity$3(node__9069, k, not_found)
  };
  G__9110 = function(this_sym9064, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9110__2.call(this, this_sym9064, k);
      case 3:
        return G__9110__3.call(this, this_sym9064, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9110
}();
cljs.core.BlackNode.prototype.apply = function(this_sym9055, args9056) {
  var this__9070 = this;
  return this_sym9055.call.apply(this_sym9055, [this_sym9055].concat(args9056.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9071 = this;
  return cljs.core.PersistentVector.fromArray([this__9071.key, this__9071.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9072 = this;
  return this__9072.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9073 = this;
  return this__9073.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__9074 = this;
  var node__9075 = this;
  return ins.balance_right(node__9075)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__9076 = this;
  var node__9077 = this;
  return new cljs.core.RedNode(this__9076.key, this__9076.val, this__9076.left, this__9076.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__9078 = this;
  var node__9079 = this;
  return cljs.core.balance_right_del(this__9078.key, this__9078.val, this__9078.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__9080 = this;
  var node__9081 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__9082 = this;
  var node__9083 = this;
  return cljs.core.tree_map_kv_reduce(node__9083, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__9084 = this;
  var node__9085 = this;
  return cljs.core.balance_left_del(this__9084.key, this__9084.val, del, this__9084.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__9086 = this;
  var node__9087 = this;
  return ins.balance_left(node__9087)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__9088 = this;
  var node__9089 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__9089, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__9111 = null;
  var G__9111__0 = function() {
    var this__9090 = this;
    var this__9092 = this;
    return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__9092], 0))
  };
  G__9111 = function() {
    switch(arguments.length) {
      case 0:
        return G__9111__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9111
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__9093 = this;
  var node__9094 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9094, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__9095 = this;
  var node__9096 = this;
  return node__9096
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9097 = this;
  return cljs.core.ci_reduce.cljs$lang$arity$2(node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9098 = this;
  return cljs.core.ci_reduce.cljs$lang$arity$3(node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9099 = this;
  return cljs.core.list.cljs$lang$arity$2(this__9099.key, this__9099.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9100 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9101 = this;
  return this__9101.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9102 = this;
  return cljs.core.PersistentVector.fromArray([this__9102.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9103 = this;
  return cljs.core._assoc_n(cljs.core.PersistentVector.fromArray([this__9103.key, this__9103.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9104 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9105 = this;
  return cljs.core.with_meta(cljs.core.PersistentVector.fromArray([this__9105.key, this__9105.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9106 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9107 = this;
  if(n === 0) {
    return this__9107.key
  }else {
    if(n === 1) {
      return this__9107.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9108 = this;
  if(n === 0) {
    return this__9108.key
  }else {
    if(n === 1) {
      return this__9108.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9109 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9114 = this;
  var h__2192__auto____9115 = this__9114.__hash;
  if(!(h__2192__auto____9115 == null)) {
    return h__2192__auto____9115
  }else {
    var h__2192__auto____9116 = cljs.core.hash_coll(coll);
    this__9114.__hash = h__2192__auto____9116;
    return h__2192__auto____9116
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9117 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9118 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9119 = this;
  return cljs.core.assoc.cljs$lang$arity$3(cljs.core.PersistentVector.fromArray([this__9119.key, this__9119.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__9167 = null;
  var G__9167__2 = function(this_sym9120, k) {
    var this__9122 = this;
    var this_sym9120__9123 = this;
    var node__9124 = this_sym9120__9123;
    return node__9124.cljs$core$ILookup$_lookup$arity$2(node__9124, k)
  };
  var G__9167__3 = function(this_sym9121, k, not_found) {
    var this__9122 = this;
    var this_sym9121__9125 = this;
    var node__9126 = this_sym9121__9125;
    return node__9126.cljs$core$ILookup$_lookup$arity$3(node__9126, k, not_found)
  };
  G__9167 = function(this_sym9121, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9167__2.call(this, this_sym9121, k);
      case 3:
        return G__9167__3.call(this, this_sym9121, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9167
}();
cljs.core.RedNode.prototype.apply = function(this_sym9112, args9113) {
  var this__9127 = this;
  return this_sym9112.call.apply(this_sym9112, [this_sym9112].concat(args9113.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9128 = this;
  return cljs.core.PersistentVector.fromArray([this__9128.key, this__9128.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9129 = this;
  return this__9129.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9130 = this;
  return this__9130.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__9131 = this;
  var node__9132 = this;
  return new cljs.core.RedNode(this__9131.key, this__9131.val, this__9131.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__9133 = this;
  var node__9134 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__9135 = this;
  var node__9136 = this;
  return new cljs.core.RedNode(this__9135.key, this__9135.val, this__9135.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__9137 = this;
  var node__9138 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__9139 = this;
  var node__9140 = this;
  return cljs.core.tree_map_kv_reduce(node__9140, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__9141 = this;
  var node__9142 = this;
  return new cljs.core.RedNode(this__9141.key, this__9141.val, del, this__9141.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__9143 = this;
  var node__9144 = this;
  return new cljs.core.RedNode(this__9143.key, this__9143.val, ins, this__9143.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__9145 = this;
  var node__9146 = this;
  if(cljs.core.instance_QMARK_(cljs.core.RedNode, this__9145.left)) {
    return new cljs.core.RedNode(this__9145.key, this__9145.val, this__9145.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__9145.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_(cljs.core.RedNode, this__9145.right)) {
      return new cljs.core.RedNode(this__9145.right.key, this__9145.right.val, new cljs.core.BlackNode(this__9145.key, this__9145.val, this__9145.left, this__9145.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__9145.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__9146, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__9168 = null;
  var G__9168__0 = function() {
    var this__9147 = this;
    var this__9149 = this;
    return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__9149], 0))
  };
  G__9168 = function() {
    switch(arguments.length) {
      case 0:
        return G__9168__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9168
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__9150 = this;
  var node__9151 = this;
  if(cljs.core.instance_QMARK_(cljs.core.RedNode, this__9150.right)) {
    return new cljs.core.RedNode(this__9150.key, this__9150.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9150.left, null), this__9150.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_(cljs.core.RedNode, this__9150.left)) {
      return new cljs.core.RedNode(this__9150.left.key, this__9150.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9150.left.left, null), new cljs.core.BlackNode(this__9150.key, this__9150.val, this__9150.left.right, this__9150.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9151, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__9152 = this;
  var node__9153 = this;
  return new cljs.core.BlackNode(this__9152.key, this__9152.val, this__9152.left, this__9152.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9154 = this;
  return cljs.core.ci_reduce.cljs$lang$arity$2(node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9155 = this;
  return cljs.core.ci_reduce.cljs$lang$arity$3(node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9156 = this;
  return cljs.core.list.cljs$lang$arity$2(this__9156.key, this__9156.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9157 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9158 = this;
  return this__9158.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9159 = this;
  return cljs.core.PersistentVector.fromArray([this__9159.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9160 = this;
  return cljs.core._assoc_n(cljs.core.PersistentVector.fromArray([this__9160.key, this__9160.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9161 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9162 = this;
  return cljs.core.with_meta(cljs.core.PersistentVector.fromArray([this__9162.key, this__9162.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9163 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9164 = this;
  if(n === 0) {
    return this__9164.key
  }else {
    if(n === 1) {
      return this__9164.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9165 = this;
  if(n === 0) {
    return this__9165.key
  }else {
    if(n === 1) {
      return this__9165.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9166 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__9172 = comp.cljs$lang$arity$2 ? comp.cljs$lang$arity$2(k, tree.key) : comp.call(null, k, tree.key);
    if(c__9172 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__9172 < 0) {
        var ins__9173 = tree_map_add(comp, tree.left, k, v, found);
        if(!(ins__9173 == null)) {
          return tree.add_left(ins__9173)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__9174 = tree_map_add(comp, tree.right, k, v, found);
          if(!(ins__9174 == null)) {
            return tree.add_right(ins__9174)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_(cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_(cljs.core.RedNode, right)) {
          var app__9177 = tree_map_append(left.right, right.left);
          if(cljs.core.instance_QMARK_(cljs.core.RedNode, app__9177)) {
            return new cljs.core.RedNode(app__9177.key, app__9177.val, new cljs.core.RedNode(left.key, left.val, left.left, app__9177.left, null), new cljs.core.RedNode(right.key, right.val, app__9177.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__9177, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append(left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_(cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append(left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__9178 = tree_map_append(left.right, right.left);
            if(cljs.core.instance_QMARK_(cljs.core.RedNode, app__9178)) {
              return new cljs.core.RedNode(app__9178.key, app__9178.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__9178.left, null), new cljs.core.BlackNode(right.key, right.val, app__9178.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del(left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__9178, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c__9184 = comp.cljs$lang$arity$2 ? comp.cljs$lang$arity$2(k, tree.key) : comp.call(null, k, tree.key);
    if(c__9184 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append(tree.left, tree.right)
    }else {
      if(c__9184 < 0) {
        var del__9185 = tree_map_remove(comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____9186 = !(del__9185 == null);
          if(or__3824__auto____9186) {
            return or__3824__auto____9186
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_(cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del(tree.key, tree.val, del__9185, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__9185, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__9187 = tree_map_remove(comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____9188 = !(del__9187 == null);
            if(or__3824__auto____9188) {
              return or__3824__auto____9188
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_(cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del(tree.key, tree.val, tree.left, del__9187)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__9187, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__9191 = tree.key;
  var c__9192 = comp.cljs$lang$arity$2 ? comp.cljs$lang$arity$2(k, tk__9191) : comp.call(null, k, tk__9191);
  if(c__9192 === 0) {
    return tree.replace(tk__9191, v, tree.left, tree.right)
  }else {
    if(c__9192 < 0) {
      return tree.replace(tk__9191, tree.val, tree_map_replace(comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__9191, tree.val, tree.left, tree_map_replace(comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9195 = this;
  var h__2192__auto____9196 = this__9195.__hash;
  if(!(h__2192__auto____9196 == null)) {
    return h__2192__auto____9196
  }else {
    var h__2192__auto____9197 = cljs.core.hash_imap(coll);
    this__9195.__hash = h__2192__auto____9197;
    return h__2192__auto____9197
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9198 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9199 = this;
  var n__9200 = coll.entry_at(k);
  if(!(n__9200 == null)) {
    return n__9200.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9201 = this;
  var found__9202 = [null];
  var t__9203 = cljs.core.tree_map_add(this__9201.comp, this__9201.tree, k, v, found__9202);
  if(t__9203 == null) {
    var found_node__9204 = cljs.core.nth.cljs$lang$arity$2(found__9202, 0);
    if(cljs.core._EQ_.cljs$lang$arity$2(v, found_node__9204.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9201.comp, cljs.core.tree_map_replace(this__9201.comp, this__9201.tree, k, v), this__9201.cnt, this__9201.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9201.comp, t__9203.blacken(), this__9201.cnt + 1, this__9201.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9205 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__9239 = null;
  var G__9239__2 = function(this_sym9206, k) {
    var this__9208 = this;
    var this_sym9206__9209 = this;
    var coll__9210 = this_sym9206__9209;
    return coll__9210.cljs$core$ILookup$_lookup$arity$2(coll__9210, k)
  };
  var G__9239__3 = function(this_sym9207, k, not_found) {
    var this__9208 = this;
    var this_sym9207__9211 = this;
    var coll__9212 = this_sym9207__9211;
    return coll__9212.cljs$core$ILookup$_lookup$arity$3(coll__9212, k, not_found)
  };
  G__9239 = function(this_sym9207, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9239__2.call(this, this_sym9207, k);
      case 3:
        return G__9239__3.call(this, this_sym9207, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9239
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym9193, args9194) {
  var this__9213 = this;
  return this_sym9193.call.apply(this_sym9193, [this_sym9193].concat(args9194.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9214 = this;
  if(!(this__9214.tree == null)) {
    return cljs.core.tree_map_kv_reduce(this__9214.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9215 = this;
  if(cljs.core.vector_QMARK_(entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.cljs$lang$arity$2(entry, 0), cljs.core._nth.cljs$lang$arity$2(entry, 1))
  }else {
    return cljs.core.reduce.cljs$lang$arity$3(cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9216 = this;
  if(this__9216.cnt > 0) {
    return cljs.core.create_tree_map_seq(this__9216.tree, false, this__9216.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__9217 = this;
  var this__9218 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__9218], 0))
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__9219 = this;
  var coll__9220 = this;
  var t__9221 = this__9219.tree;
  while(true) {
    if(!(t__9221 == null)) {
      var c__9222 = this__9219.comp.cljs$lang$arity$2 ? this__9219.comp.cljs$lang$arity$2(k, t__9221.key) : this__9219.comp.call(null, k, t__9221.key);
      if(c__9222 === 0) {
        return t__9221
      }else {
        if(c__9222 < 0) {
          var G__9240 = t__9221.left;
          t__9221 = G__9240;
          continue
        }else {
          if("\ufdd0'else") {
            var G__9241 = t__9221.right;
            t__9221 = G__9241;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9223 = this;
  if(this__9223.cnt > 0) {
    return cljs.core.create_tree_map_seq(this__9223.tree, ascending_QMARK_, this__9223.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9224 = this;
  if(this__9224.cnt > 0) {
    var stack__9225 = null;
    var t__9226 = this__9224.tree;
    while(true) {
      if(!(t__9226 == null)) {
        var c__9227 = this__9224.comp.cljs$lang$arity$2 ? this__9224.comp.cljs$lang$arity$2(k, t__9226.key) : this__9224.comp.call(null, k, t__9226.key);
        if(c__9227 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.cljs$lang$arity$2(stack__9225, t__9226), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__9227 < 0) {
              var G__9242 = cljs.core.conj.cljs$lang$arity$2(stack__9225, t__9226);
              var G__9243 = t__9226.left;
              stack__9225 = G__9242;
              t__9226 = G__9243;
              continue
            }else {
              var G__9244 = stack__9225;
              var G__9245 = t__9226.right;
              stack__9225 = G__9244;
              t__9226 = G__9245;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__9227 > 0) {
                var G__9246 = cljs.core.conj.cljs$lang$arity$2(stack__9225, t__9226);
                var G__9247 = t__9226.right;
                stack__9225 = G__9246;
                t__9226 = G__9247;
                continue
              }else {
                var G__9248 = stack__9225;
                var G__9249 = t__9226.left;
                stack__9225 = G__9248;
                t__9226 = G__9249;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__9225 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__9225, ascending_QMARK_, -1, null)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9228 = this;
  return cljs.core.key(entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9229 = this;
  return this__9229.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9230 = this;
  if(this__9230.cnt > 0) {
    return cljs.core.create_tree_map_seq(this__9230.tree, true, this__9230.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9231 = this;
  return this__9231.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9232 = this;
  return cljs.core.equiv_map(coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9233 = this;
  return new cljs.core.PersistentTreeMap(this__9233.comp, this__9233.tree, this__9233.cnt, meta, this__9233.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9234 = this;
  return this__9234.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9235 = this;
  return cljs.core.with_meta(cljs.core.PersistentTreeMap.EMPTY, this__9235.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9236 = this;
  var found__9237 = [null];
  var t__9238 = cljs.core.tree_map_remove(this__9236.comp, this__9236.tree, k, found__9237);
  if(t__9238 == null) {
    if(cljs.core.nth.cljs$lang$arity$2(found__9237, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9236.comp, null, 0, this__9236.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9236.comp, t__9238.blacken(), this__9236.cnt - 1, this__9236.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__9252 = cljs.core.seq(keyvals);
    var out__9253 = cljs.core.transient$(cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__9252) {
        var G__9254 = cljs.core.nnext(in__9252);
        var G__9255 = cljs.core.assoc_BANG_(out__9253, cljs.core.first(in__9252), cljs.core.second(in__9252));
        in__9252 = G__9254;
        out__9253 = G__9255;
        continue
      }else {
        return cljs.core.persistent_BANG_(out__9253)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__9256) {
    var keyvals = cljs.core.seq(arglist__9256);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot(cljs.core.count(keyvals), 2), cljs.core.apply.cljs$lang$arity$2(cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__9257) {
    var keyvals = cljs.core.seq(arglist__9257);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__9261 = [];
    var obj__9262 = {};
    var kvs__9263 = cljs.core.seq(keyvals);
    while(true) {
      if(kvs__9263) {
        ks__9261.push(cljs.core.first(kvs__9263));
        obj__9262[cljs.core.first(kvs__9263)] = cljs.core.second(kvs__9263);
        var G__9264 = cljs.core.nnext(kvs__9263);
        kvs__9263 = G__9264;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.cljs$lang$arity$2 ? cljs.core.ObjMap.fromObject.cljs$lang$arity$2(ks__9261, obj__9262) : cljs.core.ObjMap.fromObject.call(null, ks__9261, obj__9262)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__9265) {
    var keyvals = cljs.core.seq(arglist__9265);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__9268 = cljs.core.seq(keyvals);
    var out__9269 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__9268) {
        var G__9270 = cljs.core.nnext(in__9268);
        var G__9271 = cljs.core.assoc.cljs$lang$arity$3(out__9269, cljs.core.first(in__9268), cljs.core.second(in__9268));
        in__9268 = G__9270;
        out__9269 = G__9271;
        continue
      }else {
        return out__9269
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__9272) {
    var keyvals = cljs.core.seq(arglist__9272);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__9275 = cljs.core.seq(keyvals);
    var out__9276 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__9275) {
        var G__9277 = cljs.core.nnext(in__9275);
        var G__9278 = cljs.core.assoc.cljs$lang$arity$3(out__9276, cljs.core.first(in__9275), cljs.core.second(in__9275));
        in__9275 = G__9277;
        out__9276 = G__9278;
        continue
      }else {
        return out__9276
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__9279) {
    var comparator = cljs.core.first(arglist__9279);
    var keyvals = cljs.core.rest(arglist__9279);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq(cljs.core.map.cljs$lang$arity$2(cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key(map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq(cljs.core.map.cljs$lang$arity$2(cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val(map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some(cljs.core.identity, maps))) {
      return cljs.core.reduce.cljs$lang$arity$2(function(p1__9280_SHARP_, p2__9281_SHARP_) {
        return cljs.core.conj.cljs$lang$arity$2(function() {
          var or__3824__auto____9283 = p1__9280_SHARP_;
          if(cljs.core.truth_(or__3824__auto____9283)) {
            return or__3824__auto____9283
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__9281_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__9284) {
    var maps = cljs.core.seq(arglist__9284);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some(cljs.core.identity, maps))) {
      var merge_entry__9292 = function(m, e) {
        var k__9290 = cljs.core.first(e);
        var v__9291 = cljs.core.second(e);
        if(cljs.core.contains_QMARK_(m, k__9290)) {
          return cljs.core.assoc.cljs$lang$arity$3(m, k__9290, f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(cljs.core._lookup.cljs$lang$arity$3(m, k__9290, null), v__9291) : f.call(null, cljs.core._lookup.cljs$lang$arity$3(m, k__9290, null), v__9291))
        }else {
          return cljs.core.assoc.cljs$lang$arity$3(m, k__9290, v__9291)
        }
      };
      var merge2__9294 = function(m1, m2) {
        return cljs.core.reduce.cljs$lang$arity$3(merge_entry__9292, function() {
          var or__3824__auto____9293 = m1;
          if(cljs.core.truth_(or__3824__auto____9293)) {
            return or__3824__auto____9293
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq(m2))
      };
      return cljs.core.reduce.cljs$lang$arity$2(merge2__9294, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__9295) {
    var f = cljs.core.first(arglist__9295);
    var maps = cljs.core.rest(arglist__9295);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__9300 = cljs.core.ObjMap.EMPTY;
  var keys__9301 = cljs.core.seq(keyseq);
  while(true) {
    if(keys__9301) {
      var key__9302 = cljs.core.first(keys__9301);
      var entry__9303 = cljs.core._lookup.cljs$lang$arity$3(map, key__9302, "\ufdd0'cljs.core/not-found");
      var G__9304 = cljs.core.not_EQ_.cljs$lang$arity$2(entry__9303, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.cljs$lang$arity$3(ret__9300, key__9302, entry__9303) : ret__9300;
      var G__9305 = cljs.core.next(keys__9301);
      ret__9300 = G__9304;
      keys__9301 = G__9305;
      continue
    }else {
      return ret__9300
    }
    break
  }
};
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9309 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$(this__9309.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9310 = this;
  var h__2192__auto____9311 = this__9310.__hash;
  if(!(h__2192__auto____9311 == null)) {
    return h__2192__auto____9311
  }else {
    var h__2192__auto____9312 = cljs.core.hash_iset(coll);
    this__9310.__hash = h__2192__auto____9312;
    return h__2192__auto____9312
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9313 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9314 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_(this__9314.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__9335 = null;
  var G__9335__2 = function(this_sym9315, k) {
    var this__9317 = this;
    var this_sym9315__9318 = this;
    var coll__9319 = this_sym9315__9318;
    return coll__9319.cljs$core$ILookup$_lookup$arity$2(coll__9319, k)
  };
  var G__9335__3 = function(this_sym9316, k, not_found) {
    var this__9317 = this;
    var this_sym9316__9320 = this;
    var coll__9321 = this_sym9316__9320;
    return coll__9321.cljs$core$ILookup$_lookup$arity$3(coll__9321, k, not_found)
  };
  G__9335 = function(this_sym9316, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9335__2.call(this, this_sym9316, k);
      case 3:
        return G__9335__3.call(this, this_sym9316, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9335
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym9307, args9308) {
  var this__9322 = this;
  return this_sym9307.call.apply(this_sym9307, [this_sym9307].concat(args9308.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9323 = this;
  return new cljs.core.PersistentHashSet(this__9323.meta, cljs.core.assoc.cljs$lang$arity$3(this__9323.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__9324 = this;
  var this__9325 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__9325], 0))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9326 = this;
  return cljs.core.keys(this__9326.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9327 = this;
  return new cljs.core.PersistentHashSet(this__9327.meta, cljs.core.dissoc.cljs$lang$arity$2(this__9327.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9328 = this;
  return cljs.core.count(cljs.core.seq(coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9329 = this;
  var and__3822__auto____9330 = cljs.core.set_QMARK_(other);
  if(and__3822__auto____9330) {
    var and__3822__auto____9331 = cljs.core.count(coll) === cljs.core.count(other);
    if(and__3822__auto____9331) {
      return cljs.core.every_QMARK_(function(p1__9306_SHARP_) {
        return cljs.core.contains_QMARK_(coll, p1__9306_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9331
    }
  }else {
    return and__3822__auto____9330
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9332 = this;
  return new cljs.core.PersistentHashSet(meta, this__9332.hash_map, this__9332.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9333 = this;
  return this__9333.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9334 = this;
  return cljs.core.with_meta(cljs.core.PersistentHashSet.EMPTY, this__9334.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map(), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__9336 = cljs.core.count(items);
  var i__9337 = 0;
  var out__9338 = cljs.core.transient$(cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__9337 < len__9336) {
      var G__9339 = i__9337 + 1;
      var G__9340 = cljs.core.conj_BANG_(out__9338, items[i__9337]);
      i__9337 = G__9339;
      out__9338 = G__9340;
      continue
    }else {
      return cljs.core.persistent_BANG_(out__9338)
    }
    break
  }
};
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 34
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__9358 = null;
  var G__9358__2 = function(this_sym9344, k) {
    var this__9346 = this;
    var this_sym9344__9347 = this;
    var tcoll__9348 = this_sym9344__9347;
    if(cljs.core._lookup.cljs$lang$arity$3(this__9346.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__9358__3 = function(this_sym9345, k, not_found) {
    var this__9346 = this;
    var this_sym9345__9349 = this;
    var tcoll__9350 = this_sym9345__9349;
    if(cljs.core._lookup.cljs$lang$arity$3(this__9346.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__9358 = function(this_sym9345, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9358__2.call(this, this_sym9345, k);
      case 3:
        return G__9358__3.call(this, this_sym9345, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9358
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym9342, args9343) {
  var this__9351 = this;
  return this_sym9342.call.apply(this_sym9342, [this_sym9342].concat(args9343.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__9352 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__9353 = this;
  if(cljs.core._lookup.cljs$lang$arity$3(this__9353.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__9354 = this;
  return cljs.core.count(this__9354.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__9355 = this;
  this__9355.transient_map = cljs.core.dissoc_BANG_(this__9355.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9356 = this;
  this__9356.transient_map = cljs.core.assoc_BANG_(this__9356.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9357 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_(this__9357.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9361 = this;
  var h__2192__auto____9362 = this__9361.__hash;
  if(!(h__2192__auto____9362 == null)) {
    return h__2192__auto____9362
  }else {
    var h__2192__auto____9363 = cljs.core.hash_iset(coll);
    this__9361.__hash = h__2192__auto____9363;
    return h__2192__auto____9363
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9364 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9365 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_(this__9365.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__9391 = null;
  var G__9391__2 = function(this_sym9366, k) {
    var this__9368 = this;
    var this_sym9366__9369 = this;
    var coll__9370 = this_sym9366__9369;
    return coll__9370.cljs$core$ILookup$_lookup$arity$2(coll__9370, k)
  };
  var G__9391__3 = function(this_sym9367, k, not_found) {
    var this__9368 = this;
    var this_sym9367__9371 = this;
    var coll__9372 = this_sym9367__9371;
    return coll__9372.cljs$core$ILookup$_lookup$arity$3(coll__9372, k, not_found)
  };
  G__9391 = function(this_sym9367, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9391__2.call(this, this_sym9367, k);
      case 3:
        return G__9391__3.call(this, this_sym9367, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9391
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym9359, args9360) {
  var this__9373 = this;
  return this_sym9359.call.apply(this_sym9359, [this_sym9359].concat(args9360.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9374 = this;
  return new cljs.core.PersistentTreeSet(this__9374.meta, cljs.core.assoc.cljs$lang$arity$3(this__9374.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9375 = this;
  return cljs.core.map.cljs$lang$arity$2(cljs.core.key, cljs.core.rseq(this__9375.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__9376 = this;
  var this__9377 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__9377], 0))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9378 = this;
  return cljs.core.map.cljs$lang$arity$2(cljs.core.key, cljs.core._sorted_seq(this__9378.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9379 = this;
  return cljs.core.map.cljs$lang$arity$2(cljs.core.key, cljs.core._sorted_seq_from(this__9379.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9380 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9381 = this;
  return cljs.core._comparator(this__9381.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9382 = this;
  return cljs.core.keys(this__9382.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9383 = this;
  return new cljs.core.PersistentTreeSet(this__9383.meta, cljs.core.dissoc.cljs$lang$arity$2(this__9383.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9384 = this;
  return cljs.core.count(this__9384.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9385 = this;
  var and__3822__auto____9386 = cljs.core.set_QMARK_(other);
  if(and__3822__auto____9386) {
    var and__3822__auto____9387 = cljs.core.count(coll) === cljs.core.count(other);
    if(and__3822__auto____9387) {
      return cljs.core.every_QMARK_(function(p1__9341_SHARP_) {
        return cljs.core.contains_QMARK_(coll, p1__9341_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9387
    }
  }else {
    return and__3822__auto____9386
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9388 = this;
  return new cljs.core.PersistentTreeSet(meta, this__9388.tree_map, this__9388.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9389 = this;
  return this__9389.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9390 = this;
  return cljs.core.with_meta(cljs.core.PersistentTreeSet.EMPTY, this__9390.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map(), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__9396__delegate = function(keys) {
      var in__9394 = cljs.core.seq(keys);
      var out__9395 = cljs.core.transient$(cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq(in__9394)) {
          var G__9397 = cljs.core.next(in__9394);
          var G__9398 = cljs.core.conj_BANG_(out__9395, cljs.core.first(in__9394));
          in__9394 = G__9397;
          out__9395 = G__9398;
          continue
        }else {
          return cljs.core.persistent_BANG_(out__9395)
        }
        break
      }
    };
    var G__9396 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9396__delegate.call(this, keys)
    };
    G__9396.cljs$lang$maxFixedArity = 0;
    G__9396.cljs$lang$applyTo = function(arglist__9399) {
      var keys = cljs.core.seq(arglist__9399);
      return G__9396__delegate(keys)
    };
    G__9396.cljs$lang$arity$variadic = G__9396__delegate;
    return G__9396
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$lang$arity$0 = hash_set__0;
  hash_set.cljs$lang$arity$variadic = hash_set__1.cljs$lang$arity$variadic;
  return hash_set
}();
cljs.core.set = function set(coll) {
  return cljs.core.apply.cljs$lang$arity$2(cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.cljs$lang$arity$3(cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__9400) {
    var keys = cljs.core.seq(arglist__9400);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.cljs$lang$arity$3(cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by(comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__9402) {
    var comparator = cljs.core.first(arglist__9402);
    var keys = cljs.core.rest(arglist__9402);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_(coll)) {
    var n__9408 = cljs.core.count(coll);
    return cljs.core.reduce.cljs$lang$arity$3(function(v, i) {
      var temp__3971__auto____9409 = cljs.core.find(smap, cljs.core.nth.cljs$lang$arity$2(v, i));
      if(cljs.core.truth_(temp__3971__auto____9409)) {
        var e__9410 = temp__3971__auto____9409;
        return cljs.core.assoc.cljs$lang$arity$3(v, i, cljs.core.second(e__9410))
      }else {
        return v
      }
    }, coll, cljs.core.take(n__9408, cljs.core.iterate(cljs.core.inc, 0)))
  }else {
    return cljs.core.map.cljs$lang$arity$2(function(p1__9401_SHARP_) {
      var temp__3971__auto____9411 = cljs.core.find(smap, p1__9401_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____9411)) {
        var e__9412 = temp__3971__auto____9411;
        return cljs.core.second(e__9412)
      }else {
        return p1__9401_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__9442 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__9435, seen) {
        while(true) {
          var vec__9436__9437 = p__9435;
          var f__9438 = cljs.core.nth.cljs$lang$arity$3(vec__9436__9437, 0, null);
          var xs__9439 = vec__9436__9437;
          var temp__3974__auto____9440 = cljs.core.seq(xs__9439);
          if(temp__3974__auto____9440) {
            var s__9441 = temp__3974__auto____9440;
            if(cljs.core.contains_QMARK_(seen, f__9438)) {
              var G__9443 = cljs.core.rest(s__9441);
              var G__9444 = seen;
              p__9435 = G__9443;
              seen = G__9444;
              continue
            }else {
              return cljs.core.cons(f__9438, step(cljs.core.rest(s__9441), cljs.core.conj.cljs$lang$arity$2(seen, f__9438)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__9442.cljs$lang$arity$2 ? step__9442.cljs$lang$arity$2(coll, cljs.core.PersistentHashSet.EMPTY) : step__9442.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__9447 = cljs.core.PersistentVector.EMPTY;
  var s__9448 = s;
  while(true) {
    if(cljs.core.next(s__9448)) {
      var G__9449 = cljs.core.conj.cljs$lang$arity$2(ret__9447, cljs.core.first(s__9448));
      var G__9450 = cljs.core.next(s__9448);
      ret__9447 = G__9449;
      s__9448 = G__9450;
      continue
    }else {
      return cljs.core.seq(ret__9447)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_(x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____9453 = cljs.core.keyword_QMARK_(x);
      if(or__3824__auto____9453) {
        return or__3824__auto____9453
      }else {
        return cljs.core.symbol_QMARK_(x)
      }
    }()) {
      var i__9454 = x.lastIndexOf("/");
      if(i__9454 < 0) {
        return cljs.core.subs.cljs$lang$arity$2(x, 2)
      }else {
        return cljs.core.subs.cljs$lang$arity$2(x, i__9454 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3824__auto____9457 = cljs.core.keyword_QMARK_(x);
    if(or__3824__auto____9457) {
      return or__3824__auto____9457
    }else {
      return cljs.core.symbol_QMARK_(x)
    }
  }()) {
    var i__9458 = x.lastIndexOf("/");
    if(i__9458 > -1) {
      return cljs.core.subs.cljs$lang$arity$3(x, 2, i__9458)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__9465 = cljs.core.ObjMap.EMPTY;
  var ks__9466 = cljs.core.seq(keys);
  var vs__9467 = cljs.core.seq(vals);
  while(true) {
    if(function() {
      var and__3822__auto____9468 = ks__9466;
      if(and__3822__auto____9468) {
        return vs__9467
      }else {
        return and__3822__auto____9468
      }
    }()) {
      var G__9469 = cljs.core.assoc.cljs$lang$arity$3(map__9465, cljs.core.first(ks__9466), cljs.core.first(vs__9467));
      var G__9470 = cljs.core.next(ks__9466);
      var G__9471 = cljs.core.next(vs__9467);
      map__9465 = G__9469;
      ks__9466 = G__9470;
      vs__9467 = G__9471;
      continue
    }else {
      return map__9465
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if((k.cljs$lang$arity$1 ? k.cljs$lang$arity$1(x) : k.call(null, x)) > (k.cljs$lang$arity$1 ? k.cljs$lang$arity$1(y) : k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__9474__delegate = function(k, x, y, more) {
      return cljs.core.reduce.cljs$lang$arity$3(function(p1__9459_SHARP_, p2__9460_SHARP_) {
        return max_key.cljs$lang$arity$3(k, p1__9459_SHARP_, p2__9460_SHARP_)
      }, max_key.cljs$lang$arity$3(k, x, y), more)
    };
    var G__9474 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9474__delegate.call(this, k, x, y, more)
    };
    G__9474.cljs$lang$maxFixedArity = 3;
    G__9474.cljs$lang$applyTo = function(arglist__9475) {
      var k = cljs.core.first(arglist__9475);
      var x = cljs.core.first(cljs.core.next(arglist__9475));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9475)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9475)));
      return G__9474__delegate(k, x, y, more)
    };
    G__9474.cljs$lang$arity$variadic = G__9474__delegate;
    return G__9474
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if((k.cljs$lang$arity$1 ? k.cljs$lang$arity$1(x) : k.call(null, x)) < (k.cljs$lang$arity$1 ? k.cljs$lang$arity$1(y) : k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__9476__delegate = function(k, x, y, more) {
      return cljs.core.reduce.cljs$lang$arity$3(function(p1__9472_SHARP_, p2__9473_SHARP_) {
        return min_key.cljs$lang$arity$3(k, p1__9472_SHARP_, p2__9473_SHARP_)
      }, min_key.cljs$lang$arity$3(k, x, y), more)
    };
    var G__9476 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9476__delegate.call(this, k, x, y, more)
    };
    G__9476.cljs$lang$maxFixedArity = 3;
    G__9476.cljs$lang$applyTo = function(arglist__9477) {
      var k = cljs.core.first(arglist__9477);
      var x = cljs.core.first(cljs.core.next(arglist__9477));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9477)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9477)));
      return G__9476__delegate(k, x, y, more)
    };
    G__9476.cljs$lang$arity$variadic = G__9476__delegate;
    return G__9476
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.cljs$lang$arity$3(n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9480 = cljs.core.seq(coll);
      if(temp__3974__auto____9480) {
        var s__9481 = temp__3974__auto____9480;
        return cljs.core.cons(cljs.core.take(n, s__9481), partition_all.cljs$lang$arity$3(n, step, cljs.core.drop(step, s__9481)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9484 = cljs.core.seq(coll);
    if(temp__3974__auto____9484) {
      var s__9485 = temp__3974__auto____9484;
      if(cljs.core.truth_(pred.cljs$lang$arity$1 ? pred.cljs$lang$arity$1(cljs.core.first(s__9485)) : pred.call(null, cljs.core.first(s__9485)))) {
        return cljs.core.cons(cljs.core.first(s__9485), take_while(pred, cljs.core.rest(s__9485)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__9487 = cljs.core._comparator(sc);
    return test.cljs$lang$arity$2 ? test.cljs$lang$arity$2(comp__9487.cljs$lang$arity$2 ? comp__9487.cljs$lang$arity$2(cljs.core._entry_key(sc, e), key) : comp__9487.call(null, cljs.core._entry_key(sc, e), key), 0) : test.call(null, comp__9487.cljs$lang$arity$2 ? comp__9487.cljs$lang$arity$2(cljs.core._entry_key(sc, e), key) : comp__9487.call(null, cljs.core._entry_key(sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__9499 = cljs.core.mk_bound_fn(sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____9500 = cljs.core._sorted_seq_from(sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____9500)) {
        var vec__9501__9502 = temp__3974__auto____9500;
        var e__9503 = cljs.core.nth.cljs$lang$arity$3(vec__9501__9502, 0, null);
        var s__9504 = vec__9501__9502;
        if(cljs.core.truth_(include__9499.cljs$lang$arity$1 ? include__9499.cljs$lang$arity$1(e__9503) : include__9499.call(null, e__9503))) {
          return s__9504
        }else {
          return cljs.core.next(s__9504)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while(include__9499, cljs.core._sorted_seq(sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9505 = cljs.core._sorted_seq_from(sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____9505)) {
      var vec__9506__9507 = temp__3974__auto____9505;
      var e__9508 = cljs.core.nth.cljs$lang$arity$3(vec__9506__9507, 0, null);
      var s__9509 = vec__9506__9507;
      return cljs.core.take_while(cljs.core.mk_bound_fn(sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn(sc, start_test, start_key).call(null, e__9508)) ? s__9509 : cljs.core.next(s__9509))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__9521 = cljs.core.mk_bound_fn(sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____9522 = cljs.core._sorted_seq_from(sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____9522)) {
        var vec__9523__9524 = temp__3974__auto____9522;
        var e__9525 = cljs.core.nth.cljs$lang$arity$3(vec__9523__9524, 0, null);
        var s__9526 = vec__9523__9524;
        if(cljs.core.truth_(include__9521.cljs$lang$arity$1 ? include__9521.cljs$lang$arity$1(e__9525) : include__9521.call(null, e__9525))) {
          return s__9526
        }else {
          return cljs.core.next(s__9526)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while(include__9521, cljs.core._sorted_seq(sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9527 = cljs.core._sorted_seq_from(sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____9527)) {
      var vec__9528__9529 = temp__3974__auto____9527;
      var e__9530 = cljs.core.nth.cljs$lang$arity$3(vec__9528__9529, 0, null);
      var s__9531 = vec__9528__9529;
      return cljs.core.take_while(cljs.core.mk_bound_fn(sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn(sc, end_test, end_key).call(null, e__9530)) ? s__9531 : cljs.core.next(s__9531))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__9532 = this;
  var h__2192__auto____9533 = this__9532.__hash;
  if(!(h__2192__auto____9533 == null)) {
    return h__2192__auto____9533
  }else {
    var h__2192__auto____9534 = cljs.core.hash_coll(rng);
    this__9532.__hash = h__2192__auto____9534;
    return h__2192__auto____9534
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__9535 = this;
  if(this__9535.step > 0) {
    if(this__9535.start + this__9535.step < this__9535.end) {
      return new cljs.core.Range(this__9535.meta, this__9535.start + this__9535.step, this__9535.end, this__9535.step, null)
    }else {
      return null
    }
  }else {
    if(this__9535.start + this__9535.step > this__9535.end) {
      return new cljs.core.Range(this__9535.meta, this__9535.start + this__9535.step, this__9535.end, this__9535.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__9536 = this;
  return cljs.core.cons(o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__9537 = this;
  var this__9538 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__9538], 0))
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__9539 = this;
  return cljs.core.ci_reduce.cljs$lang$arity$2(rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__9540 = this;
  return cljs.core.ci_reduce.cljs$lang$arity$3(rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__9541 = this;
  if(this__9541.step > 0) {
    if(this__9541.start < this__9541.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__9541.start > this__9541.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__9542 = this;
  if(cljs.core.not(rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__9542.end - this__9542.start) / this__9542.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__9543 = this;
  return this__9543.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__9544 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__9544.meta, this__9544.start + this__9544.step, this__9544.end, this__9544.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__9545 = this;
  return cljs.core.equiv_sequential(rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__9546 = this;
  return new cljs.core.Range(meta, this__9546.start, this__9546.end, this__9546.step, this__9546.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__9547 = this;
  return this__9547.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__9548 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9548.start + n * this__9548.step
  }else {
    if(function() {
      var and__3822__auto____9549 = this__9548.start > this__9548.end;
      if(and__3822__auto____9549) {
        return this__9548.step === 0
      }else {
        return and__3822__auto____9549
      }
    }()) {
      return this__9548.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__9550 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9550.start + n * this__9550.step
  }else {
    if(function() {
      var and__3822__auto____9551 = this__9550.start > this__9550.end;
      if(and__3822__auto____9551) {
        return this__9550.step === 0
      }else {
        return and__3822__auto____9551
      }
    }()) {
      return this__9550.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__9552 = this;
  return cljs.core.with_meta(cljs.core.List.EMPTY, this__9552.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.cljs$lang$arity$3(0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.cljs$lang$arity$3(0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.cljs$lang$arity$3(start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9555 = cljs.core.seq(coll);
    if(temp__3974__auto____9555) {
      var s__9556 = temp__3974__auto____9555;
      return cljs.core.cons(cljs.core.first(s__9556), take_nth(n, cljs.core.drop(n, s__9556)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while(pred, coll), cljs.core.drop_while(pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9563 = cljs.core.seq(coll);
    if(temp__3974__auto____9563) {
      var s__9564 = temp__3974__auto____9563;
      var fst__9565 = cljs.core.first(s__9564);
      var fv__9566 = f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(fst__9565) : f.call(null, fst__9565);
      var run__9567 = cljs.core.cons(fst__9565, cljs.core.take_while(function(p1__9557_SHARP_) {
        return cljs.core._EQ_.cljs$lang$arity$2(fv__9566, f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(p1__9557_SHARP_) : f.call(null, p1__9557_SHARP_))
      }, cljs.core.next(s__9564)));
      return cljs.core.cons(run__9567, partition_by(f, cljs.core.seq(cljs.core.drop(cljs.core.count(run__9567), s__9564))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_(cljs.core.reduce.cljs$lang$arity$3(function(counts, x) {
    return cljs.core.assoc_BANG_(counts, x, cljs.core._lookup.cljs$lang$arity$3(counts, x, 0) + 1)
  }, cljs.core.transient$(cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____9582 = cljs.core.seq(coll);
      if(temp__3971__auto____9582) {
        var s__9583 = temp__3971__auto____9582;
        return reductions.cljs$lang$arity$3(f, cljs.core.first(s__9583), cljs.core.rest(s__9583))
      }else {
        return cljs.core.list.cljs$lang$arity$1(f.cljs$lang$arity$0 ? f.cljs$lang$arity$0() : f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons(init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9584 = cljs.core.seq(coll);
      if(temp__3974__auto____9584) {
        var s__9585 = temp__3974__auto____9584;
        return reductions.cljs$lang$arity$3(f, f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(init, cljs.core.first(s__9585)) : f.call(null, init, cljs.core.first(s__9585)), cljs.core.rest(s__9585))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__9588 = null;
      var G__9588__0 = function() {
        return cljs.core.vector.cljs$lang$arity$variadic(cljs.core.array_seq([f.cljs$lang$arity$0 ? f.cljs$lang$arity$0() : f.call(null)], 0))
      };
      var G__9588__1 = function(x) {
        return cljs.core.vector.cljs$lang$arity$variadic(cljs.core.array_seq([f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(x) : f.call(null, x)], 0))
      };
      var G__9588__2 = function(x, y) {
        return cljs.core.vector.cljs$lang$arity$variadic(cljs.core.array_seq([f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(x, y) : f.call(null, x, y)], 0))
      };
      var G__9588__3 = function(x, y, z) {
        return cljs.core.vector.cljs$lang$arity$variadic(cljs.core.array_seq([f.cljs$lang$arity$3 ? f.cljs$lang$arity$3(x, y, z) : f.call(null, x, y, z)], 0))
      };
      var G__9588__4 = function() {
        var G__9589__delegate = function(x, y, z, args) {
          return cljs.core.vector.cljs$lang$arity$variadic(cljs.core.array_seq([cljs.core.apply.cljs$lang$arity$5(f, x, y, z, args)], 0))
        };
        var G__9589 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9589__delegate.call(this, x, y, z, args)
        };
        G__9589.cljs$lang$maxFixedArity = 3;
        G__9589.cljs$lang$applyTo = function(arglist__9590) {
          var x = cljs.core.first(arglist__9590);
          var y = cljs.core.first(cljs.core.next(arglist__9590));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9590)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9590)));
          return G__9589__delegate(x, y, z, args)
        };
        G__9589.cljs$lang$arity$variadic = G__9589__delegate;
        return G__9589
      }();
      G__9588 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9588__0.call(this);
          case 1:
            return G__9588__1.call(this, x);
          case 2:
            return G__9588__2.call(this, x, y);
          case 3:
            return G__9588__3.call(this, x, y, z);
          default:
            return G__9588__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9588.cljs$lang$maxFixedArity = 3;
      G__9588.cljs$lang$applyTo = G__9588__4.cljs$lang$applyTo;
      return G__9588
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__9591 = null;
      var G__9591__0 = function() {
        return cljs.core.vector.cljs$lang$arity$variadic(cljs.core.array_seq([f.cljs$lang$arity$0 ? f.cljs$lang$arity$0() : f.call(null), g.cljs$lang$arity$0 ? g.cljs$lang$arity$0() : g.call(null)], 0))
      };
      var G__9591__1 = function(x) {
        return cljs.core.vector.cljs$lang$arity$variadic(cljs.core.array_seq([f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(x) : f.call(null, x), g.cljs$lang$arity$1 ? g.cljs$lang$arity$1(x) : g.call(null, x)], 0))
      };
      var G__9591__2 = function(x, y) {
        return cljs.core.vector.cljs$lang$arity$variadic(cljs.core.array_seq([f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(x, y) : f.call(null, x, y), g.cljs$lang$arity$2 ? g.cljs$lang$arity$2(x, y) : g.call(null, x, y)], 0))
      };
      var G__9591__3 = function(x, y, z) {
        return cljs.core.vector.cljs$lang$arity$variadic(cljs.core.array_seq([f.cljs$lang$arity$3 ? f.cljs$lang$arity$3(x, y, z) : f.call(null, x, y, z), g.cljs$lang$arity$3 ? g.cljs$lang$arity$3(x, y, z) : g.call(null, x, y, z)], 0))
      };
      var G__9591__4 = function() {
        var G__9592__delegate = function(x, y, z, args) {
          return cljs.core.vector.cljs$lang$arity$variadic(cljs.core.array_seq([cljs.core.apply.cljs$lang$arity$5(f, x, y, z, args), cljs.core.apply.cljs$lang$arity$5(g, x, y, z, args)], 0))
        };
        var G__9592 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9592__delegate.call(this, x, y, z, args)
        };
        G__9592.cljs$lang$maxFixedArity = 3;
        G__9592.cljs$lang$applyTo = function(arglist__9593) {
          var x = cljs.core.first(arglist__9593);
          var y = cljs.core.first(cljs.core.next(arglist__9593));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9593)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9593)));
          return G__9592__delegate(x, y, z, args)
        };
        G__9592.cljs$lang$arity$variadic = G__9592__delegate;
        return G__9592
      }();
      G__9591 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9591__0.call(this);
          case 1:
            return G__9591__1.call(this, x);
          case 2:
            return G__9591__2.call(this, x, y);
          case 3:
            return G__9591__3.call(this, x, y, z);
          default:
            return G__9591__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9591.cljs$lang$maxFixedArity = 3;
      G__9591.cljs$lang$applyTo = G__9591__4.cljs$lang$applyTo;
      return G__9591
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__9594 = null;
      var G__9594__0 = function() {
        return cljs.core.vector.cljs$lang$arity$variadic(cljs.core.array_seq([f.cljs$lang$arity$0 ? f.cljs$lang$arity$0() : f.call(null), g.cljs$lang$arity$0 ? g.cljs$lang$arity$0() : g.call(null), h.cljs$lang$arity$0 ? h.cljs$lang$arity$0() : h.call(null)], 0))
      };
      var G__9594__1 = function(x) {
        return cljs.core.vector.cljs$lang$arity$variadic(cljs.core.array_seq([f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(x) : f.call(null, x), g.cljs$lang$arity$1 ? g.cljs$lang$arity$1(x) : g.call(null, x), h.cljs$lang$arity$1 ? h.cljs$lang$arity$1(x) : h.call(null, x)], 0))
      };
      var G__9594__2 = function(x, y) {
        return cljs.core.vector.cljs$lang$arity$variadic(cljs.core.array_seq([f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(x, y) : f.call(null, x, y), g.cljs$lang$arity$2 ? g.cljs$lang$arity$2(x, y) : g.call(null, x, y), h.cljs$lang$arity$2 ? h.cljs$lang$arity$2(x, y) : h.call(null, x, y)], 0))
      };
      var G__9594__3 = function(x, y, z) {
        return cljs.core.vector.cljs$lang$arity$variadic(cljs.core.array_seq([f.cljs$lang$arity$3 ? f.cljs$lang$arity$3(x, y, z) : f.call(null, x, y, z), g.cljs$lang$arity$3 ? g.cljs$lang$arity$3(x, y, z) : g.call(null, x, y, z), h.cljs$lang$arity$3 ? h.cljs$lang$arity$3(x, y, z) : h.call(null, x, y, z)], 0))
      };
      var G__9594__4 = function() {
        var G__9595__delegate = function(x, y, z, args) {
          return cljs.core.vector.cljs$lang$arity$variadic(cljs.core.array_seq([cljs.core.apply.cljs$lang$arity$5(f, x, y, z, args), cljs.core.apply.cljs$lang$arity$5(g, x, y, z, args), cljs.core.apply.cljs$lang$arity$5(h, x, y, z, args)], 0))
        };
        var G__9595 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9595__delegate.call(this, x, y, z, args)
        };
        G__9595.cljs$lang$maxFixedArity = 3;
        G__9595.cljs$lang$applyTo = function(arglist__9596) {
          var x = cljs.core.first(arglist__9596);
          var y = cljs.core.first(cljs.core.next(arglist__9596));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9596)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9596)));
          return G__9595__delegate(x, y, z, args)
        };
        G__9595.cljs$lang$arity$variadic = G__9595__delegate;
        return G__9595
      }();
      G__9594 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9594__0.call(this);
          case 1:
            return G__9594__1.call(this, x);
          case 2:
            return G__9594__2.call(this, x, y);
          case 3:
            return G__9594__3.call(this, x, y, z);
          default:
            return G__9594__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9594.cljs$lang$maxFixedArity = 3;
      G__9594.cljs$lang$applyTo = G__9594__4.cljs$lang$applyTo;
      return G__9594
    }()
  };
  var juxt__4 = function() {
    var G__9597__delegate = function(f, g, h, fs) {
      var fs__9587 = cljs.core.list_STAR_.cljs$lang$arity$4(f, g, h, fs);
      return function() {
        var G__9598 = null;
        var G__9598__0 = function() {
          return cljs.core.reduce.cljs$lang$arity$3(function(p1__9568_SHARP_, p2__9569_SHARP_) {
            return cljs.core.conj.cljs$lang$arity$2(p1__9568_SHARP_, p2__9569_SHARP_.cljs$lang$arity$0 ? p2__9569_SHARP_.cljs$lang$arity$0() : p2__9569_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__9587)
        };
        var G__9598__1 = function(x) {
          return cljs.core.reduce.cljs$lang$arity$3(function(p1__9570_SHARP_, p2__9571_SHARP_) {
            return cljs.core.conj.cljs$lang$arity$2(p1__9570_SHARP_, p2__9571_SHARP_.cljs$lang$arity$1 ? p2__9571_SHARP_.cljs$lang$arity$1(x) : p2__9571_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__9587)
        };
        var G__9598__2 = function(x, y) {
          return cljs.core.reduce.cljs$lang$arity$3(function(p1__9572_SHARP_, p2__9573_SHARP_) {
            return cljs.core.conj.cljs$lang$arity$2(p1__9572_SHARP_, p2__9573_SHARP_.cljs$lang$arity$2 ? p2__9573_SHARP_.cljs$lang$arity$2(x, y) : p2__9573_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__9587)
        };
        var G__9598__3 = function(x, y, z) {
          return cljs.core.reduce.cljs$lang$arity$3(function(p1__9574_SHARP_, p2__9575_SHARP_) {
            return cljs.core.conj.cljs$lang$arity$2(p1__9574_SHARP_, p2__9575_SHARP_.cljs$lang$arity$3 ? p2__9575_SHARP_.cljs$lang$arity$3(x, y, z) : p2__9575_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__9587)
        };
        var G__9598__4 = function() {
          var G__9599__delegate = function(x, y, z, args) {
            return cljs.core.reduce.cljs$lang$arity$3(function(p1__9576_SHARP_, p2__9577_SHARP_) {
              return cljs.core.conj.cljs$lang$arity$2(p1__9576_SHARP_, cljs.core.apply.cljs$lang$arity$5(p2__9577_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__9587)
          };
          var G__9599 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__9599__delegate.call(this, x, y, z, args)
          };
          G__9599.cljs$lang$maxFixedArity = 3;
          G__9599.cljs$lang$applyTo = function(arglist__9600) {
            var x = cljs.core.first(arglist__9600);
            var y = cljs.core.first(cljs.core.next(arglist__9600));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9600)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9600)));
            return G__9599__delegate(x, y, z, args)
          };
          G__9599.cljs$lang$arity$variadic = G__9599__delegate;
          return G__9599
        }();
        G__9598 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__9598__0.call(this);
            case 1:
              return G__9598__1.call(this, x);
            case 2:
              return G__9598__2.call(this, x, y);
            case 3:
              return G__9598__3.call(this, x, y, z);
            default:
              return G__9598__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__9598.cljs$lang$maxFixedArity = 3;
        G__9598.cljs$lang$applyTo = G__9598__4.cljs$lang$applyTo;
        return G__9598
      }()
    };
    var G__9597 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9597__delegate.call(this, f, g, h, fs)
    };
    G__9597.cljs$lang$maxFixedArity = 3;
    G__9597.cljs$lang$applyTo = function(arglist__9601) {
      var f = cljs.core.first(arglist__9601);
      var g = cljs.core.first(cljs.core.next(arglist__9601));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9601)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9601)));
      return G__9597__delegate(f, g, h, fs)
    };
    G__9597.cljs$lang$arity$variadic = G__9597__delegate;
    return G__9597
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq(coll)) {
        var G__9604 = cljs.core.next(coll);
        coll = G__9604;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____9603 = cljs.core.seq(coll);
        if(and__3822__auto____9603) {
          return n > 0
        }else {
          return and__3822__auto____9603
        }
      }())) {
        var G__9605 = n - 1;
        var G__9606 = cljs.core.next(coll);
        n = G__9605;
        coll = G__9606;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.cljs$lang$arity$1(coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.cljs$lang$arity$2(n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches__9608 = re.exec(s);
  if(cljs.core._EQ_.cljs$lang$arity$2(cljs.core.first(matches__9608), s)) {
    if(cljs.core.count(matches__9608) === 1) {
      return cljs.core.first(matches__9608)
    }else {
      return cljs.core.vec(matches__9608)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__9610 = re.exec(s);
  if(matches__9610 == null) {
    return null
  }else {
    if(cljs.core.count(matches__9610) === 1) {
      return cljs.core.first(matches__9610)
    }else {
      return cljs.core.vec(matches__9610)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__9615 = cljs.core.re_find(re, s);
  var match_idx__9616 = s.search(re);
  var match_str__9617 = cljs.core.coll_QMARK_(match_data__9615) ? cljs.core.first(match_data__9615) : match_data__9615;
  var post_match__9618 = cljs.core.subs.cljs$lang$arity$2(s, match_idx__9616 + cljs.core.count(match_str__9617));
  if(cljs.core.truth_(match_data__9615)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons(match_data__9615, re_seq(re, post_match__9618))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__9625__9626 = cljs.core.re_find(/^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___9627 = cljs.core.nth.cljs$lang$arity$3(vec__9625__9626, 0, null);
  var flags__9628 = cljs.core.nth.cljs$lang$arity$3(vec__9625__9626, 1, null);
  var pattern__9629 = cljs.core.nth.cljs$lang$arity$3(vec__9625__9626, 2, null);
  return new RegExp(pattern__9629, flags__9628)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.cljs$lang$arity$variadic(cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1(cljs.core.interpose(cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.cljs$lang$arity$2(function(p1__9619_SHARP_) {
    return print_one.cljs$lang$arity$2 ? print_one.cljs$lang$arity$2(p1__9619_SHARP_, opts) : print_one.call(null, p1__9619_SHARP_, opts)
  }, coll))), cljs.core.array_seq([cljs.core.PersistentVector.fromArray([end], true)], 0))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_(x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.cljs$lang$arity$1("nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.cljs$lang$arity$1("#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.cljs$lang$arity$2(cljs.core.truth_(function() {
          var and__3822__auto____9639 = cljs.core._lookup.cljs$lang$arity$3(opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____9639)) {
            var and__3822__auto____9643 = function() {
              var G__9640__9641 = obj;
              if(G__9640__9641) {
                if(function() {
                  var or__3824__auto____9642 = G__9640__9641.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____9642) {
                    return or__3824__auto____9642
                  }else {
                    return G__9640__9641.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__9640__9641.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_(cljs.core.IMeta, G__9640__9641)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_(cljs.core.IMeta, G__9640__9641)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____9643)) {
              return cljs.core.meta(obj)
            }else {
              return and__3822__auto____9643
            }
          }else {
            return and__3822__auto____9639
          }
        }()) ? cljs.core.concat.cljs$lang$arity$variadic(cljs.core.PersistentVector.fromArray(["^"], true), pr_seq(cljs.core.meta(obj), opts), cljs.core.array_seq([cljs.core.PersistentVector.fromArray([" "], true)], 0)) : null, function() {
          var and__3822__auto____9644 = !(obj == null);
          if(and__3822__auto____9644) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____9644
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__9645__9646 = obj;
          if(G__9645__9646) {
            if(function() {
              var or__3824__auto____9647 = G__9645__9646.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____9647) {
                return or__3824__auto____9647
              }else {
                return G__9645__9646.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__9645__9646.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_(cljs.core.IPrintable, G__9645__9646)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_(cljs.core.IPrintable, G__9645__9646)
          }
        }() ? cljs.core._pr_seq(obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_(obj)) ? cljs.core.list.cljs$lang$arity$3('#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.cljs$lang$arity$3("#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__9667 = new goog.string.StringBuffer;
  var G__9668__9669 = cljs.core.seq(cljs.core.pr_seq(cljs.core.first(objs), opts));
  if(G__9668__9669) {
    var string__9670 = cljs.core.first(G__9668__9669);
    var G__9668__9671 = G__9668__9669;
    while(true) {
      sb__9667.append(string__9670);
      var temp__3974__auto____9672 = cljs.core.next(G__9668__9671);
      if(temp__3974__auto____9672) {
        var G__9668__9673 = temp__3974__auto____9672;
        var G__9686 = cljs.core.first(G__9668__9673);
        var G__9687 = G__9668__9673;
        string__9670 = G__9686;
        G__9668__9671 = G__9687;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__9674__9675 = cljs.core.seq(cljs.core.next(objs));
  if(G__9674__9675) {
    var obj__9676 = cljs.core.first(G__9674__9675);
    var G__9674__9677 = G__9674__9675;
    while(true) {
      sb__9667.append(" ");
      var G__9678__9679 = cljs.core.seq(cljs.core.pr_seq(obj__9676, opts));
      if(G__9678__9679) {
        var string__9680 = cljs.core.first(G__9678__9679);
        var G__9678__9681 = G__9678__9679;
        while(true) {
          sb__9667.append(string__9680);
          var temp__3974__auto____9682 = cljs.core.next(G__9678__9681);
          if(temp__3974__auto____9682) {
            var G__9678__9683 = temp__3974__auto____9682;
            var G__9688 = cljs.core.first(G__9678__9683);
            var G__9689 = G__9678__9683;
            string__9680 = G__9688;
            G__9678__9681 = G__9689;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____9684 = cljs.core.next(G__9674__9677);
      if(temp__3974__auto____9684) {
        var G__9674__9685 = temp__3974__auto____9684;
        var G__9690 = cljs.core.first(G__9674__9685);
        var G__9691 = G__9674__9685;
        obj__9676 = G__9690;
        G__9674__9677 = G__9691;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__9667
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb(objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__9693 = cljs.core.pr_sb(objs, opts);
  sb__9693.append("\n");
  return[cljs.core.str(sb__9693)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__9712__9713 = cljs.core.seq(cljs.core.pr_seq(cljs.core.first(objs), opts));
  if(G__9712__9713) {
    var string__9714 = cljs.core.first(G__9712__9713);
    var G__9712__9715 = G__9712__9713;
    while(true) {
      cljs.core.string_print(string__9714);
      var temp__3974__auto____9716 = cljs.core.next(G__9712__9715);
      if(temp__3974__auto____9716) {
        var G__9712__9717 = temp__3974__auto____9716;
        var G__9730 = cljs.core.first(G__9712__9717);
        var G__9731 = G__9712__9717;
        string__9714 = G__9730;
        G__9712__9715 = G__9731;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__9718__9719 = cljs.core.seq(cljs.core.next(objs));
  if(G__9718__9719) {
    var obj__9720 = cljs.core.first(G__9718__9719);
    var G__9718__9721 = G__9718__9719;
    while(true) {
      cljs.core.string_print(" ");
      var G__9722__9723 = cljs.core.seq(cljs.core.pr_seq(obj__9720, opts));
      if(G__9722__9723) {
        var string__9724 = cljs.core.first(G__9722__9723);
        var G__9722__9725 = G__9722__9723;
        while(true) {
          cljs.core.string_print(string__9724);
          var temp__3974__auto____9726 = cljs.core.next(G__9722__9725);
          if(temp__3974__auto____9726) {
            var G__9722__9727 = temp__3974__auto____9726;
            var G__9732 = cljs.core.first(G__9722__9727);
            var G__9733 = G__9722__9727;
            string__9724 = G__9732;
            G__9722__9725 = G__9733;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____9728 = cljs.core.next(G__9718__9721);
      if(temp__3974__auto____9728) {
        var G__9718__9729 = temp__3974__auto____9728;
        var G__9734 = cljs.core.first(G__9718__9729);
        var G__9735 = G__9718__9729;
        obj__9720 = G__9734;
        G__9718__9721 = G__9735;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print("\n");
  if(cljs.core.truth_(cljs.core._lookup.cljs$lang$arity$3(opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush()
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts(objs, cljs.core.pr_opts())
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__9736) {
    var objs = cljs.core.seq(arglist__9736);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts(objs, cljs.core.pr_opts())
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__9737) {
    var objs = cljs.core.seq(arglist__9737);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts(objs, cljs.core.pr_opts())
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__9738) {
    var objs = cljs.core.seq(arglist__9738);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts(objs, cljs.core.assoc.cljs$lang$arity$3(cljs.core.pr_opts(), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__9739) {
    var objs = cljs.core.seq(arglist__9739);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts(objs, cljs.core.assoc.cljs$lang$arity$3(cljs.core.pr_opts(), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__9740) {
    var objs = cljs.core.seq(arglist__9740);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts(objs, cljs.core.assoc.cljs$lang$arity$3(cljs.core.pr_opts(), "\ufdd0'readably", false));
    return cljs.core.newline(cljs.core.pr_opts())
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__9741) {
    var objs = cljs.core.seq(arglist__9741);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts(objs, cljs.core.assoc.cljs$lang$arity$3(cljs.core.pr_opts(), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__9742) {
    var objs = cljs.core.seq(arglist__9742);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts(objs, cljs.core.pr_opts());
    return cljs.core.newline(cljs.core.pr_opts())
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__9743) {
    var objs = cljs.core.seq(arglist__9743);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.cljs$lang$arity$variadic(cljs.core.array_seq([cljs.core.apply.cljs$lang$arity$3(cljs.core.format, fmt, args)], 0))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__9744) {
    var fmt = cljs.core.first(arglist__9744);
    var args = cljs.core.rest(arglist__9744);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9745 = function(keyval) {
    return cljs.core.pr_sequential(cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential(pr_pair__9745, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.cljs$lang$arity$1([cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9746 = function(keyval) {
    return cljs.core.pr_sequential(cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential(pr_pair__9746, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9747 = function(keyval) {
    return cljs.core.pr_sequential(cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential(pr_pair__9747, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq(coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.cljs$lang$arity$1([cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_(obj)) {
    return cljs.core.list.cljs$lang$arity$1([cljs.core.str(":"), cljs.core.str(function() {
      var temp__3974__auto____9748 = cljs.core.namespace(obj);
      if(cljs.core.truth_(temp__3974__auto____9748)) {
        var nspc__9749 = temp__3974__auto____9748;
        return[cljs.core.str(nspc__9749), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name(obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_(obj)) {
      return cljs.core.list.cljs$lang$arity$1([cljs.core.str(function() {
        var temp__3974__auto____9750 = cljs.core.namespace(obj);
        if(cljs.core.truth_(temp__3974__auto____9750)) {
          var nspc__9751 = temp__3974__auto____9750;
          return[cljs.core.str(nspc__9751), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name(obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.cljs$lang$arity$1(cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? goog.string.quote(obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9752 = function(keyval) {
    return cljs.core.pr_sequential(cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential(pr_pair__9752, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.cljs$lang$arity$3("#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.cljs$lang$arity$1("()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize__9754 = function(n, len) {
    var ns__9753 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count(ns__9753) < len) {
        var G__9756 = [cljs.core.str("0"), cljs.core.str(ns__9753)].join("");
        ns__9753 = G__9756;
        continue
      }else {
        return ns__9753
      }
      break
    }
  };
  return cljs.core.list.cljs$lang$arity$1([cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__9754.cljs$lang$arity$2 ? normalize__9754.cljs$lang$arity$2(d.getUTCMonth() + 1, 2) : normalize__9754.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__9754.cljs$lang$arity$2 ? normalize__9754.cljs$lang$arity$2(d.getUTCDate(), 2) : normalize__9754.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__9754.cljs$lang$arity$2 ? 
  normalize__9754.cljs$lang$arity$2(d.getUTCHours(), 2) : normalize__9754.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9754.cljs$lang$arity$2 ? normalize__9754.cljs$lang$arity$2(d.getUTCMinutes(), 2) : normalize__9754.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9754.cljs$lang$arity$2 ? normalize__9754.cljs$lang$arity$2(d.getUTCSeconds(), 2) : normalize__9754.call(null, d.getUTCSeconds(), 2)), cljs.core.str("."), cljs.core.str(normalize__9754.cljs$lang$arity$2 ? 
  normalize__9754.cljs$lang$arity$2(d.getUTCMilliseconds(), 3) : normalize__9754.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9755 = function(keyval) {
    return cljs.core.pr_sequential(cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential(pr_pair__9755, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.cljs$lang$arity$2(x, y)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690809856
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__9757 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__9758 = this;
  var G__9759__9760 = cljs.core.seq(this__9758.watches);
  if(G__9759__9760) {
    var G__9762__9764 = cljs.core.first(G__9759__9760);
    var vec__9763__9765 = G__9762__9764;
    var key__9766 = cljs.core.nth.cljs$lang$arity$3(vec__9763__9765, 0, null);
    var f__9767 = cljs.core.nth.cljs$lang$arity$3(vec__9763__9765, 1, null);
    var G__9759__9768 = G__9759__9760;
    var G__9762__9769 = G__9762__9764;
    var G__9759__9770 = G__9759__9768;
    while(true) {
      var vec__9771__9772 = G__9762__9769;
      var key__9773 = cljs.core.nth.cljs$lang$arity$3(vec__9771__9772, 0, null);
      var f__9774 = cljs.core.nth.cljs$lang$arity$3(vec__9771__9772, 1, null);
      var G__9759__9775 = G__9759__9770;
      f__9774.cljs$lang$arity$4 ? f__9774.cljs$lang$arity$4(key__9773, this$, oldval, newval) : f__9774.call(null, key__9773, this$, oldval, newval);
      var temp__3974__auto____9776 = cljs.core.next(G__9759__9775);
      if(temp__3974__auto____9776) {
        var G__9759__9777 = temp__3974__auto____9776;
        var G__9784 = cljs.core.first(G__9759__9777);
        var G__9785 = G__9759__9777;
        G__9762__9769 = G__9784;
        G__9759__9770 = G__9785;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__9778 = this;
  return this$.watches = cljs.core.assoc.cljs$lang$arity$3(this__9778.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__9779 = this;
  return this$.watches = cljs.core.dissoc.cljs$lang$arity$2(this__9779.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__9780 = this;
  return cljs.core.concat.cljs$lang$arity$variadic(cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq(this__9780.state, opts), cljs.core.array_seq([">"], 0))
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__9781 = this;
  return this__9781.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9782 = this;
  return this__9782.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__9783 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__9797__delegate = function(x, p__9786) {
      var map__9792__9793 = p__9786;
      var map__9792__9794 = cljs.core.seq_QMARK_(map__9792__9793) ? cljs.core.apply.cljs$lang$arity$2(cljs.core.hash_map, map__9792__9793) : map__9792__9793;
      var validator__9795 = cljs.core._lookup.cljs$lang$arity$3(map__9792__9794, "\ufdd0'validator", null);
      var meta__9796 = cljs.core._lookup.cljs$lang$arity$3(map__9792__9794, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__9796, validator__9795, null)
    };
    var G__9797 = function(x, var_args) {
      var p__9786 = null;
      if(goog.isDef(var_args)) {
        p__9786 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9797__delegate.call(this, x, p__9786)
    };
    G__9797.cljs$lang$maxFixedArity = 1;
    G__9797.cljs$lang$applyTo = function(arglist__9798) {
      var x = cljs.core.first(arglist__9798);
      var p__9786 = cljs.core.rest(arglist__9798);
      return G__9797__delegate(x, p__9786)
    };
    G__9797.cljs$lang$arity$variadic = G__9797__delegate;
    return G__9797
  }();
  atom = function(x, var_args) {
    var p__9786 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto____9802 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____9802)) {
    var validate__9803 = temp__3974__auto____9802;
    if(cljs.core.truth_(validate__9803.cljs$lang$arity$1 ? validate__9803.cljs$lang$arity$1(new_value) : validate__9803.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))], 0)))].join(""));
    }
  }else {
  }
  var old_value__9804 = a.state;
  a.state = new_value;
  cljs.core._notify_watches(a, old_value__9804, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_(a, f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(a.state) : f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_(a, f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(a.state, x) : f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_(a, f.cljs$lang$arity$3 ? f.cljs$lang$arity$3(a.state, x, y) : f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_(a, f.cljs$lang$arity$4 ? f.cljs$lang$arity$4(a.state, x, y, z) : f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__9805__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_(a, cljs.core.apply.cljs$lang$arity$variadic(f, a.state, x, y, z, cljs.core.array_seq([more], 0)))
    };
    var G__9805 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__9805__delegate.call(this, a, f, x, y, z, more)
    };
    G__9805.cljs$lang$maxFixedArity = 5;
    G__9805.cljs$lang$applyTo = function(arglist__9806) {
      var a = cljs.core.first(arglist__9806);
      var f = cljs.core.first(cljs.core.next(arglist__9806));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9806)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9806))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9806)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9806)))));
      return G__9805__delegate(a, f, x, y, z, more)
    };
    G__9805.cljs$lang$arity$variadic = G__9805__delegate;
    return G__9805
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.cljs$lang$arity$2(a.state, oldval)) {
    cljs.core.reset_BANG_(a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref(o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.cljs$lang$arity$3(f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__9807) {
    var iref = cljs.core.first(arglist__9807);
    var f = cljs.core.first(cljs.core.next(arglist__9807));
    var args = cljs.core.rest(cljs.core.next(arglist__9807));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch(iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch(iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.cljs$lang$arity$1("G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.cljs$lang$arity$1(0)
    }else {
    }
    return cljs.core.symbol.cljs$lang$arity$1([cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.cljs$lang$arity$2(cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073774592
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__9808 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref(this__9808.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9809 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.cljs$lang$arity$2(this__9809.state, function(p__9810) {
    var map__9811__9812 = p__9810;
    var map__9811__9813 = cljs.core.seq_QMARK_(map__9811__9812) ? cljs.core.apply.cljs$lang$arity$2(cljs.core.hash_map, map__9811__9812) : map__9811__9812;
    var curr_state__9814 = map__9811__9813;
    var done__9815 = cljs.core._lookup.cljs$lang$arity$3(map__9811__9813, "\ufdd0'done", null);
    if(cljs.core.truth_(done__9815)) {
      return curr_state__9814
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__9809.f.cljs$lang$arity$0 ? this__9809.f.cljs$lang$arity$0() : this__9809.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_(cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_(x)) {
    return cljs.core.deref(x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_(d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__9836__9837 = options;
    var map__9836__9838 = cljs.core.seq_QMARK_(map__9836__9837) ? cljs.core.apply.cljs$lang$arity$2(cljs.core.hash_map, map__9836__9837) : map__9836__9837;
    var keywordize_keys__9839 = cljs.core._lookup.cljs$lang$arity$3(map__9836__9838, "\ufdd0'keywordize-keys", null);
    var keyfn__9840 = cljs.core.truth_(keywordize_keys__9839) ? cljs.core.keyword : cljs.core.str;
    var f__9855 = function thisfn(x) {
      if(cljs.core.seq_QMARK_(x)) {
        return cljs.core.doall.cljs$lang$arity$1(cljs.core.map.cljs$lang$arity$2(thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_(x)) {
          return cljs.core.into(cljs.core.empty(x), cljs.core.map.cljs$lang$arity$2(thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray(x))) {
            return cljs.core.vec(cljs.core.map.cljs$lang$arity$2(thisfn, x))
          }else {
            if(cljs.core.type(x) === Object) {
              return cljs.core.into(cljs.core.ObjMap.EMPTY, function() {
                var iter__2462__auto____9854 = function iter__9848(s__9849) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__9849__9852 = s__9849;
                    while(true) {
                      if(cljs.core.seq(s__9849__9852)) {
                        var k__9853 = cljs.core.first(s__9849__9852);
                        return cljs.core.cons(cljs.core.PersistentVector.fromArray([keyfn__9840.cljs$lang$arity$1 ? keyfn__9840.cljs$lang$arity$1(k__9853) : keyfn__9840.call(null, k__9853), thisfn(x[k__9853])], true), iter__9848(cljs.core.rest(s__9849__9852)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2462__auto____9854.cljs$lang$arity$1 ? iter__2462__auto____9854.cljs$lang$arity$1(cljs.core.js_keys(x)) : iter__2462__auto____9854.call(null, cljs.core.js_keys(x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__9855.cljs$lang$arity$1 ? f__9855.cljs$lang$arity$1(x) : f__9855.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__9856) {
    var x = cljs.core.first(arglist__9856);
    var options = cljs.core.rest(arglist__9856);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__9861 = cljs.core.atom.cljs$lang$arity$1(cljs.core.ObjMap.EMPTY);
  return function() {
    var G__9865__delegate = function(args) {
      var temp__3971__auto____9862 = cljs.core._lookup.cljs$lang$arity$3(cljs.core.deref(mem__9861), args, null);
      if(cljs.core.truth_(temp__3971__auto____9862)) {
        var v__9863 = temp__3971__auto____9862;
        return v__9863
      }else {
        var ret__9864 = cljs.core.apply.cljs$lang$arity$2(f, args);
        cljs.core.swap_BANG_.cljs$lang$arity$4(mem__9861, cljs.core.assoc, args, ret__9864);
        return ret__9864
      }
    };
    var G__9865 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9865__delegate.call(this, args)
    };
    G__9865.cljs$lang$maxFixedArity = 0;
    G__9865.cljs$lang$applyTo = function(arglist__9866) {
      var args = cljs.core.seq(arglist__9866);
      return G__9865__delegate(args)
    };
    G__9865.cljs$lang$arity$variadic = G__9865__delegate;
    return G__9865
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__9868 = f.cljs$lang$arity$0 ? f.cljs$lang$arity$0() : f.call(null);
      if(cljs.core.fn_QMARK_(ret__9868)) {
        var G__9869 = ret__9868;
        f = G__9869;
        continue
      }else {
        return ret__9868
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__9870__delegate = function(f, args) {
      return trampoline.cljs$lang$arity$1(function() {
        return cljs.core.apply.cljs$lang$arity$2(f, args)
      })
    };
    var G__9870 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9870__delegate.call(this, f, args)
    };
    G__9870.cljs$lang$maxFixedArity = 1;
    G__9870.cljs$lang$applyTo = function(arglist__9871) {
      var f = cljs.core.first(arglist__9871);
      var args = cljs.core.rest(arglist__9871);
      return G__9870__delegate(f, args)
    };
    G__9870.cljs$lang$arity$variadic = G__9870__delegate;
    return G__9870
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.cljs$lang$arity$1(1)
  };
  var rand__1 = function(n) {
    return(Math.random.cljs$lang$arity$0 ? Math.random.cljs$lang$arity$0() : Math.random.call(null)) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.cljs$lang$arity$1 ? Math.floor.cljs$lang$arity$1((Math.random.cljs$lang$arity$0 ? Math.random.cljs$lang$arity$0() : Math.random.call(null)) * n) : Math.floor.call(null, (Math.random.cljs$lang$arity$0 ? Math.random.cljs$lang$arity$0() : Math.random.call(null)) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.cljs$lang$arity$2(coll, cljs.core.rand_int(cljs.core.count(coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.cljs$lang$arity$3(function(ret, x) {
    var k__9873 = f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(x) : f.call(null, x);
    return cljs.core.assoc.cljs$lang$arity$3(ret, k__9873, cljs.core.conj.cljs$lang$arity$2(cljs.core._lookup.cljs$lang$arity$3(ret, k__9873, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.cljs$lang$arity$1(cljs.core.make_hierarchy());
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.cljs$lang$arity$3(cljs.core.deref(cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto____9882 = cljs.core._EQ_.cljs$lang$arity$2(child, parent);
    if(or__3824__auto____9882) {
      return or__3824__auto____9882
    }else {
      var or__3824__auto____9883 = cljs.core.contains_QMARK_((new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____9883) {
        return or__3824__auto____9883
      }else {
        var and__3822__auto____9884 = cljs.core.vector_QMARK_(parent);
        if(and__3822__auto____9884) {
          var and__3822__auto____9885 = cljs.core.vector_QMARK_(child);
          if(and__3822__auto____9885) {
            var and__3822__auto____9886 = cljs.core.count(parent) === cljs.core.count(child);
            if(and__3822__auto____9886) {
              var ret__9887 = true;
              var i__9888 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____9889 = cljs.core.not(ret__9887);
                  if(or__3824__auto____9889) {
                    return or__3824__auto____9889
                  }else {
                    return i__9888 === cljs.core.count(parent)
                  }
                }()) {
                  return ret__9887
                }else {
                  var G__9890 = isa_QMARK_.cljs$lang$arity$3(h, child.cljs$lang$arity$1 ? child.cljs$lang$arity$1(i__9888) : child.call(null, i__9888), parent.cljs$lang$arity$1 ? parent.cljs$lang$arity$1(i__9888) : parent.call(null, i__9888));
                  var G__9891 = i__9888 + 1;
                  ret__9887 = G__9890;
                  i__9888 = G__9891;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____9886
            }
          }else {
            return and__3822__auto____9885
          }
        }else {
          return and__3822__auto____9884
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.cljs$lang$arity$2(cljs.core.deref(cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty(cljs.core._lookup.cljs$lang$arity$3((new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.cljs$lang$arity$2(cljs.core.deref(cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty(cljs.core._lookup.cljs$lang$arity$3((new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.cljs$lang$arity$2(cljs.core.deref(cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty(cljs.core._lookup.cljs$lang$arity$3((new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace(parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6724))], 0)))].join(""));
    }
    cljs.core.swap_BANG_.cljs$lang$arity$4(cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.cljs$lang$arity$2(tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6728))], 0)))].join(""));
    }
    var tp__9900 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__9901 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__9902 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__9903 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.cljs$lang$arity$3(function(ret, k) {
        return cljs.core.assoc.cljs$lang$arity$3(ret, k, cljs.core.reduce.cljs$lang$arity$3(cljs.core.conj, cljs.core._lookup.cljs$lang$arity$3(targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons(target, targets.cljs$lang$arity$1 ? targets.cljs$lang$arity$1(target) : targets.call(null, target))))
      }, m, cljs.core.cons(source, sources.cljs$lang$arity$1 ? sources.cljs$lang$arity$1(source) : sources.call(null, source)))
    };
    var or__3824__auto____9904 = cljs.core.contains_QMARK_(tp__9900.cljs$lang$arity$1 ? tp__9900.cljs$lang$arity$1(tag) : tp__9900.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_(ta__9902.cljs$lang$arity$1 ? ta__9902.cljs$lang$arity$1(tag) : ta__9902.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_(ta__9902.cljs$lang$arity$1 ? ta__9902.cljs$lang$arity$1(parent) : ta__9902.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.cljs$lang$arity$3((new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.cljs$lang$arity$2(cljs.core._lookup.cljs$lang$arity$3(tp__9900, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__9903.cljs$lang$arity$5 ? tf__9903.cljs$lang$arity$5((new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__9901, parent, 
      ta__9902) : tf__9903.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__9901, parent, ta__9902), "\ufdd0'descendants":tf__9903.cljs$lang$arity$5 ? tf__9903.cljs$lang$arity$5((new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__9902, tag, td__9901) : tf__9903.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__9902, tag, td__9901)})
    }();
    if(cljs.core.truth_(or__3824__auto____9904)) {
      return or__3824__auto____9904
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.cljs$lang$arity$4(cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__9909 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__9910 = cljs.core.truth_(parentMap__9909.cljs$lang$arity$1 ? parentMap__9909.cljs$lang$arity$1(tag) : parentMap__9909.call(null, tag)) ? cljs.core.disj.cljs$lang$arity$2(parentMap__9909.cljs$lang$arity$1 ? parentMap__9909.cljs$lang$arity$1(tag) : parentMap__9909.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__9911 = cljs.core.truth_(cljs.core.not_empty(childsParents__9910)) ? cljs.core.assoc.cljs$lang$arity$3(parentMap__9909, tag, childsParents__9910) : cljs.core.dissoc.cljs$lang$arity$2(parentMap__9909, tag);
    var deriv_seq__9912 = cljs.core.flatten(cljs.core.map.cljs$lang$arity$2(function(p1__9892_SHARP_) {
      return cljs.core.cons(cljs.core.first(p1__9892_SHARP_), cljs.core.interpose(cljs.core.first(p1__9892_SHARP_), cljs.core.second(p1__9892_SHARP_)))
    }, cljs.core.seq(newParents__9911)));
    if(cljs.core.contains_QMARK_(parentMap__9909.cljs$lang$arity$1 ? parentMap__9909.cljs$lang$arity$1(tag) : parentMap__9909.call(null, tag), parent)) {
      return cljs.core.reduce.cljs$lang$arity$3(function(p1__9893_SHARP_, p2__9894_SHARP_) {
        return cljs.core.apply.cljs$lang$arity$3(cljs.core.derive, p1__9893_SHARP_, p2__9894_SHARP_)
      }, cljs.core.make_hierarchy(), cljs.core.partition.cljs$lang$arity$2(2, deriv_seq__9912))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.cljs$lang$arity$2(method_cache, function(_) {
    return cljs.core.deref(method_table)
  });
  return cljs.core.swap_BANG_.cljs$lang$arity$2(cached_hierarchy, function(_) {
    return cljs.core.deref(hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__9920 = cljs.core.deref(prefer_table).call(null, x);
  var or__3824__auto____9922 = cljs.core.truth_(function() {
    var and__3822__auto____9921 = xprefs__9920;
    if(cljs.core.truth_(and__3822__auto____9921)) {
      return xprefs__9920.cljs$lang$arity$1 ? xprefs__9920.cljs$lang$arity$1(y) : xprefs__9920.call(null, y)
    }else {
      return and__3822__auto____9921
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____9922)) {
    return or__3824__auto____9922
  }else {
    var or__3824__auto____9924 = function() {
      var ps__9923 = cljs.core.parents.cljs$lang$arity$1(y);
      while(true) {
        if(cljs.core.count(ps__9923) > 0) {
          if(cljs.core.truth_(prefers_STAR_(x, cljs.core.first(ps__9923), prefer_table))) {
          }else {
          }
          var G__9927 = cljs.core.rest(ps__9923);
          ps__9923 = G__9927;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____9924)) {
      return or__3824__auto____9924
    }else {
      var or__3824__auto____9926 = function() {
        var ps__9925 = cljs.core.parents.cljs$lang$arity$1(x);
        while(true) {
          if(cljs.core.count(ps__9925) > 0) {
            if(cljs.core.truth_(prefers_STAR_(cljs.core.first(ps__9925), y, prefer_table))) {
            }else {
            }
            var G__9928 = cljs.core.rest(ps__9925);
            ps__9925 = G__9928;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____9926)) {
        return or__3824__auto____9926
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____9930 = cljs.core.prefers_STAR_(x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____9930)) {
    return or__3824__auto____9930
  }else {
    return cljs.core.isa_QMARK_.cljs$lang$arity$2(x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__9948 = cljs.core.reduce.cljs$lang$arity$3(function(be, p__9940) {
    var vec__9941__9942 = p__9940;
    var k__9943 = cljs.core.nth.cljs$lang$arity$3(vec__9941__9942, 0, null);
    var ___9944 = cljs.core.nth.cljs$lang$arity$3(vec__9941__9942, 1, null);
    var e__9945 = vec__9941__9942;
    if(cljs.core.isa_QMARK_.cljs$lang$arity$2(dispatch_val, k__9943)) {
      var be2__9947 = cljs.core.truth_(function() {
        var or__3824__auto____9946 = be == null;
        if(or__3824__auto____9946) {
          return or__3824__auto____9946
        }else {
          return cljs.core.dominates(k__9943, cljs.core.first(be), prefer_table)
        }
      }()) ? e__9945 : be;
      if(cljs.core.truth_(cljs.core.dominates(cljs.core.first(be2__9947), k__9943, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__9943), cljs.core.str(" and "), cljs.core.str(cljs.core.first(be2__9947)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__9947
    }else {
      return be
    }
  }, null, cljs.core.deref(method_table));
  if(cljs.core.truth_(best_entry__9948)) {
    if(cljs.core._EQ_.cljs$lang$arity$2(cljs.core.deref(cached_hierarchy), cljs.core.deref(hierarchy))) {
      cljs.core.swap_BANG_.cljs$lang$arity$4(method_cache, cljs.core.assoc, dispatch_val, cljs.core.second(best_entry__9948));
      return cljs.core.second(best_entry__9948)
    }else {
      cljs.core.reset_cache(method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3822__auto____9953 = mf;
    if(and__3822__auto____9953) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____9953
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2363__auto____9954 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9955 = cljs.core._reset[goog.typeOf(x__2363__auto____9954)];
      if(or__3824__auto____9955) {
        return or__3824__auto____9955
      }else {
        var or__3824__auto____9956 = cljs.core._reset["_"];
        if(or__3824__auto____9956) {
          return or__3824__auto____9956
        }else {
          throw cljs.core.missing_protocol("IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____9961 = mf;
    if(and__3822__auto____9961) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____9961
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2363__auto____9962 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9963 = cljs.core._add_method[goog.typeOf(x__2363__auto____9962)];
      if(or__3824__auto____9963) {
        return or__3824__auto____9963
      }else {
        var or__3824__auto____9964 = cljs.core._add_method["_"];
        if(or__3824__auto____9964) {
          return or__3824__auto____9964
        }else {
          throw cljs.core.missing_protocol("IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____9969 = mf;
    if(and__3822__auto____9969) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____9969
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____9970 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9971 = cljs.core._remove_method[goog.typeOf(x__2363__auto____9970)];
      if(or__3824__auto____9971) {
        return or__3824__auto____9971
      }else {
        var or__3824__auto____9972 = cljs.core._remove_method["_"];
        if(or__3824__auto____9972) {
          return or__3824__auto____9972
        }else {
          throw cljs.core.missing_protocol("IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____9977 = mf;
    if(and__3822__auto____9977) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____9977
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2363__auto____9978 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9979 = cljs.core._prefer_method[goog.typeOf(x__2363__auto____9978)];
      if(or__3824__auto____9979) {
        return or__3824__auto____9979
      }else {
        var or__3824__auto____9980 = cljs.core._prefer_method["_"];
        if(or__3824__auto____9980) {
          return or__3824__auto____9980
        }else {
          throw cljs.core.missing_protocol("IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____9985 = mf;
    if(and__3822__auto____9985) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____9985
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____9986 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9987 = cljs.core._get_method[goog.typeOf(x__2363__auto____9986)];
      if(or__3824__auto____9987) {
        return or__3824__auto____9987
      }else {
        var or__3824__auto____9988 = cljs.core._get_method["_"];
        if(or__3824__auto____9988) {
          return or__3824__auto____9988
        }else {
          throw cljs.core.missing_protocol("IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____9993 = mf;
    if(and__3822__auto____9993) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____9993
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2363__auto____9994 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9995 = cljs.core._methods[goog.typeOf(x__2363__auto____9994)];
      if(or__3824__auto____9995) {
        return or__3824__auto____9995
      }else {
        var or__3824__auto____9996 = cljs.core._methods["_"];
        if(or__3824__auto____9996) {
          return or__3824__auto____9996
        }else {
          throw cljs.core.missing_protocol("IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____10001 = mf;
    if(and__3822__auto____10001) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____10001
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2363__auto____10002 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10003 = cljs.core._prefers[goog.typeOf(x__2363__auto____10002)];
      if(or__3824__auto____10003) {
        return or__3824__auto____10003
      }else {
        var or__3824__auto____10004 = cljs.core._prefers["_"];
        if(or__3824__auto____10004) {
          return or__3824__auto____10004
        }else {
          throw cljs.core.missing_protocol("IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____10009 = mf;
    if(and__3822__auto____10009) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____10009
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2363__auto____10010 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10011 = cljs.core._dispatch[goog.typeOf(x__2363__auto____10010)];
      if(or__3824__auto____10011) {
        return or__3824__auto____10011
      }else {
        var or__3824__auto____10012 = cljs.core._dispatch["_"];
        if(or__3824__auto____10012) {
          return or__3824__auto____10012
        }else {
          throw cljs.core.missing_protocol("IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__10015 = cljs.core.apply.cljs$lang$arity$2(dispatch_fn, args);
  var target_fn__10016 = cljs.core._get_method(mf, dispatch_val__10015);
  if(cljs.core.truth_(target_fn__10016)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__10015)].join(""));
  }
  return cljs.core.apply.cljs$lang$arity$2(target_fn__10016, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 64
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10017 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__10018 = this;
  cljs.core.swap_BANG_.cljs$lang$arity$2(this__10018.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.cljs$lang$arity$2(this__10018.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.cljs$lang$arity$2(this__10018.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.cljs$lang$arity$2(this__10018.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__10019 = this;
  cljs.core.swap_BANG_.cljs$lang$arity$4(this__10019.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache(this__10019.method_cache, this__10019.method_table, this__10019.cached_hierarchy, this__10019.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__10020 = this;
  cljs.core.swap_BANG_.cljs$lang$arity$3(this__10020.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache(this__10020.method_cache, this__10020.method_table, this__10020.cached_hierarchy, this__10020.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__10021 = this;
  if(cljs.core._EQ_.cljs$lang$arity$2(cljs.core.deref(this__10021.cached_hierarchy), cljs.core.deref(this__10021.hierarchy))) {
  }else {
    cljs.core.reset_cache(this__10021.method_cache, this__10021.method_table, this__10021.cached_hierarchy, this__10021.hierarchy)
  }
  var temp__3971__auto____10022 = cljs.core.deref(this__10021.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____10022)) {
    var target_fn__10023 = temp__3971__auto____10022;
    return target_fn__10023
  }else {
    var temp__3971__auto____10024 = cljs.core.find_and_cache_best_method(this__10021.name, dispatch_val, this__10021.hierarchy, this__10021.method_table, this__10021.prefer_table, this__10021.method_cache, this__10021.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____10024)) {
      var target_fn__10025 = temp__3971__auto____10024;
      return target_fn__10025
    }else {
      return cljs.core.deref(this__10021.method_table).call(null, this__10021.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__10026 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_(dispatch_val_x, dispatch_val_y, this__10026.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__10026.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.cljs$lang$arity$2(this__10026.prefer_table, function(old) {
    return cljs.core.assoc.cljs$lang$arity$3(old, dispatch_val_x, cljs.core.conj.cljs$lang$arity$2(cljs.core._lookup.cljs$lang$arity$3(old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache(this__10026.method_cache, this__10026.method_table, this__10026.cached_hierarchy, this__10026.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__10027 = this;
  return cljs.core.deref(this__10027.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__10028 = this;
  return cljs.core.deref(this__10028.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__10029 = this;
  return cljs.core.do_dispatch(mf, this__10029.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__10031__delegate = function(_, args) {
    var self__10030 = this;
    return cljs.core._dispatch(self__10030, args)
  };
  var G__10031 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__10031__delegate.call(this, _, args)
  };
  G__10031.cljs$lang$maxFixedArity = 1;
  G__10031.cljs$lang$applyTo = function(arglist__10032) {
    var _ = cljs.core.first(arglist__10032);
    var args = cljs.core.rest(arglist__10032);
    return G__10031__delegate(_, args)
  };
  G__10031.cljs$lang$arity$variadic = G__10031__delegate;
  return G__10031
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__10033 = this;
  return cljs.core._dispatch(self__10033, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset(multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method(multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method(multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods(multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method(multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers(multifn)
};
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 543162368
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10034 = this;
  return goog.string.hashCode(cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this$], 0)))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_10036, _) {
  var this__10035 = this;
  return cljs.core.list.cljs$lang$arity$1([cljs.core.str('#uuid "'), cljs.core.str(this__10035.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__10037 = this;
  var and__3822__auto____10038 = cljs.core.instance_QMARK_(cljs.core.UUID, other);
  if(and__3822__auto____10038) {
    return this__10037.uuid === other.uuid
  }else {
    return and__3822__auto____10038
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__10039 = this;
  var this__10040 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__10040], 0))
};
cljs.core.UUID;
goog.provide("vapor_cljs.vapor");
goog.require("cljs.core");
