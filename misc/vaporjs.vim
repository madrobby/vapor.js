"Vim syntax file
"New Amaging JavaScript Framework - Vapor.js

if version < 600
   syntax clear
elseif exists("b:current_syntax")
   finish
endif
syn clear

runtime! syntax/javascript.vim

let b:current_syntax = "vaporjs"
