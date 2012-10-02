# vapor-cljs is a new amazing ClojureScript framework.

In just 0 lines of code it provides:

## Usage: 
```html
<script src="vapor-cljs.min.js"></script>
```
or

```html
<script src="main.js"></script>
<script src="vapor-cljs.js"></script>
```
if you're using the non-minified version.

On modern browsers, you can inline it with a data URL:

```html
<script src="data:application/javascript,"></script>
```

Alternatively, inline the whole code, like this:

```html
<script></script>
```

(In this case, you can also omit the `<script>` tag completely for the ultimate in optimizations and efficiency!)

## Building
```bash
$ lein cljsbuild once
```
Will output "vapor-cljs.min.js" and "vapor-cljs.js" into the root project directory. They've been minified using the google clojure compiler.

## Contributors
This ClojureScript fork of vaporjs has been contributed by [Ravi Kotecha](http://twitter.com/r4vi)

Visit our [website](http://vaporjs.com)

Please fork now and contribute, and keep up to date on [Twitter](http://twitter.com/vapor_js)!

