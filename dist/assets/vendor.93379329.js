function H(t){return typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?H=function(e){return typeof e}:H=function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},H(t)}function an(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function Ot(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r)}}function sn(t,e,n){return e&&Ot(t.prototype,e),n&&Ot(t,n),t}function on(t,e,n){return e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function m(t){for(var e=1;e<arguments.length;e++){var n=arguments[e]!=null?arguments[e]:{},r=Object.keys(n);typeof Object.getOwnPropertySymbols=="function"&&(r=r.concat(Object.getOwnPropertySymbols(n).filter(function(i){return Object.getOwnPropertyDescriptor(n,i).enumerable}))),r.forEach(function(i){on(t,i,n[i])})}return t}function Ee(t,e){return fn(t)||cn(t,e)||hn()}function Te(t){return ln(t)||un(t)||dn()}function ln(t){if(Array.isArray(t)){for(var e=0,n=new Array(t.length);e<t.length;e++)n[e]=t[e];return n}}function fn(t){if(Array.isArray(t))return t}function un(t){if(Symbol.iterator in Object(t)||Object.prototype.toString.call(t)==="[object Arguments]")return Array.from(t)}function cn(t,e){var n=[],r=!0,i=!1,a=void 0;try{for(var s=t[Symbol.iterator](),o;!(r=(o=s.next()).done)&&(n.push(o.value),!(e&&n.length===e));r=!0);}catch(l){i=!0,a=l}finally{try{!r&&s.return!=null&&s.return()}finally{if(i)throw a}}return n}function dn(){throw new TypeError("Invalid attempt to spread non-iterable instance")}function hn(){throw new TypeError("Invalid attempt to destructure non-iterable instance")}var Et=function(){},_e={},Tt={},_t=null,It={mark:Et,measure:Et};try{typeof window!="undefined"&&(_e=window),typeof document!="undefined"&&(Tt=document),typeof MutationObserver!="undefined"&&(_t=MutationObserver),typeof performance!="undefined"&&(It=performance)}catch(t){}var vn=_e.navigator||{},jt=vn.userAgent,Mt=jt===void 0?"":jt,j=_e,w=Tt,Nt=_t,ue=It;j.document;var E=!!w.documentElement&&!!w.head&&typeof w.addEventListener=="function"&&typeof w.createElement=="function",Lt=~Mt.indexOf("MSIE")||~Mt.indexOf("Trident/"),T="___FONT_AWESOME___",Ie=16,zt="fa",$t="svg-inline--fa",W="data-fa-i2svg",je="data-fa-pseudo-element",gn="data-fa-pseudo-element-pending",mn="data-prefix",pn="data-icon",Ft="fontawesome-i2svg",yn="async",bn=["HTML","HEAD","STYLE","SCRIPT"],wn=function(){try{return!0}catch(t){return!1}}(),xn={fas:"solid",far:"regular",fal:"light",fad:"duotone",fab:"brands",fa:"solid"},kn={solid:"fas",regular:"far",light:"fal",duotone:"fad",brands:"fab"},Dt="fa-layers-text",Sn=/Font Awesome 5 (Solid|Regular|Light|Duotone|Brands|Free|Pro)/,Rn={"900":"fas","400":"far",normal:"far","300":"fal"},Vt=[1,2,3,4,5,6,7,8,9,10],Pn=Vt.concat([11,12,13,14,15,16,17,18,19,20]),An=["class","data-prefix","data-icon","data-fa-transform","data-fa-mask"],$={GROUP:"group",SWAP_OPACITY:"swap-opacity",PRIMARY:"primary",SECONDARY:"secondary"},Cn=["xs","sm","lg","fw","ul","li","border","pull-left","pull-right","spin","pulse","rotate-90","rotate-180","rotate-270","flip-horizontal","flip-vertical","flip-both","stack","stack-1x","stack-2x","inverse","layers","layers-text","layers-counter",$.GROUP,$.SWAP_OPACITY,$.PRIMARY,$.SECONDARY].concat(Vt.map(function(t){return"".concat(t,"x")})).concat(Pn.map(function(t){return"w-".concat(t)})),Ut=j.FontAwesomeConfig||{};function On(t){var e=w.querySelector("script["+t+"]");if(e)return e.getAttribute(t)}function En(t){return t===""?!0:t==="false"?!1:t==="true"?!0:t}if(w&&typeof w.querySelector=="function"){var Tn=[["data-family-prefix","familyPrefix"],["data-replacement-class","replacementClass"],["data-auto-replace-svg","autoReplaceSvg"],["data-auto-add-css","autoAddCss"],["data-auto-a11y","autoA11y"],["data-search-pseudo-elements","searchPseudoElements"],["data-observe-mutations","observeMutations"],["data-mutate-approach","mutateApproach"],["data-keep-original-source","keepOriginalSource"],["data-measure-performance","measurePerformance"],["data-show-missing-icons","showMissingIcons"]];Tn.forEach(function(t){var e=Ee(t,2),n=e[0],r=e[1],i=En(On(n));i!=null&&(Ut[r]=i)})}var _n={familyPrefix:zt,replacementClass:$t,autoReplaceSvg:!0,autoAddCss:!0,autoA11y:!0,searchPseudoElements:!1,observeMutations:!0,mutateApproach:"async",keepOriginalSource:!0,measurePerformance:!1,showMissingIcons:!0},Me=m({},_n,Ut);Me.autoReplaceSvg||(Me.observeMutations=!1);var h=m({},Me);j.FontAwesomeConfig=h;var _=j||{};_[T]||(_[T]={});_[T].styles||(_[T].styles={});_[T].hooks||(_[T].hooks={});_[T].shims||(_[T].shims=[]);var C=_[T],Ht=[],In=function t(){w.removeEventListener("DOMContentLoaded",t),ce=1,Ht.map(function(e){return e()})},ce=!1;E&&(ce=(w.documentElement.doScroll?/^loaded|^c/:/^loaded|^i|^c/).test(w.readyState),ce||w.addEventListener("DOMContentLoaded",In));function jn(t){!E||(ce?setTimeout(t,0):Ht.push(t))}var Ne="pending",Wt="settled",de="fulfilled",he="rejected",Mn=function(){},Gt=typeof global!="undefined"&&typeof global.process!="undefined"&&typeof global.process.emit=="function",Nn=typeof setImmediate=="undefined"?setTimeout:setImmediate,K=[],Le;function Ln(){for(var t=0;t<K.length;t++)K[t][0](K[t][1]);K=[],Le=!1}function ve(t,e){K.push([t,e]),Le||(Le=!0,Nn(Ln,0))}function zn(t,e){function n(i){ze(e,i)}function r(i){J(e,i)}try{t(n,r)}catch(i){r(i)}}function Yt(t){var e=t.owner,n=e._state,r=e._data,i=t[n],a=t.then;if(typeof i=="function"){n=de;try{r=i(r)}catch(s){J(a,s)}}qt(a,r)||(n===de&&ze(a,r),n===he&&J(a,r))}function qt(t,e){var n;try{if(t===e)throw new TypeError("A promises callback cannot return that same promise.");if(e&&(typeof e=="function"||H(e)==="object")){var r=e.then;if(typeof r=="function")return r.call(e,function(i){n||(n=!0,e===i?Bt(t,i):ze(t,i))},function(i){n||(n=!0,J(t,i))}),!0}}catch(i){return n||J(t,i),!0}return!1}function ze(t,e){(t===e||!qt(t,e))&&Bt(t,e)}function Bt(t,e){t._state===Ne&&(t._state=Wt,t._data=e,ve($n,t))}function J(t,e){t._state===Ne&&(t._state=Wt,t._data=e,ve(Fn,t))}function Xt(t){t._then=t._then.forEach(Yt)}function $n(t){t._state=de,Xt(t)}function Fn(t){t._state=he,Xt(t),!t._handled&&Gt&&global.process.emit("unhandledRejection",t._data,t)}function Dn(t){global.process.emit("rejectionHandled",t)}function R(t){if(typeof t!="function")throw new TypeError("Promise resolver "+t+" is not a function");if(!(this instanceof R))throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");this._then=[],zn(t,this)}R.prototype={constructor:R,_state:Ne,_then:null,_data:void 0,_handled:!1,then:function(e,n){var r={owner:this,then:new this.constructor(Mn),fulfilled:e,rejected:n};return(n||e)&&!this._handled&&(this._handled=!0,this._state===he&&Gt&&ve(Dn,this)),this._state===de||this._state===he?ve(Yt,r):this._then.push(r),r.then},catch:function(e){return this.then(null,e)}};R.all=function(t){if(!Array.isArray(t))throw new TypeError("You must pass an array to Promise.all().");return new R(function(e,n){var r=[],i=0;function a(l){return i++,function(u){r[l]=u,--i||e(r)}}for(var s=0,o;s<t.length;s++)o=t[s],o&&typeof o.then=="function"?o.then(a(s),n):r[s]=o;i||e(r)})};R.race=function(t){if(!Array.isArray(t))throw new TypeError("You must pass an array to Promise.race().");return new R(function(e,n){for(var r=0,i;r<t.length;r++)i=t[r],i&&typeof i.then=="function"?i.then(e,n):e(i)})};R.resolve=function(t){return t&&H(t)==="object"&&t.constructor===R?t:new R(function(e){e(t)})};R.reject=function(t){return new R(function(e,n){n(t)})};var O=typeof Promise=="function"?Promise:R,M=Ie,I={size:16,x:0,y:0,rotate:0,flipX:!1,flipY:!1};function Vn(t){return~Cn.indexOf(t)}function Kt(t){if(!(!t||!E)){var e=w.createElement("style");e.setAttribute("type","text/css"),e.innerHTML=t;for(var n=w.head.childNodes,r=null,i=n.length-1;i>-1;i--){var a=n[i],s=(a.tagName||"").toUpperCase();["STYLE","LINK"].indexOf(s)>-1&&(r=a)}return w.head.insertBefore(e,r),t}}var Un="0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";function Q(){for(var t=12,e="";t-- >0;)e+=Un[Math.random()*62|0];return e}function G(t){for(var e=[],n=(t||[]).length>>>0;n--;)e[n]=t[n];return e}function $e(t){return t.classList?G(t.classList):(t.getAttribute("class")||"").split(" ").filter(function(e){return e})}function Hn(t,e){var n=e.split("-"),r=n[0],i=n.slice(1).join("-");return r===t&&i!==""&&!Vn(i)?i:null}function Jt(t){return"".concat(t).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&#39;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function Wn(t){return Object.keys(t||{}).reduce(function(e,n){return e+"".concat(n,'="').concat(Jt(t[n]),'" ')},"").trim()}function ge(t){return Object.keys(t||{}).reduce(function(e,n){return e+"".concat(n,": ").concat(t[n],";")},"")}function Fe(t){return t.size!==I.size||t.x!==I.x||t.y!==I.y||t.rotate!==I.rotate||t.flipX||t.flipY}function Qt(t){var e=t.transform,n=t.containerWidth,r=t.iconWidth,i={transform:"translate(".concat(n/2," 256)")},a="translate(".concat(e.x*32,", ").concat(e.y*32,") "),s="scale(".concat(e.size/16*(e.flipX?-1:1),", ").concat(e.size/16*(e.flipY?-1:1),") "),o="rotate(".concat(e.rotate," 0 0)"),l={transform:"".concat(a," ").concat(s," ").concat(o)},u={transform:"translate(".concat(r/2*-1," -256)")};return{outer:i,inner:l,path:u}}function Gn(t){var e=t.transform,n=t.width,r=n===void 0?Ie:n,i=t.height,a=i===void 0?Ie:i,s=t.startCentered,o=s===void 0?!1:s,l="";return o&&Lt?l+="translate(".concat(e.x/M-r/2,"em, ").concat(e.y/M-a/2,"em) "):o?l+="translate(calc(-50% + ".concat(e.x/M,"em), calc(-50% + ").concat(e.y/M,"em)) "):l+="translate(".concat(e.x/M,"em, ").concat(e.y/M,"em) "),l+="scale(".concat(e.size/M*(e.flipX?-1:1),", ").concat(e.size/M*(e.flipY?-1:1),") "),l+="rotate(".concat(e.rotate,"deg) "),l}var De={x:0,y:0,width:"100%",height:"100%"};function Zt(t){var e=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!0;return t.attributes&&(t.attributes.fill||e)&&(t.attributes.fill="black"),t}function Yn(t){return t.tag==="g"?t.children:[t]}function qn(t){var e=t.children,n=t.attributes,r=t.main,i=t.mask,a=t.transform,s=r.width,o=r.icon,l=i.width,u=i.icon,c=Qt({transform:a,containerWidth:l,iconWidth:s}),d={tag:"rect",attributes:m({},De,{fill:"white"})},g=o.children?{children:o.children.map(Zt)}:{},p={tag:"g",attributes:m({},c.inner),children:[Zt(m({tag:o.tag,attributes:m({},o.attributes,c.path)},g))]},y={tag:"g",attributes:m({},c.outer),children:[p]},b="mask-".concat(Q()),S="clip-".concat(Q()),P={tag:"mask",attributes:m({},De,{id:b,maskUnits:"userSpaceOnUse",maskContentUnits:"userSpaceOnUse"}),children:[d,y]},A={tag:"defs",children:[{tag:"clipPath",attributes:{id:S},children:Yn(u)},P]};return e.push(A,{tag:"rect",attributes:m({fill:"currentColor","clip-path":"url(#".concat(S,")"),mask:"url(#".concat(b,")")},De)}),{children:e,attributes:n}}function Bn(t){var e=t.children,n=t.attributes,r=t.main,i=t.transform,a=t.styles,s=ge(a);if(s.length>0&&(n.style=s),Fe(i)){var o=Qt({transform:i,containerWidth:r.width,iconWidth:r.width});e.push({tag:"g",attributes:m({},o.outer),children:[{tag:"g",attributes:m({},o.inner),children:[{tag:r.icon.tag,children:r.icon.children,attributes:m({},r.icon.attributes,o.path)}]}]})}else e.push(r.icon);return{children:e,attributes:n}}function Xn(t){var e=t.children,n=t.main,r=t.mask,i=t.attributes,a=t.styles,s=t.transform;if(Fe(s)&&n.found&&!r.found){var o=n.width,l=n.height,u={x:o/l/2,y:.5};i.style=ge(m({},a,{"transform-origin":"".concat(u.x+s.x/16,"em ").concat(u.y+s.y/16,"em")}))}return[{tag:"svg",attributes:i,children:e}]}function Kn(t){var e=t.prefix,n=t.iconName,r=t.children,i=t.attributes,a=t.symbol,s=a===!0?"".concat(e,"-").concat(h.familyPrefix,"-").concat(n):a;return[{tag:"svg",attributes:{style:"display: none;"},children:[{tag:"symbol",attributes:m({},i,{id:s}),children:r}]}]}function Ve(t){var e=t.icons,n=e.main,r=e.mask,i=t.prefix,a=t.iconName,s=t.transform,o=t.symbol,l=t.title,u=t.extra,c=t.watchable,d=c===void 0?!1:c,g=r.found?r:n,p=g.width,y=g.height,b="fa-w-".concat(Math.ceil(p/y*16)),S=[h.replacementClass,a?"".concat(h.familyPrefix,"-").concat(a):"",b].filter(function(nn){return u.classes.indexOf(nn)===-1}).concat(u.classes).join(" "),P={children:[],attributes:m({},u.attributes,{"data-prefix":i,"data-icon":a,class:S,role:u.attributes.role||"img",xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 ".concat(p," ").concat(y)})};d&&(P.attributes[W]=""),l&&P.children.push({tag:"title",attributes:{id:P.attributes["aria-labelledby"]||"title-".concat(Q())},children:[l]});var A=m({},P,{prefix:i,iconName:a,main:n,mask:r,transform:s,symbol:o,styles:u.styles}),U=r.found&&n.found?qn(A):Bn(A),Oe=U.children,rn=U.attributes;return A.children=Oe,A.attributes=rn,o?Kn(A):Xn(A)}function er(t){var e=t.content,n=t.width,r=t.height,i=t.transform,a=t.title,s=t.extra,o=t.watchable,l=o===void 0?!1:o,u=m({},s.attributes,a?{title:a}:{},{class:s.classes.join(" ")});l&&(u[W]="");var c=m({},s.styles);Fe(i)&&(c.transform=Gn({transform:i,startCentered:!0,width:n,height:r}),c["-webkit-transform"]=c.transform);var d=ge(c);d.length>0&&(u.style=d);var g=[];return g.push({tag:"span",attributes:u,children:[e]}),a&&g.push({tag:"span",attributes:{class:"sr-only"},children:[a]}),g}function Jn(t){var e=t.content,n=t.title,r=t.extra,i=m({},r.attributes,n?{title:n}:{},{class:r.classes.join(" ")}),a=ge(r.styles);a.length>0&&(i.style=a);var s=[];return s.push({tag:"span",attributes:i,children:[e]}),n&&s.push({tag:"span",attributes:{class:"sr-only"},children:[n]}),s}var tr=function(){},Ue=h.measurePerformance&&ue&&ue.mark&&ue.measure?ue:{mark:tr,measure:tr},Z='FA "5.11.2"',Qn=function(e){return Ue.mark("".concat(Z," ").concat(e," begins")),function(){return rr(e)}},rr=function(e){Ue.mark("".concat(Z," ").concat(e," ends")),Ue.measure("".concat(Z," ").concat(e),"".concat(Z," ").concat(e," begins"),"".concat(Z," ").concat(e," ends"))},He={begin:Qn,end:rr},Zn=function(e,n){return function(r,i,a,s){return e.call(n,r,i,a,s)}},We=function(e,n,r,i){var a=Object.keys(e),s=a.length,o=i!==void 0?Zn(n,i):n,l,u,c;for(r===void 0?(l=1,c=e[a[0]]):(l=0,c=r);l<s;l++)u=a[l],c=o(c,e[u],u,e);return c};function nr(t){for(var e="",n=0;n<t.length;n++){var r=t.charCodeAt(n).toString(16);e+=("000"+r).slice(-4)}return e}function ir(t,e){var n=arguments.length>2&&arguments[2]!==void 0?arguments[2]:{},r=n.skipHooks,i=r===void 0?!1:r,a=Object.keys(e).reduce(function(s,o){var l=e[o],u=!!l.icon;return u?s[l.iconName]=l.icon:s[o]=l,s},{});typeof C.hooks.addPack=="function"&&!i?C.hooks.addPack(t,a):C.styles[t]=m({},C.styles[t]||{},a),t==="fas"&&ir("fa",e)}var ar=C.styles,ei=C.shims,sr={},or={},lr={},fr=function(){var e=function(i){return We(ar,function(a,s,o){return a[o]=We(s,i,{}),a},{})};sr=e(function(r,i,a){return i[3]&&(r[i[3]]=a),r}),or=e(function(r,i,a){var s=i[2];return r[a]=a,s.forEach(function(o){r[o]=a}),r});var n="far"in ar;lr=We(ei,function(r,i){var a=i[0],s=i[1],o=i[2];return s==="far"&&!n&&(s="fas"),r[a]={prefix:s,iconName:o},r},{})};fr();function ur(t,e){return(sr[t]||{})[e]}function ti(t,e){return(or[t]||{})[e]}function ri(t){return lr[t]||{prefix:null,iconName:null}}var ni=C.styles,Ge=function(){return{prefix:null,iconName:null,rest:[]}};function Ye(t){return t.reduce(function(e,n){var r=Hn(h.familyPrefix,n);if(ni[n])e.prefix=n;else if(h.autoFetchSvg&&["fas","far","fal","fad","fab","fa"].indexOf(n)>-1)e.prefix=n;else if(r){var i=e.prefix==="fa"?ri(r):{};e.iconName=i.iconName||r,e.prefix=i.prefix||e.prefix}else n!==h.replacementClass&&n.indexOf("fa-w-")!==0&&e.rest.push(n);return e},Ge())}function cr(t,e,n){if(t&&t[e]&&t[e][n])return{prefix:e,iconName:n,icon:t[e][n]}}function Y(t){var e=t.tag,n=t.attributes,r=n===void 0?{}:n,i=t.children,a=i===void 0?[]:i;return typeof t=="string"?Jt(t):"<".concat(e," ").concat(Wn(r),">").concat(a.map(Y).join(""),"</").concat(e,">")}var ii=function(){};function dr(t){var e=t.getAttribute?t.getAttribute(W):null;return typeof e=="string"}function ai(){if(h.autoReplaceSvg===!0)return me.replace;var t=me[h.autoReplaceSvg];return t||me.replace}var me={replace:function(e){var n=e[0],r=e[1],i=r.map(function(s){return Y(s)}).join(`
`);if(n.parentNode&&n.outerHTML)n.outerHTML=i+(h.keepOriginalSource&&n.tagName.toLowerCase()!=="svg"?"<!-- ".concat(n.outerHTML," -->"):"");else if(n.parentNode){var a=document.createElement("span");n.parentNode.replaceChild(a,n),a.outerHTML=i}},nest:function(e){var n=e[0],r=e[1];if(~$e(n).indexOf(h.replacementClass))return me.replace(e);var i=new RegExp("".concat(h.familyPrefix,"-.*"));delete r[0].attributes.style,delete r[0].attributes.id;var a=r[0].attributes.class.split(" ").reduce(function(o,l){return l===h.replacementClass||l.match(i)?o.toSvg.push(l):o.toNode.push(l),o},{toNode:[],toSvg:[]});r[0].attributes.class=a.toSvg.join(" ");var s=r.map(function(o){return Y(o)}).join(`
`);n.setAttribute("class",a.toNode.join(" ")),n.setAttribute(W,""),n.innerHTML=s}};function hr(t){t()}function vr(t,e){var n=typeof e=="function"?e:ii;if(t.length===0)n();else{var r=hr;h.mutateApproach===yn&&(r=j.requestAnimationFrame||hr),r(function(){var i=ai(),a=He.begin("mutate");t.map(i),a(),n()})}}var qe=!1;function si(){qe=!0}function gr(){qe=!1}var pe=null;function oi(t){if(!!Nt&&!!h.observeMutations){var e=t.treeCallback,n=t.nodeCallback,r=t.pseudoElementsCallback,i=t.observeMutationsRoot,a=i===void 0?w:i;pe=new Nt(function(s){qe||G(s).forEach(function(o){if(o.type==="childList"&&o.addedNodes.length>0&&!dr(o.addedNodes[0])&&(h.searchPseudoElements&&r(o.target),e(o.target)),o.type==="attributes"&&o.target.parentNode&&h.searchPseudoElements&&r(o.target.parentNode),o.type==="attributes"&&dr(o.target)&&~An.indexOf(o.attributeName))if(o.attributeName==="class"){var l=Ye($e(o.target)),u=l.prefix,c=l.iconName;u&&o.target.setAttribute("data-prefix",u),c&&o.target.setAttribute("data-icon",c)}else n(o.target)})}),!!E&&pe.observe(a,{childList:!0,attributes:!0,characterData:!0,subtree:!0})}}function li(){!pe||pe.disconnect()}function fi(t){var e=t.getAttribute("style"),n=[];return e&&(n=e.split(";").reduce(function(r,i){var a=i.split(":"),s=a[0],o=a.slice(1);return s&&o.length>0&&(r[s]=o.join(":").trim()),r},{})),n}function ui(t){var e=t.getAttribute("data-prefix"),n=t.getAttribute("data-icon"),r=t.innerText!==void 0?t.innerText.trim():"",i=Ye($e(t));return e&&n&&(i.prefix=e,i.iconName=n),i.prefix&&r.length>1?i.iconName=ti(i.prefix,t.innerText):i.prefix&&r.length===1&&(i.iconName=ur(i.prefix,nr(t.innerText))),i}var mr=function(e){var n={size:16,x:0,y:0,flipX:!1,flipY:!1,rotate:0};return e?e.toLowerCase().split(" ").reduce(function(r,i){var a=i.toLowerCase().split("-"),s=a[0],o=a.slice(1).join("-");if(s&&o==="h")return r.flipX=!0,r;if(s&&o==="v")return r.flipY=!0,r;if(o=parseFloat(o),isNaN(o))return r;switch(s){case"grow":r.size=r.size+o;break;case"shrink":r.size=r.size-o;break;case"left":r.x=r.x-o;break;case"right":r.x=r.x+o;break;case"up":r.y=r.y-o;break;case"down":r.y=r.y+o;break;case"rotate":r.rotate=r.rotate+o;break}return r},n):n};function ci(t){return mr(t.getAttribute("data-fa-transform"))}function di(t){var e=t.getAttribute("data-fa-symbol");return e===null?!1:e===""?!0:e}function hi(t){var e=G(t.attributes).reduce(function(r,i){return r.name!=="class"&&r.name!=="style"&&(r[i.name]=i.value),r},{}),n=t.getAttribute("title");return h.autoA11y&&(n?e["aria-labelledby"]="".concat(h.replacementClass,"-title-").concat(Q()):(e["aria-hidden"]="true",e.focusable="false")),e}function vi(t){var e=t.getAttribute("data-fa-mask");return e?Ye(e.split(" ").map(function(n){return n.trim()})):Ge()}function gi(){return{iconName:null,title:null,prefix:null,transform:I,symbol:!1,mask:null,extra:{classes:[],styles:{},attributes:{}}}}function mi(t){var e=ui(t),n=e.iconName,r=e.prefix,i=e.rest,a=fi(t),s=ci(t),o=di(t),l=hi(t),u=vi(t);return{iconName:n,title:t.getAttribute("title"),prefix:r,transform:s,symbol:o,mask:u,extra:{classes:i,styles:a,attributes:l}}}function ee(t){this.name="MissingIcon",this.message=t||"Icon unavailable",this.stack=new Error().stack}ee.prototype=Object.create(Error.prototype);ee.prototype.constructor=ee;var ye={fill:"currentColor"},pr={attributeType:"XML",repeatCount:"indefinite",dur:"2s"},pi={tag:"path",attributes:m({},ye,{d:"M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"})},Be=m({},pr,{attributeName:"opacity"}),yi={tag:"circle",attributes:m({},ye,{cx:"256",cy:"364",r:"28"}),children:[{tag:"animate",attributes:m({},pr,{attributeName:"r",values:"28;14;28;28;14;28;"})},{tag:"animate",attributes:m({},Be,{values:"1;0;1;1;0;1;"})}]},bi={tag:"path",attributes:m({},ye,{opacity:"1",d:"M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"}),children:[{tag:"animate",attributes:m({},Be,{values:"1;0;0;0;0;1;"})}]},wi={tag:"path",attributes:m({},ye,{opacity:"0",d:"M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"}),children:[{tag:"animate",attributes:m({},Be,{values:"0;0;1;1;0;0;"})}]},xi={tag:"g",children:[pi,yi,bi,wi]},Xe=C.styles;function Ke(t){var e=t[0],n=t[1],r=t.slice(4),i=Ee(r,1),a=i[0],s=null;return Array.isArray(a)?s={tag:"g",attributes:{class:"".concat(h.familyPrefix,"-").concat($.GROUP)},children:[{tag:"path",attributes:{class:"".concat(h.familyPrefix,"-").concat($.SECONDARY),fill:"currentColor",d:a[0]}},{tag:"path",attributes:{class:"".concat(h.familyPrefix,"-").concat($.PRIMARY),fill:"currentColor",d:a[1]}}]}:s={tag:"path",attributes:{fill:"currentColor",d:a}},{found:!0,width:e,height:n,icon:s}}function Je(t,e){return new O(function(n,r){var i={found:!1,width:512,height:512,icon:xi};if(t&&e&&Xe[e]&&Xe[e][t]){var a=Xe[e][t];return n(Ke(a))}H(j.FontAwesomeKitConfig)==="object"&&typeof window.FontAwesomeKitConfig.token=="string"&&j.FontAwesomeKitConfig.token,t&&e&&!h.showMissingIcons?r(new ee("Icon is missing for prefix ".concat(e," with icon name ").concat(t))):n(i)})}var ki=C.styles;function Si(t,e){var n=e.iconName,r=e.title,i=e.prefix,a=e.transform,s=e.symbol,o=e.mask,l=e.extra;return new O(function(u,c){O.all([Je(n,i),Je(o.iconName,o.prefix)]).then(function(d){var g=Ee(d,2),p=g[0],y=g[1];u([t,Ve({icons:{main:p,mask:y},prefix:i,iconName:n,transform:a,symbol:s,mask:y,title:r,extra:l,watchable:!0})])})})}function Ri(t,e){var n=e.title,r=e.transform,i=e.extra,a=null,s=null;if(Lt){var o=parseInt(getComputedStyle(t).fontSize,10),l=t.getBoundingClientRect();a=l.width/o,s=l.height/o}return h.autoA11y&&!n&&(i.attributes["aria-hidden"]="true"),O.resolve([t,er({content:t.innerHTML,width:a,height:s,transform:r,title:n,extra:i,watchable:!0})])}function yr(t){var e=mi(t);return~e.extra.classes.indexOf(Dt)?Ri(t,e):Si(t,e)}function br(t){var e=arguments.length>1&&arguments[1]!==void 0?arguments[1]:null;if(!!E){var n=w.documentElement.classList,r=function(d){return n.add("".concat(Ft,"-").concat(d))},i=function(d){return n.remove("".concat(Ft,"-").concat(d))},a=h.autoFetchSvg?Object.keys(xn):Object.keys(ki),s=[".".concat(Dt,":not([").concat(W,"])")].concat(a.map(function(c){return".".concat(c,":not([").concat(W,"])")})).join(", ");if(s.length!==0){var o=[];try{o=G(t.querySelectorAll(s))}catch(c){}if(o.length>0)r("pending"),i("complete");else return;var l=He.begin("onTree"),u=o.reduce(function(c,d){try{var g=yr(d);g&&c.push(g)}catch(p){wn||p instanceof ee&&console.error(p)}return c},[]);return new O(function(c,d){O.all(u).then(function(g){vr(g,function(){r("active"),r("complete"),i("pending"),typeof e=="function"&&e(),l(),c()})}).catch(function(){l(),d()})})}}}function Pi(t){var e=arguments.length>1&&arguments[1]!==void 0?arguments[1]:null;yr(t).then(function(n){n&&vr([n],e)})}function wr(t,e){var n="".concat(gn).concat(e.replace(":","-"));return new O(function(r,i){if(t.getAttribute(n)!==null)return r();var a=G(t.children),s=a.filter(function(P){return P.getAttribute(je)===e})[0],o=j.getComputedStyle(t,e),l=o.getPropertyValue("font-family").match(Sn),u=o.getPropertyValue("font-weight");if(s&&!l)return t.removeChild(s),r();if(l){var c=o.getPropertyValue("content"),d=~["Solid","Regular","Light","Duotone","Brands"].indexOf(l[1])?kn[l[1].toLowerCase()]:Rn[u],g=nr(c.length===3?c.substr(1,1):c),p=ur(d,g),y=p;if(p&&(!s||s.getAttribute(mn)!==d||s.getAttribute(pn)!==y)){t.setAttribute(n,y),s&&t.removeChild(s);var b=gi(),S=b.extra;S.attributes[je]=e,Je(p,d).then(function(P){var A=Ve(m({},b,{icons:{main:P,mask:Ge()},prefix:d,iconName:y,extra:S,watchable:!0})),U=w.createElement("svg");e===":before"?t.insertBefore(U,t.firstChild):t.appendChild(U),U.outerHTML=A.map(function(Oe){return Y(Oe)}).join(`
`),t.removeAttribute(n),r()}).catch(i)}else r()}else r()})}function Ai(t){return O.all([wr(t,":before"),wr(t,":after")])}function Ci(t){return t.parentNode!==document.head&&!~bn.indexOf(t.tagName.toUpperCase())&&!t.getAttribute(je)&&(!t.parentNode||t.parentNode.tagName!=="svg")}function xr(t){if(!!E)return new O(function(e,n){var r=G(t.querySelectorAll("*")).filter(Ci).map(Ai),i=He.begin("searchPseudoElements");si(),O.all(r).then(function(){i(),gr(),e()}).catch(function(){i(),gr(),n()})})}var Oi=`svg:not(:root).svg-inline--fa {
  overflow: visible;
}

.svg-inline--fa {
  display: inline-block;
  font-size: inherit;
  height: 1em;
  overflow: visible;
  vertical-align: -0.125em;
}
.svg-inline--fa.fa-lg {
  vertical-align: -0.225em;
}
.svg-inline--fa.fa-w-1 {
  width: 0.0625em;
}
.svg-inline--fa.fa-w-2 {
  width: 0.125em;
}
.svg-inline--fa.fa-w-3 {
  width: 0.1875em;
}
.svg-inline--fa.fa-w-4 {
  width: 0.25em;
}
.svg-inline--fa.fa-w-5 {
  width: 0.3125em;
}
.svg-inline--fa.fa-w-6 {
  width: 0.375em;
}
.svg-inline--fa.fa-w-7 {
  width: 0.4375em;
}
.svg-inline--fa.fa-w-8 {
  width: 0.5em;
}
.svg-inline--fa.fa-w-9 {
  width: 0.5625em;
}
.svg-inline--fa.fa-w-10 {
  width: 0.625em;
}
.svg-inline--fa.fa-w-11 {
  width: 0.6875em;
}
.svg-inline--fa.fa-w-12 {
  width: 0.75em;
}
.svg-inline--fa.fa-w-13 {
  width: 0.8125em;
}
.svg-inline--fa.fa-w-14 {
  width: 0.875em;
}
.svg-inline--fa.fa-w-15 {
  width: 0.9375em;
}
.svg-inline--fa.fa-w-16 {
  width: 1em;
}
.svg-inline--fa.fa-w-17 {
  width: 1.0625em;
}
.svg-inline--fa.fa-w-18 {
  width: 1.125em;
}
.svg-inline--fa.fa-w-19 {
  width: 1.1875em;
}
.svg-inline--fa.fa-w-20 {
  width: 1.25em;
}
.svg-inline--fa.fa-pull-left {
  margin-right: 0.3em;
  width: auto;
}
.svg-inline--fa.fa-pull-right {
  margin-left: 0.3em;
  width: auto;
}
.svg-inline--fa.fa-border {
  height: 1.5em;
}
.svg-inline--fa.fa-li {
  width: 2em;
}
.svg-inline--fa.fa-fw {
  width: 1.25em;
}

.fa-layers svg.svg-inline--fa {
  bottom: 0;
  left: 0;
  margin: auto;
  position: absolute;
  right: 0;
  top: 0;
}

.fa-layers {
  display: inline-block;
  height: 1em;
  position: relative;
  text-align: center;
  vertical-align: -0.125em;
  width: 1em;
}
.fa-layers svg.svg-inline--fa {
  -webkit-transform-origin: center center;
          transform-origin: center center;
}

.fa-layers-counter, .fa-layers-text {
  display: inline-block;
  position: absolute;
  text-align: center;
}

.fa-layers-text {
  left: 50%;
  top: 50%;
  -webkit-transform: translate(-50%, -50%);
          transform: translate(-50%, -50%);
  -webkit-transform-origin: center center;
          transform-origin: center center;
}

.fa-layers-counter {
  background-color: #ff253a;
  border-radius: 1em;
  -webkit-box-sizing: border-box;
          box-sizing: border-box;
  color: #fff;
  height: 1.5em;
  line-height: 1;
  max-width: 5em;
  min-width: 1.5em;
  overflow: hidden;
  padding: 0.25em;
  right: 0;
  text-overflow: ellipsis;
  top: 0;
  -webkit-transform: scale(0.25);
          transform: scale(0.25);
  -webkit-transform-origin: top right;
          transform-origin: top right;
}

.fa-layers-bottom-right {
  bottom: 0;
  right: 0;
  top: auto;
  -webkit-transform: scale(0.25);
          transform: scale(0.25);
  -webkit-transform-origin: bottom right;
          transform-origin: bottom right;
}

.fa-layers-bottom-left {
  bottom: 0;
  left: 0;
  right: auto;
  top: auto;
  -webkit-transform: scale(0.25);
          transform: scale(0.25);
  -webkit-transform-origin: bottom left;
          transform-origin: bottom left;
}

.fa-layers-top-right {
  right: 0;
  top: 0;
  -webkit-transform: scale(0.25);
          transform: scale(0.25);
  -webkit-transform-origin: top right;
          transform-origin: top right;
}

.fa-layers-top-left {
  left: 0;
  right: auto;
  top: 0;
  -webkit-transform: scale(0.25);
          transform: scale(0.25);
  -webkit-transform-origin: top left;
          transform-origin: top left;
}

.fa-lg {
  font-size: 1.3333333333em;
  line-height: 0.75em;
  vertical-align: -0.0667em;
}

.fa-xs {
  font-size: 0.75em;
}

.fa-sm {
  font-size: 0.875em;
}

.fa-1x {
  font-size: 1em;
}

.fa-2x {
  font-size: 2em;
}

.fa-3x {
  font-size: 3em;
}

.fa-4x {
  font-size: 4em;
}

.fa-5x {
  font-size: 5em;
}

.fa-6x {
  font-size: 6em;
}

.fa-7x {
  font-size: 7em;
}

.fa-8x {
  font-size: 8em;
}

.fa-9x {
  font-size: 9em;
}

.fa-10x {
  font-size: 10em;
}

.fa-fw {
  text-align: center;
  width: 1.25em;
}

.fa-ul {
  list-style-type: none;
  margin-left: 2.5em;
  padding-left: 0;
}
.fa-ul > li {
  position: relative;
}

.fa-li {
  left: -2em;
  position: absolute;
  text-align: center;
  width: 2em;
  line-height: inherit;
}

.fa-border {
  border: solid 0.08em #eee;
  border-radius: 0.1em;
  padding: 0.2em 0.25em 0.15em;
}

.fa-pull-left {
  float: left;
}

.fa-pull-right {
  float: right;
}

.fa.fa-pull-left,
.fas.fa-pull-left,
.far.fa-pull-left,
.fal.fa-pull-left,
.fab.fa-pull-left {
  margin-right: 0.3em;
}
.fa.fa-pull-right,
.fas.fa-pull-right,
.far.fa-pull-right,
.fal.fa-pull-right,
.fab.fa-pull-right {
  margin-left: 0.3em;
}

.fa-spin {
  -webkit-animation: fa-spin 2s infinite linear;
          animation: fa-spin 2s infinite linear;
}

.fa-pulse {
  -webkit-animation: fa-spin 1s infinite steps(8);
          animation: fa-spin 1s infinite steps(8);
}

@-webkit-keyframes fa-spin {
  0% {
    -webkit-transform: rotate(0deg);
            transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
            transform: rotate(360deg);
  }
}

@keyframes fa-spin {
  0% {
    -webkit-transform: rotate(0deg);
            transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
            transform: rotate(360deg);
  }
}
.fa-rotate-90 {
  -ms-filter: "progid:DXImageTransform.Microsoft.BasicImage(rotation=1)";
  -webkit-transform: rotate(90deg);
          transform: rotate(90deg);
}

.fa-rotate-180 {
  -ms-filter: "progid:DXImageTransform.Microsoft.BasicImage(rotation=2)";
  -webkit-transform: rotate(180deg);
          transform: rotate(180deg);
}

.fa-rotate-270 {
  -ms-filter: "progid:DXImageTransform.Microsoft.BasicImage(rotation=3)";
  -webkit-transform: rotate(270deg);
          transform: rotate(270deg);
}

.fa-flip-horizontal {
  -ms-filter: "progid:DXImageTransform.Microsoft.BasicImage(rotation=0, mirror=1)";
  -webkit-transform: scale(-1, 1);
          transform: scale(-1, 1);
}

.fa-flip-vertical {
  -ms-filter: "progid:DXImageTransform.Microsoft.BasicImage(rotation=2, mirror=1)";
  -webkit-transform: scale(1, -1);
          transform: scale(1, -1);
}

.fa-flip-both, .fa-flip-horizontal.fa-flip-vertical {
  -ms-filter: "progid:DXImageTransform.Microsoft.BasicImage(rotation=2, mirror=1)";
  -webkit-transform: scale(-1, -1);
          transform: scale(-1, -1);
}

:root .fa-rotate-90,
:root .fa-rotate-180,
:root .fa-rotate-270,
:root .fa-flip-horizontal,
:root .fa-flip-vertical,
:root .fa-flip-both {
  -webkit-filter: none;
          filter: none;
}

.fa-stack {
  display: inline-block;
  height: 2em;
  position: relative;
  width: 2.5em;
}

.fa-stack-1x,
.fa-stack-2x {
  bottom: 0;
  left: 0;
  margin: auto;
  position: absolute;
  right: 0;
  top: 0;
}

.svg-inline--fa.fa-stack-1x {
  height: 1em;
  width: 1.25em;
}
.svg-inline--fa.fa-stack-2x {
  height: 2em;
  width: 2.5em;
}

.fa-inverse {
  color: #fff;
}

.sr-only {
  border: 0;
  clip: rect(0, 0, 0, 0);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  width: 1px;
}

.sr-only-focusable:active, .sr-only-focusable:focus {
  clip: auto;
  height: auto;
  margin: 0;
  overflow: visible;
  position: static;
  width: auto;
}

.svg-inline--fa .fa-primary {
  fill: var(--fa-primary-color, currentColor);
  opacity: 1;
  opacity: var(--fa-primary-opacity, 1);
}

.svg-inline--fa .fa-secondary {
  fill: var(--fa-secondary-color, currentColor);
  opacity: 0.4;
  opacity: var(--fa-secondary-opacity, 0.4);
}

.svg-inline--fa.fa-swap-opacity .fa-primary {
  opacity: 0.4;
  opacity: var(--fa-secondary-opacity, 0.4);
}

.svg-inline--fa.fa-swap-opacity .fa-secondary {
  opacity: 1;
  opacity: var(--fa-primary-opacity, 1);
}

.svg-inline--fa mask .fa-primary,
.svg-inline--fa mask .fa-secondary {
  fill: black;
}

.fad.fa-inverse {
  color: #fff;
}`;function Qe(){var t=zt,e=$t,n=h.familyPrefix,r=h.replacementClass,i=Oi;if(n!==t||r!==e){var a=new RegExp("\\.".concat(t,"\\-"),"g"),s=new RegExp("\\--".concat(t,"\\-"),"g"),o=new RegExp("\\.".concat(e),"g");i=i.replace(a,".".concat(n,"-")).replace(s,"--".concat(n,"-")).replace(o,".".concat(r))}return i}var Ei=function(){function t(){an(this,t),this.definitions={}}return sn(t,[{key:"add",value:function(){for(var n=this,r=arguments.length,i=new Array(r),a=0;a<r;a++)i[a]=arguments[a];var s=i.reduce(this._pullDefinitions,{});Object.keys(s).forEach(function(o){n.definitions[o]=m({},n.definitions[o]||{},s[o]),ir(o,s[o]),fr()})}},{key:"reset",value:function(){this.definitions={}}},{key:"_pullDefinitions",value:function(n,r){var i=r.prefix&&r.iconName&&r.icon?{0:r}:r;return Object.keys(i).map(function(a){var s=i[a],o=s.prefix,l=s.iconName,u=s.icon;n[o]||(n[o]={}),n[o][l]=u}),n}}]),t}();function te(){h.autoAddCss&&!we&&(Kt(Qe()),we=!0)}function be(t,e){return Object.defineProperty(t,"abstract",{get:e}),Object.defineProperty(t,"html",{get:function(){return t.abstract.map(function(r){return Y(r)})}}),Object.defineProperty(t,"node",{get:function(){if(!!E){var r=w.createElement("div");return r.innerHTML=t.html,r.children}}}),t}function Ze(t){var e=t.prefix,n=e===void 0?"fa":e,r=t.iconName;if(!!r)return cr(kr.definitions,n,r)||cr(C.styles,n,r)}function Ti(t){return function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},r=(e||{}).icon?e:Ze(e||{}),i=n.mask;return i&&(i=(i||{}).icon?i:Ze(i||{})),t(r,m({},n,{mask:i}))}}var kr=new Ei,_i=function(){h.autoReplaceSvg=!1,h.observeMutations=!1,li()},we=!1,Ii={i2svg:function(){var e=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};if(E){te();var n=e.node,r=n===void 0?w:n,i=e.callback,a=i===void 0?function(){}:i;return h.searchPseudoElements&&xr(r),br(r,a)}else return O.reject("Operation requires a DOM of some kind.")},css:Qe,insertCss:function(){we||(Kt(Qe()),we=!0)},watch:function(){var e=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{},n=e.autoReplaceSvgRoot,r=e.observeMutationsRoot;h.autoReplaceSvg===!1&&(h.autoReplaceSvg=!0),h.observeMutations=!0,jn(function(){Fi({autoReplaceSvgRoot:n}),oi({treeCallback:br,nodeCallback:Pi,pseudoElementsCallback:xr,observeMutationsRoot:r})})}},ji={transform:function(e){return mr(e)}},Mi=Ti(function(t){var e=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},n=e.transform,r=n===void 0?I:n,i=e.symbol,a=i===void 0?!1:i,s=e.mask,o=s===void 0?null:s,l=e.title,u=l===void 0?null:l,c=e.classes,d=c===void 0?[]:c,g=e.attributes,p=g===void 0?{}:g,y=e.styles,b=y===void 0?{}:y;if(!!t){var S=t.prefix,P=t.iconName,A=t.icon;return be(m({type:"icon"},t),function(){return te(),h.autoA11y&&(u?p["aria-labelledby"]="".concat(h.replacementClass,"-title-").concat(Q()):(p["aria-hidden"]="true",p.focusable="false")),Ve({icons:{main:Ke(A),mask:o?Ke(o.icon):{found:!1,width:null,height:null,icon:{}}},prefix:S,iconName:P,transform:m({},I,r),symbol:a,title:u,extra:{attributes:p,styles:b,classes:d}})})}}),Ni=function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},r=n.transform,i=r===void 0?I:r,a=n.title,s=a===void 0?null:a,o=n.classes,l=o===void 0?[]:o,u=n.attributes,c=u===void 0?{}:u,d=n.styles,g=d===void 0?{}:d;return be({type:"text",content:e},function(){return te(),er({content:e,transform:m({},I,i),title:s,extra:{attributes:c,styles:g,classes:["".concat(h.familyPrefix,"-layers-text")].concat(Te(l))}})})},Li=function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},r=n.title,i=r===void 0?null:r,a=n.classes,s=a===void 0?[]:a,o=n.attributes,l=o===void 0?{}:o,u=n.styles,c=u===void 0?{}:u;return be({type:"counter",content:e},function(){return te(),Jn({content:e.toString(),title:i,extra:{attributes:l,styles:c,classes:["".concat(h.familyPrefix,"-layers-counter")].concat(Te(s))}})})},zi=function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},r=n.classes,i=r===void 0?[]:r;return be({type:"layer"},function(){te();var a=[];return e(function(s){Array.isArray(s)?s.map(function(o){a=a.concat(o.abstract)}):a=a.concat(s.abstract)}),[{tag:"span",attributes:{class:["".concat(h.familyPrefix,"-layers")].concat(Te(i)).join(" ")},children:a}]})},$i={noAuto:_i,config:h,dom:Ii,library:kr,parse:ji,findIconDefinition:Ze,icon:Mi,text:Ni,counter:Li,layer:zi,toHtml:Y},Fi=function(){var e=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{},n=e.autoReplaceSvgRoot,r=n===void 0?w:n;(Object.keys(C.styles).length>0||h.autoFetchSvg)&&E&&h.autoReplaceSvg&&$i.dom.i2svg({node:r})},Xs={prefix:"fas",iconName:"times",icon:[352,512,[],"f00d","M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"]},Ks={prefix:"fas",iconName:"window-maximize",icon:[512,512,[],"f2d0","M464 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h416c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zm-16 160H64v-84c0-6.6 5.4-12 12-12h360c6.6 0 12 5.4 12 12v84z"]},Js={prefix:"fas",iconName:"window-minimize",icon:[512,512,[],"f2d1","M464 352H48c-26.5 0-48 21.5-48 48v32c0 26.5 21.5 48 48 48h416c26.5 0 48-21.5 48-48v-32c0-26.5-21.5-48-48-48z"]};function x(){return x=Object.assign||function(t){for(var e=1;e<arguments.length;e++){var n=arguments[e];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(t[r]=n[r])}return t},x.apply(this,arguments)}var Sr=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(t){return typeof t}:function(t){return t&&typeof Symbol=="function"&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},re=(typeof window=="undefined"?"undefined":Sr(window))==="object"&&(typeof document=="undefined"?"undefined":Sr(document))==="object"&&document.nodeType===9;function Rr(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r)}}function Pr(t,e,n){return e&&Rr(t.prototype,e),n&&Rr(t,n),t}function et(t,e){return et=Object.setPrototypeOf||function(r,i){return r.__proto__=i,r},et(t,e)}function Ar(t,e){t.prototype=Object.create(e.prototype),t.prototype.constructor=t,et(t,e)}function Cr(t){if(t===void 0)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}function Di(t,e){if(t==null)return{};var n={},r=Object.keys(t),i,a;for(a=0;a<r.length;a++)i=r[a],!(e.indexOf(i)>=0)&&(n[i]=t[i]);return n}var Vi={}.constructor;function tt(t){if(t==null||typeof t!="object")return t;if(Array.isArray(t))return t.map(tt);if(t.constructor!==Vi)return t;var e={};for(var n in t)e[n]=tt(t[n]);return e}function xe(t,e,n){t===void 0&&(t="unnamed");var r=n.jss,i=tt(e),a=r.plugins.onCreateRule(t,i,n);return a||(t[0]==="@",null)}var Or=function(e,n){for(var r="",i=0;i<e.length&&e[i]!=="!important";i++)r&&(r+=n),r+=e[i];return r},F=function(e,n){if(n===void 0&&(n=!1),!Array.isArray(e))return e;var r="";if(Array.isArray(e[0]))for(var i=0;i<e.length&&e[i]!=="!important";i++)r&&(r+=", "),r+=Or(e[i]," ");else r=Or(e,", ");return!n&&e[e.length-1]==="!important"&&(r+=" !important"),r};function ne(t,e){for(var n="",r=0;r<e;r++)n+="  ";return n+t}function ie(t,e,n){n===void 0&&(n={});var r="";if(!e)return r;var i=n,a=i.indent,s=a===void 0?0:a,o=e.fallbacks;if(t&&s++,o)if(Array.isArray(o))for(var l=0;l<o.length;l++){var u=o[l];for(var c in u){var d=u[c];d!=null&&(r&&(r+=`
`),r+=ne(c+": "+F(d)+";",s))}}else for(var g in o){var p=o[g];p!=null&&(r&&(r+=`
`),r+=ne(g+": "+F(p)+";",s))}for(var y in e){var b=e[y];b!=null&&y!=="fallbacks"&&(r&&(r+=`
`),r+=ne(y+": "+F(b)+";",s))}return!r&&!n.allowEmpty||!t?r:(s--,r&&(r=`
`+r+`
`),ne(t+" {"+r,s)+ne("}",s))}var Ui=/([[\].#*$><+~=|^:(),"'`\s])/g,Er=typeof CSS!="undefined"&&CSS.escape,rt=function(t){return Er?Er(t):t.replace(Ui,"\\$1")},Tr=function(){function t(n,r,i){this.type="style",this.key=void 0,this.isProcessed=!1,this.style=void 0,this.renderer=void 0,this.renderable=void 0,this.options=void 0;var a=i.sheet,s=i.Renderer;this.key=n,this.options=i,this.style=r,a?this.renderer=a.renderer:s&&(this.renderer=new s)}var e=t.prototype;return e.prop=function(r,i,a){if(i===void 0)return this.style[r];var s=a?a.force:!1;if(!s&&this.style[r]===i)return this;var o=i;(!a||a.process!==!1)&&(o=this.options.jss.plugins.onChangeValue(i,r,this));var l=o==null||o===!1,u=r in this.style;if(l&&!u&&!s)return this;var c=l&&u;if(c?delete this.style[r]:this.style[r]=o,this.renderable&&this.renderer)return c?this.renderer.removeProperty(this.renderable,r):this.renderer.setProperty(this.renderable,r,o),this;var d=this.options.sheet;return d&&d.attached,this},t}(),nt=function(t){Ar(e,t);function e(r,i,a){var s;s=t.call(this,r,i,a)||this,s.selectorText=void 0,s.id=void 0,s.renderable=void 0;var o=a.selector,l=a.scoped,u=a.sheet,c=a.generateId;return o?s.selectorText=o:l!==!1&&(s.id=c(Cr(Cr(s)),u),s.selectorText="."+rt(s.id)),s}var n=e.prototype;return n.applyTo=function(i){var a=this.renderer;if(a){var s=this.toJSON();for(var o in s)a.setProperty(i,o,s[o])}return this},n.toJSON=function(){var i={};for(var a in this.style){var s=this.style[a];typeof s!="object"?i[a]=s:Array.isArray(s)&&(i[a]=F(s))}return i},n.toString=function(i){var a=this.options.sheet,s=a?a.options.link:!1,o=s?x({},i,{allowEmpty:!0}):i;return ie(this.selectorText,this.style,o)},Pr(e,[{key:"selector",set:function(i){if(i!==this.selectorText){this.selectorText=i;var a=this.renderer,s=this.renderable;if(!(!s||!a)){var o=a.setSelector(s,i);o||a.replaceRule(s,this)}}},get:function(){return this.selectorText}}]),e}(Tr),Hi={onCreateRule:function(e,n,r){return e[0]==="@"||r.parent&&r.parent.type==="keyframes"?null:new nt(e,n,r)}},it={indent:1,children:!0},Wi=/@([\w-]+)/,Gi=function(){function t(n,r,i){this.type="conditional",this.at=void 0,this.key=void 0,this.query=void 0,this.rules=void 0,this.options=void 0,this.isProcessed=!1,this.renderable=void 0,this.key=n;var a=n.match(Wi);this.at=a?a[1]:"unknown",this.query=i.name||"@"+this.at,this.options=i,this.rules=new ke(x({},i,{parent:this}));for(var s in r)this.rules.add(s,r[s]);this.rules.process()}var e=t.prototype;return e.getRule=function(r){return this.rules.get(r)},e.indexOf=function(r){return this.rules.indexOf(r)},e.addRule=function(r,i,a){var s=this.rules.add(r,i,a);return s?(this.options.jss.plugins.onProcessRule(s),s):null},e.toString=function(r){if(r===void 0&&(r=it),r.indent==null&&(r.indent=it.indent),r.children==null&&(r.children=it.children),r.children===!1)return this.query+" {}";var i=this.rules.toString(r);return i?this.query+` {
`+i+`
}`:""},t}(),Yi=/@media|@supports\s+/,qi={onCreateRule:function(e,n,r){return Yi.test(e)?new Gi(e,n,r):null}},at={indent:1,children:!0},Bi=/@keyframes\s+([\w-]+)/,st=function(){function t(n,r,i){this.type="keyframes",this.at="@keyframes",this.key=void 0,this.name=void 0,this.id=void 0,this.rules=void 0,this.options=void 0,this.isProcessed=!1,this.renderable=void 0;var a=n.match(Bi);a&&a[1]?this.name=a[1]:this.name="noname",this.key=this.type+"-"+this.name,this.options=i;var s=i.scoped,o=i.sheet,l=i.generateId;this.id=s===!1?this.name:rt(l(this,o)),this.rules=new ke(x({},i,{parent:this}));for(var u in r)this.rules.add(u,r[u],x({},i,{parent:this}));this.rules.process()}var e=t.prototype;return e.toString=function(r){if(r===void 0&&(r=at),r.indent==null&&(r.indent=at.indent),r.children==null&&(r.children=at.children),r.children===!1)return this.at+" "+this.id+" {}";var i=this.rules.toString(r);return i&&(i=`
`+i+`
`),this.at+" "+this.id+" {"+i+"}"},t}(),Xi=/@keyframes\s+/,Ki=/\$([\w-]+)/g,ot=function(e,n){return typeof e=="string"?e.replace(Ki,function(r,i){return i in n?n[i]:r}):e},_r=function(e,n,r){var i=e[n],a=ot(i,r);a!==i&&(e[n]=a)},Ji={onCreateRule:function(e,n,r){return typeof e=="string"&&Xi.test(e)?new st(e,n,r):null},onProcessStyle:function(e,n,r){return n.type!=="style"||!r||("animation-name"in e&&_r(e,"animation-name",r.keyframes),"animation"in e&&_r(e,"animation",r.keyframes)),e},onChangeValue:function(e,n,r){var i=r.options.sheet;if(!i)return e;switch(n){case"animation":return ot(e,i.keyframes);case"animation-name":return ot(e,i.keyframes);default:return e}}},Qi=function(t){Ar(e,t);function e(){for(var r,i=arguments.length,a=new Array(i),s=0;s<i;s++)a[s]=arguments[s];return r=t.call.apply(t,[this].concat(a))||this,r.renderable=void 0,r}var n=e.prototype;return n.toString=function(i){var a=this.options.sheet,s=a?a.options.link:!1,o=s?x({},i,{allowEmpty:!0}):i;return ie(this.key,this.style,o)},e}(Tr),Zi={onCreateRule:function(e,n,r){return r.parent&&r.parent.type==="keyframes"?new Qi(e,n,r):null}},ea=function(){function t(n,r,i){this.type="font-face",this.at="@font-face",this.key=void 0,this.style=void 0,this.options=void 0,this.isProcessed=!1,this.renderable=void 0,this.key=n,this.style=r,this.options=i}var e=t.prototype;return e.toString=function(r){if(Array.isArray(this.style)){for(var i="",a=0;a<this.style.length;a++)i+=ie(this.at,this.style[a]),this.style[a+1]&&(i+=`
`);return i}return ie(this.at,this.style,r)},t}(),ta=/@font-face/,ra={onCreateRule:function(e,n,r){return ta.test(e)?new ea(e,n,r):null}},na=function(){function t(n,r,i){this.type="viewport",this.at="@viewport",this.key=void 0,this.style=void 0,this.options=void 0,this.isProcessed=!1,this.renderable=void 0,this.key=n,this.style=r,this.options=i}var e=t.prototype;return e.toString=function(r){return ie(this.key,this.style,r)},t}(),ia={onCreateRule:function(e,n,r){return e==="@viewport"||e==="@-ms-viewport"?new na(e,n,r):null}},aa=function(){function t(n,r,i){this.type="simple",this.key=void 0,this.value=void 0,this.options=void 0,this.isProcessed=!1,this.renderable=void 0,this.key=n,this.value=r,this.options=i}var e=t.prototype;return e.toString=function(r){if(Array.isArray(this.value)){for(var i="",a=0;a<this.value.length;a++)i+=this.key+" "+this.value[a]+";",this.value[a+1]&&(i+=`
`);return i}return this.key+" "+this.value+";"},t}(),sa={"@charset":!0,"@import":!0,"@namespace":!0},oa={onCreateRule:function(e,n,r){return e in sa?new aa(e,n,r):null}},Ir=[Hi,qi,Ji,Zi,ra,ia,oa],la={process:!0},jr={force:!0,process:!0},ke=function(){function t(n){this.map={},this.raw={},this.index=[],this.counter=0,this.options=void 0,this.classes=void 0,this.keyframes=void 0,this.options=n,this.classes=n.classes,this.keyframes=n.keyframes}var e=t.prototype;return e.add=function(r,i,a){var s=this.options,o=s.parent,l=s.sheet,u=s.jss,c=s.Renderer,d=s.generateId,g=s.scoped,p=x({classes:this.classes,parent:o,sheet:l,jss:u,Renderer:c,generateId:d,scoped:g,name:r,keyframes:this.keyframes,selector:void 0},a),y=r;r in this.raw&&(y=r+"-d"+this.counter++),this.raw[y]=i,y in this.classes&&(p.selector="."+rt(this.classes[y]));var b=xe(y,i,p);if(!b)return null;this.register(b);var S=p.index===void 0?this.index.length:p.index;return this.index.splice(S,0,b),b},e.get=function(r){return this.map[r]},e.remove=function(r){this.unregister(r),delete this.raw[r.key],this.index.splice(this.index.indexOf(r),1)},e.indexOf=function(r){return this.index.indexOf(r)},e.process=function(){var r=this.options.jss.plugins;this.index.slice(0).forEach(r.onProcessRule,r)},e.register=function(r){this.map[r.key]=r,r instanceof nt?(this.map[r.selector]=r,r.id&&(this.classes[r.key]=r.id)):r instanceof st&&this.keyframes&&(this.keyframes[r.name]=r.id)},e.unregister=function(r){delete this.map[r.key],r instanceof nt?(delete this.map[r.selector],delete this.classes[r.key]):r instanceof st&&delete this.keyframes[r.name]},e.update=function(){var r,i,a;if(typeof(arguments.length<=0?void 0:arguments[0])=="string"?(r=arguments.length<=0?void 0:arguments[0],i=arguments.length<=1?void 0:arguments[1],a=arguments.length<=2?void 0:arguments[2]):(i=arguments.length<=0?void 0:arguments[0],a=arguments.length<=1?void 0:arguments[1],r=null),r)this.updateOne(this.map[r],i,a);else for(var s=0;s<this.index.length;s++)this.updateOne(this.index[s],i,a)},e.updateOne=function(r,i,a){a===void 0&&(a=la);var s=this.options,o=s.jss.plugins,l=s.sheet;if(r.rules instanceof t){r.rules.update(i,a);return}var u=r,c=u.style;if(o.onUpdate(i,r,l,a),a.process&&c&&c!==u.style){o.onProcessStyle(u.style,u,l);for(var d in u.style){var g=u.style[d],p=c[d];g!==p&&u.prop(d,g,jr)}for(var y in c){var b=u.style[y],S=c[y];b==null&&b!==S&&u.prop(y,null,jr)}}},e.toString=function(r){for(var i="",a=this.options.sheet,s=a?a.options.link:!1,o=0;o<this.index.length;o++){var l=this.index[o],u=l.toString(r);!u&&!s||(i&&(i+=`
`),i+=u)}return i},t}(),Mr=function(){function t(n,r){this.options=void 0,this.deployed=void 0,this.attached=void 0,this.rules=void 0,this.renderer=void 0,this.classes=void 0,this.keyframes=void 0,this.queue=void 0,this.attached=!1,this.deployed=!1,this.classes={},this.keyframes={},this.options=x({},r,{sheet:this,parent:this,classes:this.classes,keyframes:this.keyframes}),r.Renderer&&(this.renderer=new r.Renderer(this)),this.rules=new ke(this.options);for(var i in n)this.rules.add(i,n[i]);this.rules.process()}var e=t.prototype;return e.attach=function(){return this.attached?this:(this.renderer&&this.renderer.attach(),this.attached=!0,this.deployed||this.deploy(),this)},e.detach=function(){return this.attached?(this.renderer&&this.renderer.detach(),this.attached=!1,this):this},e.addRule=function(r,i,a){var s=this.queue;this.attached&&!s&&(this.queue=[]);var o=this.rules.add(r,i,a);return o?(this.options.jss.plugins.onProcessRule(o),this.attached?(this.deployed&&(s?s.push(o):(this.insertRule(o),this.queue&&(this.queue.forEach(this.insertRule,this),this.queue=void 0))),o):(this.deployed=!1,o)):null},e.insertRule=function(r){this.renderer&&this.renderer.insertRule(r)},e.addRules=function(r,i){var a=[];for(var s in r){var o=this.addRule(s,r[s],i);o&&a.push(o)}return a},e.getRule=function(r){return this.rules.get(r)},e.deleteRule=function(r){var i=typeof r=="object"?r:this.rules.get(r);return!i||this.attached&&!i.renderable?!1:(this.rules.remove(i),this.attached&&i.renderable&&this.renderer?this.renderer.deleteRule(i.renderable):!0)},e.indexOf=function(r){return this.rules.indexOf(r)},e.deploy=function(){return this.renderer&&this.renderer.deploy(),this.deployed=!0,this},e.update=function(){var r;return(r=this.rules).update.apply(r,arguments),this},e.updateOne=function(r,i,a){return this.rules.updateOne(r,i,a),this},e.toString=function(r){return this.rules.toString(r)},t}(),fa=function(){function t(){this.plugins={internal:[],external:[]},this.registry=void 0}var e=t.prototype;return e.onCreateRule=function(r,i,a){for(var s=0;s<this.registry.onCreateRule.length;s++){var o=this.registry.onCreateRule[s](r,i,a);if(o)return o}return null},e.onProcessRule=function(r){if(!r.isProcessed){for(var i=r.options.sheet,a=0;a<this.registry.onProcessRule.length;a++)this.registry.onProcessRule[a](r,i);r.style&&this.onProcessStyle(r.style,r,i),r.isProcessed=!0}},e.onProcessStyle=function(r,i,a){for(var s=0;s<this.registry.onProcessStyle.length;s++)i.style=this.registry.onProcessStyle[s](i.style,i,a)},e.onProcessSheet=function(r){for(var i=0;i<this.registry.onProcessSheet.length;i++)this.registry.onProcessSheet[i](r)},e.onUpdate=function(r,i,a,s){for(var o=0;o<this.registry.onUpdate.length;o++)this.registry.onUpdate[o](r,i,a,s)},e.onChangeValue=function(r,i,a){for(var s=r,o=0;o<this.registry.onChangeValue.length;o++)s=this.registry.onChangeValue[o](s,i,a);return s},e.use=function(r,i){i===void 0&&(i={queue:"external"});var a=this.plugins[i.queue];a.indexOf(r)===-1&&(a.push(r),this.registry=[].concat(this.plugins.external,this.plugins.internal).reduce(function(s,o){for(var l in o)l in s&&s[l].push(o[l]);return s},{onCreateRule:[],onProcessRule:[],onProcessStyle:[],onProcessSheet:[],onChangeValue:[],onUpdate:[]}))},t}(),ua=function(){function t(){this.registry=[]}var e=t.prototype;return e.add=function(r){var i=this.registry,a=r.options.index;if(i.indexOf(r)===-1){if(i.length===0||a>=this.index){i.push(r);return}for(var s=0;s<i.length;s++)if(i[s].options.index>a){i.splice(s,0,r);return}}},e.reset=function(){this.registry=[]},e.remove=function(r){var i=this.registry.indexOf(r);this.registry.splice(i,1)},e.toString=function(r){for(var i=r===void 0?{}:r,a=i.attached,s=Di(i,["attached"]),o="",l=0;l<this.registry.length;l++){var u=this.registry[l];a!=null&&u.attached!==a||(o&&(o+=`
`),o+=u.toString(s))}return o},Pr(t,[{key:"index",get:function(){return this.registry.length===0?0:this.registry[this.registry.length-1].options.index}}]),t}(),ae=new ua,lt=typeof globalThis!="undefined"?globalThis:typeof window!="undefined"&&window.Math===Math?window:typeof self!="undefined"&&self.Math===Math?self:Function("return this")(),ft="2f1acc6c3a606b082e5eef5e54414ffb";lt[ft]==null&&(lt[ft]=0);var Nr=lt[ft]++,Lr=function(e){e===void 0&&(e={});var n=0,r=function(a,s){n+=1;var o="",l="";return s&&(s.options.classNamePrefix&&(l=s.options.classNamePrefix),s.options.jss.id!=null&&(o=String(s.options.jss.id))),e.minify?""+(l||"c")+Nr+o+n:l+a.key+"-"+Nr+(o?"-"+o:"")+"-"+n};return r},zr=function(e){var n;return function(){return n||(n=e()),n}},ca=function(e,n){try{return e.attributeStyleMap?e.attributeStyleMap.get(n):e.style.getPropertyValue(n)}catch(r){return""}},da=function(e,n,r){try{var i=r;if(Array.isArray(r)&&(i=F(r,!0),r[r.length-1]==="!important"))return e.style.setProperty(n,i,"important"),!0;e.attributeStyleMap?e.attributeStyleMap.set(n,i):e.style.setProperty(n,i)}catch(a){return!1}return!0},ha=function(e,n){try{e.attributeStyleMap?e.attributeStyleMap.delete(n):e.style.removeProperty(n)}catch(r){}},va=function(e,n){return e.selectorText=n,e.selectorText===n},$r=zr(function(){return document.querySelector("head")});function ga(t,e){for(var n=0;n<t.length;n++){var r=t[n];if(r.attached&&r.options.index>e.index&&r.options.insertionPoint===e.insertionPoint)return r}return null}function ma(t,e){for(var n=t.length-1;n>=0;n--){var r=t[n];if(r.attached&&r.options.insertionPoint===e.insertionPoint)return r}return null}function pa(t){for(var e=$r(),n=0;n<e.childNodes.length;n++){var r=e.childNodes[n];if(r.nodeType===8&&r.nodeValue.trim()===t)return r}return null}function ya(t){var e=ae.registry;if(e.length>0){var n=ga(e,t);if(n&&n.renderer)return{parent:n.renderer.element.parentNode,node:n.renderer.element};if(n=ma(e,t),n&&n.renderer)return{parent:n.renderer.element.parentNode,node:n.renderer.element.nextSibling}}var r=t.insertionPoint;if(r&&typeof r=="string"){var i=pa(r);if(i)return{parent:i.parentNode,node:i.nextSibling}}return!1}function ba(t,e){var n=e.insertionPoint,r=ya(e);if(r!==!1&&r.parent){r.parent.insertBefore(t,r.node);return}if(n&&typeof n.nodeType=="number"){var i=n,a=i.parentNode;a&&a.insertBefore(t,i.nextSibling);return}$r().appendChild(t)}var wa=zr(function(){var t=document.querySelector('meta[property="csp-nonce"]');return t?t.getAttribute("content"):null}),Fr=function(e,n,r){try{if("insertRule"in e){var i=e;i.insertRule(n,r)}else if("appendRule"in e){var a=e;a.appendRule(n)}}catch(s){return!1}return e.cssRules[r]},Dr=function(e,n){var r=e.cssRules.length;return n===void 0||n>r?r:n},xa=function(){var e=document.createElement("style");return e.textContent=`
`,e},ka=function(){function t(n){this.getPropertyValue=ca,this.setProperty=da,this.removeProperty=ha,this.setSelector=va,this.element=void 0,this.sheet=void 0,this.hasInsertedRules=!1,this.cssRules=[],n&&ae.add(n),this.sheet=n;var r=this.sheet?this.sheet.options:{},i=r.media,a=r.meta,s=r.element;this.element=s||xa(),this.element.setAttribute("data-jss",""),i&&this.element.setAttribute("media",i),a&&this.element.setAttribute("data-meta",a);var o=wa();o&&this.element.setAttribute("nonce",o)}var e=t.prototype;return e.attach=function(){if(!(this.element.parentNode||!this.sheet)){ba(this.element,this.sheet.options);var r=Boolean(this.sheet&&this.sheet.deployed);this.hasInsertedRules&&r&&(this.hasInsertedRules=!1,this.deploy())}},e.detach=function(){if(!!this.sheet){var r=this.element.parentNode;r&&r.removeChild(this.element),this.sheet.options.link&&(this.cssRules=[],this.element.textContent=`
`)}},e.deploy=function(){var r=this.sheet;if(!!r){if(r.options.link){this.insertRules(r.rules);return}this.element.textContent=`
`+r.toString()+`
`}},e.insertRules=function(r,i){for(var a=0;a<r.index.length;a++)this.insertRule(r.index[a],a,i)},e.insertRule=function(r,i,a){if(a===void 0&&(a=this.element.sheet),r.rules){var s=r,o=a;if(r.type==="conditional"||r.type==="keyframes"){var l=Dr(a,i);if(o=Fr(a,s.toString({children:!1}),l),o===!1)return!1;this.refCssRule(r,l,o)}return this.insertRules(s.rules,o),o}var u=r.toString();if(!u)return!1;var c=Dr(a,i),d=Fr(a,u,c);return d===!1?!1:(this.hasInsertedRules=!0,this.refCssRule(r,c,d),d)},e.refCssRule=function(r,i,a){r.renderable=a,r.options.parent instanceof Mr&&(this.cssRules[i]=a)},e.deleteRule=function(r){var i=this.element.sheet,a=this.indexOf(r);return a===-1?!1:(i.deleteRule(a),this.cssRules.splice(a,1),!0)},e.indexOf=function(r){return this.cssRules.indexOf(r)},e.replaceRule=function(r,i){var a=this.indexOf(r);return a===-1?!1:(this.element.sheet.deleteRule(a),this.cssRules.splice(a,1),this.insertRule(i,a))},e.getRules=function(){return this.element.sheet.cssRules},t}(),Sa=0,Ra=function(){function t(n){this.id=Sa++,this.version="10.7.1",this.plugins=new fa,this.options={id:{minify:!1},createGenerateId:Lr,Renderer:re?ka:null,plugins:[]},this.generateId=Lr({minify:!1});for(var r=0;r<Ir.length;r++)this.plugins.use(Ir[r],{queue:"internal"});this.setup(n)}var e=t.prototype;return e.setup=function(r){return r===void 0&&(r={}),r.createGenerateId&&(this.options.createGenerateId=r.createGenerateId),r.id&&(this.options.id=x({},this.options.id,r.id)),(r.createGenerateId||r.id)&&(this.generateId=this.options.createGenerateId(this.options.id)),r.insertionPoint!=null&&(this.options.insertionPoint=r.insertionPoint),"Renderer"in r&&(this.options.Renderer=r.Renderer),r.plugins&&this.use.apply(this,r.plugins),this},e.createStyleSheet=function(r,i){i===void 0&&(i={});var a=i,s=a.index;typeof s!="number"&&(s=ae.index===0?0:ae.index+1);var o=new Mr(r,x({},i,{jss:this,generateId:i.generateId||this.generateId,insertionPoint:this.options.insertionPoint,Renderer:this.options.Renderer,index:s}));return this.plugins.onProcessSheet(o),o},e.removeStyleSheet=function(r){return r.detach(),ae.remove(r),this},e.createRule=function(r,i,a){if(i===void 0&&(i={}),a===void 0&&(a={}),typeof r=="object")return this.createRule(void 0,r,i);var s=x({},a,{name:r,jss:this,Renderer:this.options.Renderer});s.generateId||(s.generateId=this.generateId),s.classes||(s.classes={}),s.keyframes||(s.keyframes={});var o=xe(r,i,s);return o&&this.plugins.onProcessRule(o),o},e.use=function(){for(var r=this,i=arguments.length,a=new Array(i),s=0;s<i;s++)a[s]=arguments[s];return a.forEach(function(o){r.plugins.use(o)}),this},t}();/**
 * A better abstraction over CSS.
 *
 * @copyright Oleg Isonen (Slobodskoi) / Isonen 2014-present
 * @website https://github.com/cssinjs/jss
 * @license MIT
 */var ut=typeof CSS=="object"&&CSS!=null&&"number"in CSS,Pa=function(e){return new Ra(e)},Aa=Pa(),Qs=Aa,Vr=Date.now(),ct="fnValues"+Vr,dt="fnStyle"+ ++Vr,Ca=function(){return{onCreateRule:function(n,r,i){if(typeof r!="function")return null;var a=xe(n,{},i);return a[dt]=r,a},onProcessStyle:function(n,r){if(ct in r||dt in r)return n;var i={};for(var a in n){var s=n[a];typeof s=="function"&&(delete n[a],i[a]=s)}return r[ct]=i,n},onUpdate:function(n,r,i,a){var s=r,o=s[dt];o&&(s.style=o(n)||{});var l=s[ct];if(l)for(var u in l)s.prop(u,l[u](n),a)}}},Oa=Ca;function Ea(t){var e,n=t.Symbol;return typeof n=="function"?n.observable?e=n.observable:(e=n("observable"),n.observable=e):e="@@observable",e}var q;typeof self!="undefined"?q=self:typeof window!="undefined"?q=window:typeof global!="undefined"?q=global:typeof module!="undefined"?q=module:q=Function("return this")();var Ur=Ea(q),Hr=function(e){return e&&e[Ur]&&e===e[Ur]()},Ta=function(e){return{onCreateRule:function(r,i,a){if(!Hr(i))return null;var s=i,o=xe(r,{},a);return s.subscribe(function(l){for(var u in l)o.prop(u,l[u],e)}),o},onProcessRule:function(r){if(!(r&&r.type!=="style")){var i=r,a=i.style,s=function(c){var d=a[c];if(!Hr(d))return"continue";delete a[c],d.subscribe({next:function(p){i.prop(c,p,e)}})};for(var o in a)var l=s(o)}}}},_a=Ta,Ia=/;\n/,ja=function(e){for(var n={},r=e.split(Ia),i=0;i<r.length;i++){var a=(r[i]||"").trim();if(!!a){var s=a.indexOf(":");if(s!==-1){var o=a.substr(0,s).trim(),l=a.substr(s+1).trim();n[o]=l}}}return n},Ma=function(e){typeof e.style=="string"&&(e.style=ja(e.style))};function Na(){return{onProcessRule:Ma}}var N="@global",ht="@global ",La=function(){function t(n,r,i){this.type="global",this.at=N,this.rules=void 0,this.options=void 0,this.key=void 0,this.isProcessed=!1,this.key=n,this.options=i,this.rules=new ke(x({},i,{parent:this}));for(var a in r)this.rules.add(a,r[a]);this.rules.process()}var e=t.prototype;return e.getRule=function(r){return this.rules.get(r)},e.addRule=function(r,i,a){var s=this.rules.add(r,i,a);return s&&this.options.jss.plugins.onProcessRule(s),s},e.indexOf=function(r){return this.rules.indexOf(r)},e.toString=function(){return this.rules.toString()},t}(),za=function(){function t(n,r,i){this.type="global",this.at=N,this.options=void 0,this.rule=void 0,this.isProcessed=!1,this.key=void 0,this.key=n,this.options=i;var a=n.substr(ht.length);this.rule=i.jss.createRule(a,r,x({},i,{parent:this}))}var e=t.prototype;return e.toString=function(r){return this.rule?this.rule.toString(r):""},t}(),$a=/\s*,\s*/g;function Wr(t,e){for(var n=t.split($a),r="",i=0;i<n.length;i++)r+=e+" "+n[i].trim(),n[i+1]&&(r+=", ");return r}function Fa(t,e){var n=t.options,r=t.style,i=r?r[N]:null;if(!!i){for(var a in i)e.addRule(a,i[a],x({},n,{selector:Wr(a,t.selector)}));delete r[N]}}function Da(t,e){var n=t.options,r=t.style;for(var i in r)if(!(i[0]!=="@"||i.substr(0,N.length)!==N)){var a=Wr(i.substr(N.length),t.selector);e.addRule(a,r[i],x({},n,{selector:a})),delete r[i]}}function Va(){function t(n,r,i){if(!n)return null;if(n===N)return new La(n,r,i);if(n[0]==="@"&&n.substr(0,ht.length)===ht)return new za(n,r,i);var a=i.parent;return a&&(a.type==="global"||a.options.parent&&a.options.parent.type==="global")&&(i.scoped=!1),i.scoped===!1&&(i.selector=n),null}function e(n,r){n.type!=="style"||!r||(Fa(n,r),Da(n,r))}return{onCreateRule:t,onProcessRule:e}}var Se=function(e){return e&&typeof e=="object"&&!Array.isArray(e)},vt="extendCurrValue"+Date.now();function Ua(t,e,n,r){var i=typeof t.extend;if(i==="string"){if(!n)return;var a=n.getRule(t.extend);if(!a||a===e)return;var s=a.options.parent;if(s){var o=s.rules.raw[t.extend];D(o,e,n,r)}return}if(Array.isArray(t.extend)){for(var l=0;l<t.extend.length;l++){var u=t.extend[l],c=typeof u=="string"?x({},t,{extend:u}):t.extend[l];D(c,e,n,r)}return}for(var d in t.extend){if(d==="extend"){D(t.extend.extend,e,n,r);continue}if(Se(t.extend[d])){d in r||(r[d]={}),D(t.extend[d],e,n,r[d]);continue}r[d]=t.extend[d]}}function Ha(t,e,n,r){for(var i in t)if(i!=="extend"){if(Se(r[i])&&Se(t[i])){D(t[i],e,n,r[i]);continue}if(Se(t[i])){r[i]=D(t[i],e,n);continue}r[i]=t[i]}}function D(t,e,n,r){return r===void 0&&(r={}),Ua(t,e,n,r),Ha(t,e,n,r),r}function Wa(){function t(n,r,i){return"extend"in n?D(n,r,i):n}function e(n,r,i){if(r!=="extend")return n;if(n==null||n===!1){for(var a in i[vt])i.prop(a,null);return i[vt]=null,null}if(typeof n=="object"){for(var s in n)i.prop(s,n[s]);i[vt]=n}return null}return{onProcessStyle:t,onChangeValue:e}}var Gr=/\s*,\s*/g,Ga=/&/g,Ya=/\$([\w-]+)/g;function qa(){function t(i,a){return function(s,o){var l=i.getRule(o)||a&&a.getRule(o);return l?(l=l,l.selector):o}}function e(i,a){for(var s=a.split(Gr),o=i.split(Gr),l="",u=0;u<s.length;u++)for(var c=s[u],d=0;d<o.length;d++){var g=o[d];l&&(l+=", "),l+=g.indexOf("&")!==-1?g.replace(Ga,c):c+" "+g}return l}function n(i,a,s){if(s)return x({},s,{index:s.index+1});var o=i.options.nestingLevel;o=o===void 0?1:o+1;var l=x({},i.options,{nestingLevel:o,index:a.indexOf(i)+1});return delete l.name,l}function r(i,a,s){if(a.type!=="style")return i;var o=a,l=o.options.parent,u,c;for(var d in i){var g=d.indexOf("&")!==-1,p=d[0]==="@";if(!(!g&&!p)){if(u=n(o,l,u),g){var y=e(d,o.selector);c||(c=t(l,s)),y=y.replace(Ya,c),l.addRule(y,i[d],x({},u,{selector:y}))}else p&&l.addRule(d,{},u).addRule(o.key,i[d],{selector:o.selector});delete i[d]}}return i}return{onProcessStyle:r}}function gt(t,e){if(!e)return!0;if(Array.isArray(e)){for(var n=0;n<e.length;n++){var r=gt(t,e[n]);if(!r)return!1}return!0}if(e.indexOf(" ")>-1)return gt(t,e.split(" "));var i=t.options,a=i.parent;if(e[0]==="$"){var s=a.getRule(e.substr(1));return!s||s===t?!1:(a.classes[t.key]+=" "+a.classes[s.key],!0)}return a.classes[t.key]+=" "+e,!0}function Ba(){function t(e,n){return"composes"in e&&(gt(n,e.composes),delete e.composes),e}return{onProcessStyle:t}}var Xa=/[A-Z]/g,Ka=/^ms-/,mt={};function Ja(t){return"-"+t.toLowerCase()}function Yr(t){if(mt.hasOwnProperty(t))return mt[t];var e=t.replace(Xa,Ja);return mt[t]=Ka.test(e)?"-"+e:e}function Re(t){var e={};for(var n in t){var r=n.indexOf("--")===0?n:Yr(n);e[r]=t[n]}return t.fallbacks&&(Array.isArray(t.fallbacks)?e.fallbacks=t.fallbacks.map(Re):e.fallbacks=Re(t.fallbacks)),e}function Qa(){function t(n){if(Array.isArray(n)){for(var r=0;r<n.length;r++)n[r]=Re(n[r]);return n}return Re(n)}function e(n,r,i){if(r.indexOf("--")===0)return n;var a=Yr(r);return r===a?n:(i.prop(a,n),null)}return{onProcessStyle:t,onChangeValue:e}}var f=ut&&CSS?CSS.px:"px",Pe=ut&&CSS?CSS.ms:"ms",B=ut&&CSS?CSS.percent:"%",Za={"animation-delay":Pe,"animation-duration":Pe,"background-position":f,"background-position-x":f,"background-position-y":f,"background-size":f,border:f,"border-bottom":f,"border-bottom-left-radius":f,"border-bottom-right-radius":f,"border-bottom-width":f,"border-left":f,"border-left-width":f,"border-radius":f,"border-right":f,"border-right-width":f,"border-top":f,"border-top-left-radius":f,"border-top-right-radius":f,"border-top-width":f,"border-width":f,"border-block":f,"border-block-end":f,"border-block-end-width":f,"border-block-start":f,"border-block-start-width":f,"border-block-width":f,"border-inline":f,"border-inline-end":f,"border-inline-end-width":f,"border-inline-start":f,"border-inline-start-width":f,"border-inline-width":f,"border-start-start-radius":f,"border-start-end-radius":f,"border-end-start-radius":f,"border-end-end-radius":f,margin:f,"margin-bottom":f,"margin-left":f,"margin-right":f,"margin-top":f,"margin-block":f,"margin-block-end":f,"margin-block-start":f,"margin-inline":f,"margin-inline-end":f,"margin-inline-start":f,padding:f,"padding-bottom":f,"padding-left":f,"padding-right":f,"padding-top":f,"padding-block":f,"padding-block-end":f,"padding-block-start":f,"padding-inline":f,"padding-inline-end":f,"padding-inline-start":f,"mask-position-x":f,"mask-position-y":f,"mask-size":f,height:f,width:f,"min-height":f,"max-height":f,"min-width":f,"max-width":f,bottom:f,left:f,top:f,right:f,inset:f,"inset-block":f,"inset-block-end":f,"inset-block-start":f,"inset-inline":f,"inset-inline-end":f,"inset-inline-start":f,"box-shadow":f,"text-shadow":f,"column-gap":f,"column-rule":f,"column-rule-width":f,"column-width":f,"font-size":f,"font-size-delta":f,"letter-spacing":f,"text-decoration-thickness":f,"text-indent":f,"text-stroke":f,"text-stroke-width":f,"word-spacing":f,motion:f,"motion-offset":f,outline:f,"outline-offset":f,"outline-width":f,perspective:f,"perspective-origin-x":B,"perspective-origin-y":B,"transform-origin":B,"transform-origin-x":B,"transform-origin-y":B,"transform-origin-z":B,"transition-delay":Pe,"transition-duration":Pe,"vertical-align":f,"flex-basis":f,"shape-margin":f,size:f,gap:f,grid:f,"grid-gap":f,"row-gap":f,"grid-row-gap":f,"grid-column-gap":f,"grid-template-rows":f,"grid-template-columns":f,"grid-auto-rows":f,"grid-auto-columns":f,"box-shadow-x":f,"box-shadow-y":f,"box-shadow-blur":f,"box-shadow-spread":f,"font-line-height":f,"text-shadow-x":f,"text-shadow-y":f,"text-shadow-blur":f};function qr(t){var e=/(-[a-z])/g,n=function(s){return s[1].toUpperCase()},r={};for(var i in t)r[i]=t[i],r[i.replace(e,n)]=t[i];return r}var es=qr(Za);function se(t,e,n){if(e==null)return e;if(Array.isArray(e))for(var r=0;r<e.length;r++)e[r]=se(t,e[r],n);else if(typeof e=="object")if(t==="fallbacks")for(var i in e)e[i]=se(i,e[i],n);else for(var a in e)e[a]=se(t+"-"+a,e[a],n);else if(typeof e=="number"&&isNaN(e)===!1){var s=n[t]||es[t];return s&&!(e===0&&s===f)?typeof s=="function"?s(e).toString():""+e+s:e.toString()}return e}function ts(t){t===void 0&&(t={});var e=qr(t);function n(i,a){if(a.type!=="style")return i;for(var s in i)i[s]=se(s,i[s],e);return i}function r(i,a){return se(a,i,e)}return{onProcessStyle:n,onChangeValue:r}}var rs={"background-size":!0,"background-position":!0,border:!0,"border-bottom":!0,"border-left":!0,"border-top":!0,"border-right":!0,"border-radius":!0,"border-image":!0,"border-width":!0,"border-style":!0,"border-color":!0,"box-shadow":!0,flex:!0,margin:!0,padding:!0,outline:!0,"transform-origin":!0,transform:!0,transition:!0},ns={position:!0,size:!0},Ae={padding:{top:0,right:0,bottom:0,left:0},margin:{top:0,right:0,bottom:0,left:0},background:{attachment:null,color:null,image:null,position:null,repeat:null},border:{width:null,style:null,color:null},"border-top":{width:null,style:null,color:null},"border-right":{width:null,style:null,color:null},"border-bottom":{width:null,style:null,color:null},"border-left":{width:null,style:null,color:null},outline:{width:null,style:null,color:null},"list-style":{type:null,position:null,image:null},transition:{property:null,duration:null,"timing-function":null,timingFunction:null,delay:null},animation:{name:null,duration:null,"timing-function":null,timingFunction:null,delay:null,"iteration-count":null,iterationCount:null,direction:null,"fill-mode":null,fillMode:null,"play-state":null,playState:null},"box-shadow":{x:0,y:0,blur:0,spread:0,color:null,inset:null},"text-shadow":{x:0,y:0,blur:null,color:null}},pt={border:{radius:"border-radius",image:"border-image",width:"border-width",style:"border-style",color:"border-color"},"border-bottom":{width:"border-bottom-width",style:"border-bottom-style",color:"border-bottom-color"},"border-top":{width:"border-top-width",style:"border-top-style",color:"border-top-color"},"border-left":{width:"border-left-width",style:"border-left-style",color:"border-left-color"},"border-right":{width:"border-right-width",style:"border-right-style",color:"border-right-color"},background:{size:"background-size",image:"background-image"},font:{style:"font-style",variant:"font-variant",weight:"font-weight",stretch:"font-stretch",size:"font-size",family:"font-family",lineHeight:"line-height","line-height":"line-height"},flex:{grow:"flex-grow",basis:"flex-basis",direction:"flex-direction",wrap:"flex-wrap",flow:"flex-flow",shrink:"flex-shrink"},align:{self:"align-self",items:"align-items",content:"align-content"},grid:{"template-columns":"grid-template-columns",templateColumns:"grid-template-columns","template-rows":"grid-template-rows",templateRows:"grid-template-rows","template-areas":"grid-template-areas",templateAreas:"grid-template-areas",template:"grid-template","auto-columns":"grid-auto-columns",autoColumns:"grid-auto-columns","auto-rows":"grid-auto-rows",autoRows:"grid-auto-rows","auto-flow":"grid-auto-flow",autoFlow:"grid-auto-flow",row:"grid-row",column:"grid-column","row-start":"grid-row-start",rowStart:"grid-row-start","row-end":"grid-row-end",rowEnd:"grid-row-end","column-start":"grid-column-start",columnStart:"grid-column-start","column-end":"grid-column-end",columnEnd:"grid-column-end",area:"grid-area",gap:"grid-gap","row-gap":"grid-row-gap",rowGap:"grid-row-gap","column-gap":"grid-column-gap",columnGap:"grid-column-gap"}};function is(t,e,n){return t.map(function(r){return Xr(r,e,n,!1,!0)})}function Br(t,e,n,r){return n[e]==null?t:t.length===0?[]:Array.isArray(t[0])?Br(t[0],e,n,r):typeof t[0]=="object"?is(t,e,r):[t]}function Xr(t,e,n,r,i){if(!(Ae[e]||pt[e]))return[];var a=[];if(pt[e]&&(t=as(t,n,pt[e],r)),Object.keys(t).length)for(var s in Ae[e]){if(t[s]){Array.isArray(t[s])?a.push(ns[s]===null?t[s]:t[s].join(" ")):a.push(t[s]);continue}Ae[e][s]!=null&&a.push(Ae[e][s])}return!a.length||i?a:[a]}function as(t,e,n,r){for(var i in n){var a=n[i];if(typeof t[i]!="undefined"&&(r||!e.prop(a))){var s,o=oe((s={},s[a]=t[i],s),e)[a];r?e.style.fallbacks[a]=o:e.style[a]=o}delete t[i]}return t}function oe(t,e,n){for(var r in t){var i=t[r];if(Array.isArray(i)){if(!Array.isArray(i[0])){if(r==="fallbacks"){for(var a=0;a<t.fallbacks.length;a++)t.fallbacks[a]=oe(t.fallbacks[a],e,!0);continue}t[r]=Br(i,r,rs,e),t[r].length||delete t[r]}}else if(typeof i=="object"){if(r==="fallbacks"){t.fallbacks=oe(t.fallbacks,e,!0);continue}t[r]=Xr(i,r,e,n),t[r].length||delete t[r]}else t[r]===""&&delete t[r]}return t}function ss(){function t(e,n){if(!e||n.type!=="style")return e;if(Array.isArray(e)){for(var r=0;r<e.length;r++)e[r]=oe(e[r],n);return e}return oe(e,n)}return{onProcessStyle:t}}function yt(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,r=new Array(e);n<e;n++)r[n]=t[n];return r}function os(t){if(Array.isArray(t))return yt(t)}function ls(t){if(typeof Symbol!="undefined"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function fs(t,e){if(!!t){if(typeof t=="string")return yt(t,e);var n=Object.prototype.toString.call(t).slice(8,-1);if(n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set")return Array.from(t);if(n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return yt(t,e)}}function us(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function cs(t){return os(t)||ls(t)||fs(t)||us()}var le="",bt="",Kr="",Jr="",ds=re&&"ontouchstart"in document.documentElement;if(re){var wt={Moz:"-moz-",ms:"-ms-",O:"-o-",Webkit:"-webkit-"},hs=document.createElement("p"),xt=hs.style,vs="Transform";for(var kt in wt)if(kt+vs in xt){le=kt,bt=wt[kt];break}le==="Webkit"&&"msHyphens"in xt&&(le="ms",bt=wt.ms,Jr="edge"),le==="Webkit"&&"-apple-trailing-word"in xt&&(Kr="apple")}var v={js:le,css:bt,vendor:Kr,browser:Jr,isTouch:ds};function gs(t){return t[1]==="-"||v.js==="ms"?t:"@"+v.css+"keyframes"+t.substr(10)}var ms={noPrefill:["appearance"],supportedProperty:function(e){return e!=="appearance"?!1:v.js==="ms"?"-webkit-"+e:v.css+e}},ps={noPrefill:["color-adjust"],supportedProperty:function(e){return e!=="color-adjust"?!1:v.js==="Webkit"?v.css+"print-"+e:e}},ys=/[-\s]+(.)?/g;function bs(t,e){return e?e.toUpperCase():""}function St(t){return t.replace(ys,bs)}function L(t){return St("-"+t)}var ws={noPrefill:["mask"],supportedProperty:function(e,n){if(!/^mask/.test(e))return!1;if(v.js==="Webkit"){var r="mask-image";if(St(r)in n)return e;if(v.js+L(r)in n)return v.css+e}return e}},xs={noPrefill:["text-orientation"],supportedProperty:function(e){return e!=="text-orientation"?!1:v.vendor==="apple"&&!v.isTouch?v.css+e:e}},ks={noPrefill:["transform"],supportedProperty:function(e,n,r){return e!=="transform"?!1:r.transform?e:v.css+e}},Ss={noPrefill:["transition"],supportedProperty:function(e,n,r){return e!=="transition"?!1:r.transition?e:v.css+e}},Rs={noPrefill:["writing-mode"],supportedProperty:function(e){return e!=="writing-mode"?!1:v.js==="Webkit"||v.js==="ms"&&v.browser!=="edge"?v.css+e:e}},Ps={noPrefill:["user-select"],supportedProperty:function(e){return e!=="user-select"?!1:v.js==="Moz"||v.js==="ms"||v.vendor==="apple"?v.css+e:e}},As={supportedProperty:function(e,n){if(!/^break-/.test(e))return!1;if(v.js==="Webkit"){var r="WebkitColumn"+L(e);return r in n?v.css+"column-"+e:!1}if(v.js==="Moz"){var i="page"+L(e);return i in n?"page-"+e:!1}return!1}},Cs={supportedProperty:function(e,n){if(!/^(border|margin|padding)-inline/.test(e))return!1;if(v.js==="Moz")return e;var r=e.replace("-inline","");return v.js+L(r)in n?v.css+r:!1}},Os={supportedProperty:function(e,n){return St(e)in n?e:!1}},Es={supportedProperty:function(e,n){var r=L(e);return e[0]==="-"||e[0]==="-"&&e[1]==="-"?e:v.js+r in n?v.css+e:v.js!=="Webkit"&&"Webkit"+r in n?"-webkit-"+e:!1}},Ts={supportedProperty:function(e){return e.substring(0,11)!=="scroll-snap"?!1:v.js==="ms"?""+v.css+e:e}},_s={supportedProperty:function(e){return e!=="overscroll-behavior"?!1:v.js==="ms"?v.css+"scroll-chaining":e}},Is={"flex-grow":"flex-positive","flex-shrink":"flex-negative","flex-basis":"flex-preferred-size","justify-content":"flex-pack",order:"flex-order","align-items":"flex-align","align-content":"flex-line-pack"},js={supportedProperty:function(e,n){var r=Is[e];return r&&v.js+L(r)in n?v.css+r:!1}},Qr={flex:"box-flex","flex-grow":"box-flex","flex-direction":["box-orient","box-direction"],order:"box-ordinal-group","align-items":"box-align","flex-flow":["box-orient","box-direction"],"justify-content":"box-pack"},Ms=Object.keys(Qr),Ns=function(e){return v.css+e},Ls={supportedProperty:function(e,n,r){var i=r.multiple;if(Ms.indexOf(e)>-1){var a=Qr[e];if(!Array.isArray(a))return v.js+L(a)in n?v.css+a:!1;if(!i)return!1;for(var s=0;s<a.length;s++)if(!(v.js+L(a[0])in n))return!1;return a.map(Ns)}return!1}},Zr=[ms,ps,ws,xs,ks,Ss,Rs,Ps,As,Cs,Os,Es,Ts,_s,js,Ls],en=Zr.filter(function(t){return t.supportedProperty}).map(function(t){return t.supportedProperty}),zs=Zr.filter(function(t){return t.noPrefill}).reduce(function(t,e){return t.push.apply(t,cs(e.noPrefill)),t},[]),fe,V={};if(re){fe=document.createElement("p");var Rt=window.getComputedStyle(document.documentElement,"");for(var Pt in Rt)isNaN(Pt)||(V[Rt[Pt]]=Rt[Pt]);zs.forEach(function(t){return delete V[t]})}function At(t,e){if(e===void 0&&(e={}),!fe)return t;if(V[t]!=null)return V[t];(t==="transition"||t==="transform")&&(e[t]=t in fe.style);for(var n=0;n<en.length&&(V[t]=en[n](t,fe.style,e),!V[t]);n++);try{fe.style[t]=""}catch(r){return!1}return V[t]}var X={},$s={transition:1,"transition-property":1,"-webkit-transition":1,"-webkit-transition-property":1},Fs=/(^\s*[\w-]+)|, (\s*[\w-]+)(?![^()]*\))/g,z;function Ds(t,e,n){if(e==="var")return"var";if(e==="all")return"all";if(n==="all")return", all";var r=e?At(e):", "+At(n);return r||e||n}re&&(z=document.createElement("p"));function tn(t,e){var n=e;if(!z||t==="content")return e;if(typeof n!="string"||!isNaN(parseInt(n,10)))return n;var r=t+n;if(X[r]!=null)return X[r];try{z.style[t]=n}catch(i){return X[r]=!1,!1}if($s[t])n=n.replace(Fs,Ds);else if(z.style[t]===""&&(n=v.css+n,n==="-ms-flex"&&(z.style[t]="-ms-flexbox"),z.style[t]=n,z.style[t]===""))return X[r]=!1,!1;return z.style[t]="",X[r]=n,X[r]}function Vs(){function t(i){if(i.type==="keyframes"){var a=i;a.at=gs(a.at)}}function e(i){for(var a in i){var s=i[a];if(a==="fallbacks"&&Array.isArray(s)){i[a]=s.map(e);continue}var o=!1,l=At(a);l&&l!==a&&(o=!0);var u=!1,c=tn(l,F(s));c&&c!==s&&(u=!0),(o||u)&&(o&&delete i[a],i[l||a]=c||s)}return i}function n(i,a){return a.type!=="style"?i:e(i)}function r(i,a){return tn(a,F(i))||i}return{onProcessRule:t,onProcessStyle:n,onChangeValue:r}}function Us(){var t=function(n,r){return n.length===r.length?n>r?1:-1:n.length-r.length};return{onProcessStyle:function(n,r){if(r.type!=="style")return n;for(var i={},a=Object.keys(n).sort(t),s=0;s<a.length;s++)i[a[s]]=n[a[s]];return i}}}var Hs=function(e){return e===void 0&&(e={}),{plugins:[Oa(),_a(e.observable),Na(),Va(),Wa(),qa(),Ba(),Qa(),ts(e.defaultUnit),ss(),Vs(),Us()]}},Zs=Hs,Ce,Ws=new Uint8Array(16);function Gs(){if(!Ce&&(Ce=typeof crypto!="undefined"&&crypto.getRandomValues&&crypto.getRandomValues.bind(crypto)||typeof msCrypto!="undefined"&&typeof msCrypto.getRandomValues=="function"&&msCrypto.getRandomValues.bind(msCrypto),!Ce))throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");return Ce(Ws)}var Ys=/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;function qs(t){return typeof t=="string"&&Ys.test(t)}var k=[];for(var Ct=0;Ct<256;++Ct)k.push((Ct+256).toString(16).substr(1));function Bs(t){var e=arguments.length>1&&arguments[1]!==void 0?arguments[1]:0,n=(k[t[e+0]]+k[t[e+1]]+k[t[e+2]]+k[t[e+3]]+"-"+k[t[e+4]]+k[t[e+5]]+"-"+k[t[e+6]]+k[t[e+7]]+"-"+k[t[e+8]]+k[t[e+9]]+"-"+k[t[e+10]]+k[t[e+11]]+k[t[e+12]]+k[t[e+13]]+k[t[e+14]]+k[t[e+15]]).toLowerCase();if(!qs(n))throw TypeError("Stringified UUID is invalid");return n}function eo(t,e,n){t=t||{};var r=t.random||(t.rng||Gs)();if(r[6]=r[6]&15|64,r[8]=r[8]&63|128,e){n=n||0;for(var i=0;i<16;++i)e[n+i]=r[i];return e}return Bs(r)}export{qa as a,Ks as b,Js as c,Ii as d,Xs as f,Qs as j,kr as l,Zs as p,eo as v};
