(defproject vapor-cljs "1.0"
  :description "The World's Smallest & Fastest ClojureScript Library"
  :url "http://vapor.js"          
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dependencies [[org.clojure/clojure "1.4.0"]]
  :plugins [[lein-cljsbuild "0.2.7"]]
  :cljsbuild {
              :builds {:prod {:source-path "src"
                        :compiler {:output-to "vapor-cljs.min.js"
                                   :optimizations :advanced
                                   :pretty-print false}}
                       :dev {:source-path "src"
                              :output-to "vapor-cljs.js"
                              :optimizations :whitespace
                              :pretty-print true}}})
