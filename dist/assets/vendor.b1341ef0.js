function V(t){return typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?V=function(e){return typeof e}:V=function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},V(t)}function tn(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function Pt(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r)}}function rn(t,e,n){return e&&Pt(t.prototype,e),n&&Pt(t,n),t}function nn(t,e,n){return e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function m(t){for(var e=1;e<arguments.length;e++){var n=arguments[e]!=null?arguments[e]:{},r=Object.keys(n);typeof Object.getOwnPropertySymbols=="function"&&(r=r.concat(Object.getOwnPropertySymbols(n).filter(function(i){return Object.getOwnPropertyDescriptor(n,i).enumerable}))),r.forEach(function(i){nn(t,i,n[i])})}return t}function Ce(t,e){return sn(t)||ln(t,e)||un()}function Oe(t){return an(t)||on(t)||fn()}function an(t){if(Array.isArray(t)){for(var e=0,n=new Array(t.length);e<t.length;e++)n[e]=t[e];return n}}function sn(t){if(Array.isArray(t))return t}function on(t){if(Symbol.iterator in Object(t)||Object.prototype.toString.call(t)==="[object Arguments]")return Array.from(t)}function ln(t,e){var n=[],r=!0,i=!1,a=void 0;try{for(var s=t[Symbol.iterator](),o;!(r=(o=s.next()).done)&&(n.push(o.value),!(e&&n.length===e));r=!0);}catch(l){i=!0,a=l}finally{try{!r&&s.return!=null&&s.return()}finally{if(i)throw a}}return n}function fn(){throw new TypeError("Invalid attempt to spread non-iterable instance")}function un(){throw new TypeError("Invalid attempt to destructure non-iterable instance")}var At=function(){},Ee={},Ct={},Ot=null,Et={mark:At,measure:At};try{typeof window!="undefined"&&(Ee=window),typeof document!="undefined"&&(Ct=document),typeof MutationObserver!="undefined"&&(Ot=MutationObserver),typeof performance!="undefined"&&(Et=performance)}catch(t){}var cn=Ee.navigator||{},Tt=cn.userAgent,_t=Tt===void 0?"":Tt,I=Ee,w=Ct,It=Ot,fe=Et;I.document;var O=!!w.documentElement&&!!w.head&&typeof w.addEventListener=="function"&&typeof w.createElement=="function",jt=~_t.indexOf("MSIE")||~_t.indexOf("Trident/"),E="___FONT_AWESOME___",Te=16,Mt="fa",Nt="svg-inline--fa",H="data-fa-i2svg",_e="data-fa-pseudo-element",dn="data-fa-pseudo-element-pending",hn="data-prefix",vn="data-icon",Lt="fontawesome-i2svg",gn="async",mn=["HTML","HEAD","STYLE","SCRIPT"],pn=function(){try{return!0}catch(t){return!1}}(),yn={fas:"solid",far:"regular",fal:"light",fad:"duotone",fab:"brands",fa:"solid"},bn={solid:"fas",regular:"far",light:"fal",duotone:"fad",brands:"fab"},zt="fa-layers-text",wn=/Font Awesome 5 (Solid|Regular|Light|Duotone|Brands|Free|Pro)/,xn={"900":"fas","400":"far",normal:"far","300":"fal"},$t=[1,2,3,4,5,6,7,8,9,10],kn=$t.concat([11,12,13,14,15,16,17,18,19,20]),Sn=["class","data-prefix","data-icon","data-fa-transform","data-fa-mask"],z={GROUP:"group",SWAP_OPACITY:"swap-opacity",PRIMARY:"primary",SECONDARY:"secondary"},Rn=["xs","sm","lg","fw","ul","li","border","pull-left","pull-right","spin","pulse","rotate-90","rotate-180","rotate-270","flip-horizontal","flip-vertical","flip-both","stack","stack-1x","stack-2x","inverse","layers","layers-text","layers-counter",z.GROUP,z.SWAP_OPACITY,z.PRIMARY,z.SECONDARY].concat($t.map(function(t){return"".concat(t,"x")})).concat(kn.map(function(t){return"w-".concat(t)})),Ft=I.FontAwesomeConfig||{};function Pn(t){var e=w.querySelector("script["+t+"]");if(e)return e.getAttribute(t)}function An(t){return t===""?!0:t==="false"?!1:t==="true"?!0:t}if(w&&typeof w.querySelector=="function"){var Cn=[["data-family-prefix","familyPrefix"],["data-replacement-class","replacementClass"],["data-auto-replace-svg","autoReplaceSvg"],["data-auto-add-css","autoAddCss"],["data-auto-a11y","autoA11y"],["data-search-pseudo-elements","searchPseudoElements"],["data-observe-mutations","observeMutations"],["data-mutate-approach","mutateApproach"],["data-keep-original-source","keepOriginalSource"],["data-measure-performance","measurePerformance"],["data-show-missing-icons","showMissingIcons"]];Cn.forEach(function(t){var e=Ce(t,2),n=e[0],r=e[1],i=An(Pn(n));i!=null&&(Ft[r]=i)})}var On={familyPrefix:Mt,replacementClass:Nt,autoReplaceSvg:!0,autoAddCss:!0,autoA11y:!0,searchPseudoElements:!1,observeMutations:!0,mutateApproach:"async",keepOriginalSource:!0,measurePerformance:!1,showMissingIcons:!0},Ie=m({},On,Ft);Ie.autoReplaceSvg||(Ie.observeMutations=!1);var h=m({},Ie);I.FontAwesomeConfig=h;var T=I||{};T[E]||(T[E]={});T[E].styles||(T[E].styles={});T[E].hooks||(T[E].hooks={});T[E].shims||(T[E].shims=[]);var A=T[E],Dt=[],En=function t(){w.removeEventListener("DOMContentLoaded",t),ue=1,Dt.map(function(e){return e()})},ue=!1;O&&(ue=(w.documentElement.doScroll?/^loaded|^c/:/^loaded|^i|^c/).test(w.readyState),ue||w.addEventListener("DOMContentLoaded",En));function Tn(t){!O||(ue?setTimeout(t,0):Dt.push(t))}var je="pending",Ut="settled",ce="fulfilled",de="rejected",_n=function(){},Vt=typeof global!="undefined"&&typeof global.process!="undefined"&&typeof global.process.emit=="function",In=typeof setImmediate=="undefined"?setTimeout:setImmediate,X=[],Me;function jn(){for(var t=0;t<X.length;t++)X[t][0](X[t][1]);X=[],Me=!1}function he(t,e){X.push([t,e]),Me||(Me=!0,In(jn,0))}function Mn(t,e){function n(i){Ne(e,i)}function r(i){K(e,i)}try{t(n,r)}catch(i){r(i)}}function Ht(t){var e=t.owner,n=e._state,r=e._data,i=t[n],a=t.then;if(typeof i=="function"){n=ce;try{r=i(r)}catch(s){K(a,s)}}Wt(a,r)||(n===ce&&Ne(a,r),n===de&&K(a,r))}function Wt(t,e){var n;try{if(t===e)throw new TypeError("A promises callback cannot return that same promise.");if(e&&(typeof e=="function"||V(e)==="object")){var r=e.then;if(typeof r=="function")return r.call(e,function(i){n||(n=!0,e===i?Gt(t,i):Ne(t,i))},function(i){n||(n=!0,K(t,i))}),!0}}catch(i){return n||K(t,i),!0}return!1}function Ne(t,e){(t===e||!Wt(t,e))&&Gt(t,e)}function Gt(t,e){t._state===je&&(t._state=Ut,t._data=e,he(Nn,t))}function K(t,e){t._state===je&&(t._state=Ut,t._data=e,he(Ln,t))}function Yt(t){t._then=t._then.forEach(Ht)}function Nn(t){t._state=ce,Yt(t)}function Ln(t){t._state=de,Yt(t),!t._handled&&Vt&&global.process.emit("unhandledRejection",t._data,t)}function zn(t){global.process.emit("rejectionHandled",t)}function S(t){if(typeof t!="function")throw new TypeError("Promise resolver "+t+" is not a function");if(!(this instanceof S))throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");this._then=[],Mn(t,this)}S.prototype={constructor:S,_state:je,_then:null,_data:void 0,_handled:!1,then:function(e,n){var r={owner:this,then:new this.constructor(_n),fulfilled:e,rejected:n};return(n||e)&&!this._handled&&(this._handled=!0,this._state===de&&Vt&&he(zn,this)),this._state===ce||this._state===de?he(Ht,r):this._then.push(r),r.then},catch:function(e){return this.then(null,e)}};S.all=function(t){if(!Array.isArray(t))throw new TypeError("You must pass an array to Promise.all().");return new S(function(e,n){var r=[],i=0;function a(l){return i++,function(u){r[l]=u,--i||e(r)}}for(var s=0,o;s<t.length;s++)o=t[s],o&&typeof o.then=="function"?o.then(a(s),n):r[s]=o;i||e(r)})};S.race=function(t){if(!Array.isArray(t))throw new TypeError("You must pass an array to Promise.race().");return new S(function(e,n){for(var r=0,i;r<t.length;r++)i=t[r],i&&typeof i.then=="function"?i.then(e,n):e(i)})};S.resolve=function(t){return t&&V(t)==="object"&&t.constructor===S?t:new S(function(e){e(t)})};S.reject=function(t){return new S(function(e,n){n(t)})};var C=typeof Promise=="function"?Promise:S,j=Te,_={size:16,x:0,y:0,rotate:0,flipX:!1,flipY:!1};function $n(t){return~Rn.indexOf(t)}function qt(t){if(!(!t||!O)){var e=w.createElement("style");e.setAttribute("type","text/css"),e.innerHTML=t;for(var n=w.head.childNodes,r=null,i=n.length-1;i>-1;i--){var a=n[i],s=(a.tagName||"").toUpperCase();["STYLE","LINK"].indexOf(s)>-1&&(r=a)}return w.head.insertBefore(e,r),t}}var Fn="0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";function J(){for(var t=12,e="";t-- >0;)e+=Fn[Math.random()*62|0];return e}function W(t){for(var e=[],n=(t||[]).length>>>0;n--;)e[n]=t[n];return e}function Le(t){return t.classList?W(t.classList):(t.getAttribute("class")||"").split(" ").filter(function(e){return e})}function Dn(t,e){var n=e.split("-"),r=n[0],i=n.slice(1).join("-");return r===t&&i!==""&&!$n(i)?i:null}function Bt(t){return"".concat(t).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&#39;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function Un(t){return Object.keys(t||{}).reduce(function(e,n){return e+"".concat(n,'="').concat(Bt(t[n]),'" ')},"").trim()}function ve(t){return Object.keys(t||{}).reduce(function(e,n){return e+"".concat(n,": ").concat(t[n],";")},"")}function ze(t){return t.size!==_.size||t.x!==_.x||t.y!==_.y||t.rotate!==_.rotate||t.flipX||t.flipY}function Xt(t){var e=t.transform,n=t.containerWidth,r=t.iconWidth,i={transform:"translate(".concat(n/2," 256)")},a="translate(".concat(e.x*32,", ").concat(e.y*32,") "),s="scale(".concat(e.size/16*(e.flipX?-1:1),", ").concat(e.size/16*(e.flipY?-1:1),") "),o="rotate(".concat(e.rotate," 0 0)"),l={transform:"".concat(a," ").concat(s," ").concat(o)},u={transform:"translate(".concat(r/2*-1," -256)")};return{outer:i,inner:l,path:u}}function Vn(t){var e=t.transform,n=t.width,r=n===void 0?Te:n,i=t.height,a=i===void 0?Te:i,s=t.startCentered,o=s===void 0?!1:s,l="";return o&&jt?l+="translate(".concat(e.x/j-r/2,"em, ").concat(e.y/j-a/2,"em) "):o?l+="translate(calc(-50% + ".concat(e.x/j,"em), calc(-50% + ").concat(e.y/j,"em)) "):l+="translate(".concat(e.x/j,"em, ").concat(e.y/j,"em) "),l+="scale(".concat(e.size/j*(e.flipX?-1:1),", ").concat(e.size/j*(e.flipY?-1:1),") "),l+="rotate(".concat(e.rotate,"deg) "),l}var $e={x:0,y:0,width:"100%",height:"100%"};function Kt(t){var e=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!0;return t.attributes&&(t.attributes.fill||e)&&(t.attributes.fill="black"),t}function Hn(t){return t.tag==="g"?t.children:[t]}function Wn(t){var e=t.children,n=t.attributes,r=t.main,i=t.mask,a=t.transform,s=r.width,o=r.icon,l=i.width,u=i.icon,c=Xt({transform:a,containerWidth:l,iconWidth:s}),d={tag:"rect",attributes:m({},$e,{fill:"white"})},g=o.children?{children:o.children.map(Kt)}:{},p={tag:"g",attributes:m({},c.inner),children:[Kt(m({tag:o.tag,attributes:m({},o.attributes,c.path)},g))]},y={tag:"g",attributes:m({},c.outer),children:[p]},b="mask-".concat(J()),k="clip-".concat(J()),R={tag:"mask",attributes:m({},$e,{id:b,maskUnits:"userSpaceOnUse",maskContentUnits:"userSpaceOnUse"}),children:[d,y]},P={tag:"defs",children:[{tag:"clipPath",attributes:{id:k},children:Hn(u)},R]};return e.push(P,{tag:"rect",attributes:m({fill:"currentColor","clip-path":"url(#".concat(k,")"),mask:"url(#".concat(b,")")},$e)}),{children:e,attributes:n}}function Gn(t){var e=t.children,n=t.attributes,r=t.main,i=t.transform,a=t.styles,s=ve(a);if(s.length>0&&(n.style=s),ze(i)){var o=Xt({transform:i,containerWidth:r.width,iconWidth:r.width});e.push({tag:"g",attributes:m({},o.outer),children:[{tag:"g",attributes:m({},o.inner),children:[{tag:r.icon.tag,children:r.icon.children,attributes:m({},r.icon.attributes,o.path)}]}]})}else e.push(r.icon);return{children:e,attributes:n}}function Yn(t){var e=t.children,n=t.main,r=t.mask,i=t.attributes,a=t.styles,s=t.transform;if(ze(s)&&n.found&&!r.found){var o=n.width,l=n.height,u={x:o/l/2,y:.5};i.style=ve(m({},a,{"transform-origin":"".concat(u.x+s.x/16,"em ").concat(u.y+s.y/16,"em")}))}return[{tag:"svg",attributes:i,children:e}]}function qn(t){var e=t.prefix,n=t.iconName,r=t.children,i=t.attributes,a=t.symbol,s=a===!0?"".concat(e,"-").concat(h.familyPrefix,"-").concat(n):a;return[{tag:"svg",attributes:{style:"display: none;"},children:[{tag:"symbol",attributes:m({},i,{id:s}),children:r}]}]}function Fe(t){var e=t.icons,n=e.main,r=e.mask,i=t.prefix,a=t.iconName,s=t.transform,o=t.symbol,l=t.title,u=t.extra,c=t.watchable,d=c===void 0?!1:c,g=r.found?r:n,p=g.width,y=g.height,b="fa-w-".concat(Math.ceil(p/y*16)),k=[h.replacementClass,a?"".concat(h.familyPrefix,"-").concat(a):"",b].filter(function(en){return u.classes.indexOf(en)===-1}).concat(u.classes).join(" "),R={children:[],attributes:m({},u.attributes,{"data-prefix":i,"data-icon":a,class:k,role:u.attributes.role||"img",xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 ".concat(p," ").concat(y)})};d&&(R.attributes[H]=""),l&&R.children.push({tag:"title",attributes:{id:R.attributes["aria-labelledby"]||"title-".concat(J())},children:[l]});var P=m({},R,{prefix:i,iconName:a,main:n,mask:r,transform:s,symbol:o,styles:u.styles}),U=r.found&&n.found?Wn(P):Gn(P),Ae=U.children,Zr=U.attributes;return P.children=Ae,P.attributes=Zr,o?qn(P):Yn(P)}function Jt(t){var e=t.content,n=t.width,r=t.height,i=t.transform,a=t.title,s=t.extra,o=t.watchable,l=o===void 0?!1:o,u=m({},s.attributes,a?{title:a}:{},{class:s.classes.join(" ")});l&&(u[H]="");var c=m({},s.styles);ze(i)&&(c.transform=Vn({transform:i,startCentered:!0,width:n,height:r}),c["-webkit-transform"]=c.transform);var d=ve(c);d.length>0&&(u.style=d);var g=[];return g.push({tag:"span",attributes:u,children:[e]}),a&&g.push({tag:"span",attributes:{class:"sr-only"},children:[a]}),g}function Bn(t){var e=t.content,n=t.title,r=t.extra,i=m({},r.attributes,n?{title:n}:{},{class:r.classes.join(" ")}),a=ve(r.styles);a.length>0&&(i.style=a);var s=[];return s.push({tag:"span",attributes:i,children:[e]}),n&&s.push({tag:"span",attributes:{class:"sr-only"},children:[n]}),s}var Qt=function(){},De=h.measurePerformance&&fe&&fe.mark&&fe.measure?fe:{mark:Qt,measure:Qt},Q='FA "5.11.2"',Xn=function(e){return De.mark("".concat(Q," ").concat(e," begins")),function(){return Zt(e)}},Zt=function(e){De.mark("".concat(Q," ").concat(e," ends")),De.measure("".concat(Q," ").concat(e),"".concat(Q," ").concat(e," begins"),"".concat(Q," ").concat(e," ends"))},Ue={begin:Xn,end:Zt},Kn=function(e,n){return function(r,i,a,s){return e.call(n,r,i,a,s)}},Ve=function(e,n,r,i){var a=Object.keys(e),s=a.length,o=i!==void 0?Kn(n,i):n,l,u,c;for(r===void 0?(l=1,c=e[a[0]]):(l=0,c=r);l<s;l++)u=a[l],c=o(c,e[u],u,e);return c};function er(t){for(var e="",n=0;n<t.length;n++){var r=t.charCodeAt(n).toString(16);e+=("000"+r).slice(-4)}return e}function tr(t,e){var n=arguments.length>2&&arguments[2]!==void 0?arguments[2]:{},r=n.skipHooks,i=r===void 0?!1:r,a=Object.keys(e).reduce(function(s,o){var l=e[o],u=!!l.icon;return u?s[l.iconName]=l.icon:s[o]=l,s},{});typeof A.hooks.addPack=="function"&&!i?A.hooks.addPack(t,a):A.styles[t]=m({},A.styles[t]||{},a),t==="fas"&&tr("fa",e)}var rr=A.styles,Jn=A.shims,nr={},ir={},ar={},sr=function(){var e=function(i){return Ve(rr,function(a,s,o){return a[o]=Ve(s,i,{}),a},{})};nr=e(function(r,i,a){return i[3]&&(r[i[3]]=a),r}),ir=e(function(r,i,a){var s=i[2];return r[a]=a,s.forEach(function(o){r[o]=a}),r});var n="far"in rr;ar=Ve(Jn,function(r,i){var a=i[0],s=i[1],o=i[2];return s==="far"&&!n&&(s="fas"),r[a]={prefix:s,iconName:o},r},{})};sr();function or(t,e){return(nr[t]||{})[e]}function Qn(t,e){return(ir[t]||{})[e]}function Zn(t){return ar[t]||{prefix:null,iconName:null}}var ei=A.styles,He=function(){return{prefix:null,iconName:null,rest:[]}};function We(t){return t.reduce(function(e,n){var r=Dn(h.familyPrefix,n);if(ei[n])e.prefix=n;else if(h.autoFetchSvg&&["fas","far","fal","fad","fab","fa"].indexOf(n)>-1)e.prefix=n;else if(r){var i=e.prefix==="fa"?Zn(r):{};e.iconName=i.iconName||r,e.prefix=i.prefix||e.prefix}else n!==h.replacementClass&&n.indexOf("fa-w-")!==0&&e.rest.push(n);return e},He())}function lr(t,e,n){if(t&&t[e]&&t[e][n])return{prefix:e,iconName:n,icon:t[e][n]}}function G(t){var e=t.tag,n=t.attributes,r=n===void 0?{}:n,i=t.children,a=i===void 0?[]:i;return typeof t=="string"?Bt(t):"<".concat(e," ").concat(Un(r),">").concat(a.map(G).join(""),"</").concat(e,">")}var ti=function(){};function fr(t){var e=t.getAttribute?t.getAttribute(H):null;return typeof e=="string"}function ri(){if(h.autoReplaceSvg===!0)return ge.replace;var t=ge[h.autoReplaceSvg];return t||ge.replace}var ge={replace:function(e){var n=e[0],r=e[1],i=r.map(function(s){return G(s)}).join(`
`);if(n.parentNode&&n.outerHTML)n.outerHTML=i+(h.keepOriginalSource&&n.tagName.toLowerCase()!=="svg"?"<!-- ".concat(n.outerHTML," -->"):"");else if(n.parentNode){var a=document.createElement("span");n.parentNode.replaceChild(a,n),a.outerHTML=i}},nest:function(e){var n=e[0],r=e[1];if(~Le(n).indexOf(h.replacementClass))return ge.replace(e);var i=new RegExp("".concat(h.familyPrefix,"-.*"));delete r[0].attributes.style,delete r[0].attributes.id;var a=r[0].attributes.class.split(" ").reduce(function(o,l){return l===h.replacementClass||l.match(i)?o.toSvg.push(l):o.toNode.push(l),o},{toNode:[],toSvg:[]});r[0].attributes.class=a.toSvg.join(" ");var s=r.map(function(o){return G(o)}).join(`
`);n.setAttribute("class",a.toNode.join(" ")),n.setAttribute(H,""),n.innerHTML=s}};function ur(t){t()}function cr(t,e){var n=typeof e=="function"?e:ti;if(t.length===0)n();else{var r=ur;h.mutateApproach===gn&&(r=I.requestAnimationFrame||ur),r(function(){var i=ri(),a=Ue.begin("mutate");t.map(i),a(),n()})}}var Ge=!1;function ni(){Ge=!0}function dr(){Ge=!1}var me=null;function ii(t){if(!!It&&!!h.observeMutations){var e=t.treeCallback,n=t.nodeCallback,r=t.pseudoElementsCallback,i=t.observeMutationsRoot,a=i===void 0?w:i;me=new It(function(s){Ge||W(s).forEach(function(o){if(o.type==="childList"&&o.addedNodes.length>0&&!fr(o.addedNodes[0])&&(h.searchPseudoElements&&r(o.target),e(o.target)),o.type==="attributes"&&o.target.parentNode&&h.searchPseudoElements&&r(o.target.parentNode),o.type==="attributes"&&fr(o.target)&&~Sn.indexOf(o.attributeName))if(o.attributeName==="class"){var l=We(Le(o.target)),u=l.prefix,c=l.iconName;u&&o.target.setAttribute("data-prefix",u),c&&o.target.setAttribute("data-icon",c)}else n(o.target)})}),!!O&&me.observe(a,{childList:!0,attributes:!0,characterData:!0,subtree:!0})}}function ai(){!me||me.disconnect()}function si(t){var e=t.getAttribute("style"),n=[];return e&&(n=e.split(";").reduce(function(r,i){var a=i.split(":"),s=a[0],o=a.slice(1);return s&&o.length>0&&(r[s]=o.join(":").trim()),r},{})),n}function oi(t){var e=t.getAttribute("data-prefix"),n=t.getAttribute("data-icon"),r=t.innerText!==void 0?t.innerText.trim():"",i=We(Le(t));return e&&n&&(i.prefix=e,i.iconName=n),i.prefix&&r.length>1?i.iconName=Qn(i.prefix,t.innerText):i.prefix&&r.length===1&&(i.iconName=or(i.prefix,er(t.innerText))),i}var hr=function(e){var n={size:16,x:0,y:0,flipX:!1,flipY:!1,rotate:0};return e?e.toLowerCase().split(" ").reduce(function(r,i){var a=i.toLowerCase().split("-"),s=a[0],o=a.slice(1).join("-");if(s&&o==="h")return r.flipX=!0,r;if(s&&o==="v")return r.flipY=!0,r;if(o=parseFloat(o),isNaN(o))return r;switch(s){case"grow":r.size=r.size+o;break;case"shrink":r.size=r.size-o;break;case"left":r.x=r.x-o;break;case"right":r.x=r.x+o;break;case"up":r.y=r.y-o;break;case"down":r.y=r.y+o;break;case"rotate":r.rotate=r.rotate+o;break}return r},n):n};function li(t){return hr(t.getAttribute("data-fa-transform"))}function fi(t){var e=t.getAttribute("data-fa-symbol");return e===null?!1:e===""?!0:e}function ui(t){var e=W(t.attributes).reduce(function(r,i){return r.name!=="class"&&r.name!=="style"&&(r[i.name]=i.value),r},{}),n=t.getAttribute("title");return h.autoA11y&&(n?e["aria-labelledby"]="".concat(h.replacementClass,"-title-").concat(J()):(e["aria-hidden"]="true",e.focusable="false")),e}function ci(t){var e=t.getAttribute("data-fa-mask");return e?We(e.split(" ").map(function(n){return n.trim()})):He()}function di(){return{iconName:null,title:null,prefix:null,transform:_,symbol:!1,mask:null,extra:{classes:[],styles:{},attributes:{}}}}function hi(t){var e=oi(t),n=e.iconName,r=e.prefix,i=e.rest,a=si(t),s=li(t),o=fi(t),l=ui(t),u=ci(t);return{iconName:n,title:t.getAttribute("title"),prefix:r,transform:s,symbol:o,mask:u,extra:{classes:i,styles:a,attributes:l}}}function Z(t){this.name="MissingIcon",this.message=t||"Icon unavailable",this.stack=new Error().stack}Z.prototype=Object.create(Error.prototype);Z.prototype.constructor=Z;var pe={fill:"currentColor"},vr={attributeType:"XML",repeatCount:"indefinite",dur:"2s"},vi={tag:"path",attributes:m({},pe,{d:"M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"})},Ye=m({},vr,{attributeName:"opacity"}),gi={tag:"circle",attributes:m({},pe,{cx:"256",cy:"364",r:"28"}),children:[{tag:"animate",attributes:m({},vr,{attributeName:"r",values:"28;14;28;28;14;28;"})},{tag:"animate",attributes:m({},Ye,{values:"1;0;1;1;0;1;"})}]},mi={tag:"path",attributes:m({},pe,{opacity:"1",d:"M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"}),children:[{tag:"animate",attributes:m({},Ye,{values:"1;0;0;0;0;1;"})}]},pi={tag:"path",attributes:m({},pe,{opacity:"0",d:"M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"}),children:[{tag:"animate",attributes:m({},Ye,{values:"0;0;1;1;0;0;"})}]},yi={tag:"g",children:[vi,gi,mi,pi]},qe=A.styles;function Be(t){var e=t[0],n=t[1],r=t.slice(4),i=Ce(r,1),a=i[0],s=null;return Array.isArray(a)?s={tag:"g",attributes:{class:"".concat(h.familyPrefix,"-").concat(z.GROUP)},children:[{tag:"path",attributes:{class:"".concat(h.familyPrefix,"-").concat(z.SECONDARY),fill:"currentColor",d:a[0]}},{tag:"path",attributes:{class:"".concat(h.familyPrefix,"-").concat(z.PRIMARY),fill:"currentColor",d:a[1]}}]}:s={tag:"path",attributes:{fill:"currentColor",d:a}},{found:!0,width:e,height:n,icon:s}}function Xe(t,e){return new C(function(n,r){var i={found:!1,width:512,height:512,icon:yi};if(t&&e&&qe[e]&&qe[e][t]){var a=qe[e][t];return n(Be(a))}V(I.FontAwesomeKitConfig)==="object"&&typeof window.FontAwesomeKitConfig.token=="string"&&I.FontAwesomeKitConfig.token,t&&e&&!h.showMissingIcons?r(new Z("Icon is missing for prefix ".concat(e," with icon name ").concat(t))):n(i)})}var bi=A.styles;function wi(t,e){var n=e.iconName,r=e.title,i=e.prefix,a=e.transform,s=e.symbol,o=e.mask,l=e.extra;return new C(function(u,c){C.all([Xe(n,i),Xe(o.iconName,o.prefix)]).then(function(d){var g=Ce(d,2),p=g[0],y=g[1];u([t,Fe({icons:{main:p,mask:y},prefix:i,iconName:n,transform:a,symbol:s,mask:y,title:r,extra:l,watchable:!0})])})})}function xi(t,e){var n=e.title,r=e.transform,i=e.extra,a=null,s=null;if(jt){var o=parseInt(getComputedStyle(t).fontSize,10),l=t.getBoundingClientRect();a=l.width/o,s=l.height/o}return h.autoA11y&&!n&&(i.attributes["aria-hidden"]="true"),C.resolve([t,Jt({content:t.innerHTML,width:a,height:s,transform:r,title:n,extra:i,watchable:!0})])}function gr(t){var e=hi(t);return~e.extra.classes.indexOf(zt)?xi(t,e):wi(t,e)}function mr(t){var e=arguments.length>1&&arguments[1]!==void 0?arguments[1]:null;if(!!O){var n=w.documentElement.classList,r=function(d){return n.add("".concat(Lt,"-").concat(d))},i=function(d){return n.remove("".concat(Lt,"-").concat(d))},a=h.autoFetchSvg?Object.keys(yn):Object.keys(bi),s=[".".concat(zt,":not([").concat(H,"])")].concat(a.map(function(c){return".".concat(c,":not([").concat(H,"])")})).join(", ");if(s.length!==0){var o=[];try{o=W(t.querySelectorAll(s))}catch(c){}if(o.length>0)r("pending"),i("complete");else return;var l=Ue.begin("onTree"),u=o.reduce(function(c,d){try{var g=gr(d);g&&c.push(g)}catch(p){pn||p instanceof Z&&console.error(p)}return c},[]);return new C(function(c,d){C.all(u).then(function(g){cr(g,function(){r("active"),r("complete"),i("pending"),typeof e=="function"&&e(),l(),c()})}).catch(function(){l(),d()})})}}}function ki(t){var e=arguments.length>1&&arguments[1]!==void 0?arguments[1]:null;gr(t).then(function(n){n&&cr([n],e)})}function pr(t,e){var n="".concat(dn).concat(e.replace(":","-"));return new C(function(r,i){if(t.getAttribute(n)!==null)return r();var a=W(t.children),s=a.filter(function(R){return R.getAttribute(_e)===e})[0],o=I.getComputedStyle(t,e),l=o.getPropertyValue("font-family").match(wn),u=o.getPropertyValue("font-weight");if(s&&!l)return t.removeChild(s),r();if(l){var c=o.getPropertyValue("content"),d=~["Solid","Regular","Light","Duotone","Brands"].indexOf(l[1])?bn[l[1].toLowerCase()]:xn[u],g=er(c.length===3?c.substr(1,1):c),p=or(d,g),y=p;if(p&&(!s||s.getAttribute(hn)!==d||s.getAttribute(vn)!==y)){t.setAttribute(n,y),s&&t.removeChild(s);var b=di(),k=b.extra;k.attributes[_e]=e,Xe(p,d).then(function(R){var P=Fe(m({},b,{icons:{main:R,mask:He()},prefix:d,iconName:y,extra:k,watchable:!0})),U=w.createElement("svg");e===":before"?t.insertBefore(U,t.firstChild):t.appendChild(U),U.outerHTML=P.map(function(Ae){return G(Ae)}).join(`
`),t.removeAttribute(n),r()}).catch(i)}else r()}else r()})}function Si(t){return C.all([pr(t,":before"),pr(t,":after")])}function Ri(t){return t.parentNode!==document.head&&!~mn.indexOf(t.tagName.toUpperCase())&&!t.getAttribute(_e)&&(!t.parentNode||t.parentNode.tagName!=="svg")}function yr(t){if(!!O)return new C(function(e,n){var r=W(t.querySelectorAll("*")).filter(Ri).map(Si),i=Ue.begin("searchPseudoElements");ni(),C.all(r).then(function(){i(),dr(),e()}).catch(function(){i(),dr(),n()})})}var Pi=`svg:not(:root).svg-inline--fa {
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
}`;function Ke(){var t=Mt,e=Nt,n=h.familyPrefix,r=h.replacementClass,i=Pi;if(n!==t||r!==e){var a=new RegExp("\\.".concat(t,"\\-"),"g"),s=new RegExp("\\--".concat(t,"\\-"),"g"),o=new RegExp("\\.".concat(e),"g");i=i.replace(a,".".concat(n,"-")).replace(s,"--".concat(n,"-")).replace(o,".".concat(r))}return i}var Ai=function(){function t(){tn(this,t),this.definitions={}}return rn(t,[{key:"add",value:function(){for(var n=this,r=arguments.length,i=new Array(r),a=0;a<r;a++)i[a]=arguments[a];var s=i.reduce(this._pullDefinitions,{});Object.keys(s).forEach(function(o){n.definitions[o]=m({},n.definitions[o]||{},s[o]),tr(o,s[o]),sr()})}},{key:"reset",value:function(){this.definitions={}}},{key:"_pullDefinitions",value:function(n,r){var i=r.prefix&&r.iconName&&r.icon?{0:r}:r;return Object.keys(i).map(function(a){var s=i[a],o=s.prefix,l=s.iconName,u=s.icon;n[o]||(n[o]={}),n[o][l]=u}),n}}]),t}();function ee(){h.autoAddCss&&!be&&(qt(Ke()),be=!0)}function ye(t,e){return Object.defineProperty(t,"abstract",{get:e}),Object.defineProperty(t,"html",{get:function(){return t.abstract.map(function(r){return G(r)})}}),Object.defineProperty(t,"node",{get:function(){if(!!O){var r=w.createElement("div");return r.innerHTML=t.html,r.children}}}),t}function Je(t){var e=t.prefix,n=e===void 0?"fa":e,r=t.iconName;if(!!r)return lr(br.definitions,n,r)||lr(A.styles,n,r)}function Ci(t){return function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},r=(e||{}).icon?e:Je(e||{}),i=n.mask;return i&&(i=(i||{}).icon?i:Je(i||{})),t(r,m({},n,{mask:i}))}}var br=new Ai,Oi=function(){h.autoReplaceSvg=!1,h.observeMutations=!1,ai()},be=!1,Ei={i2svg:function(){var e=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};if(O){ee();var n=e.node,r=n===void 0?w:n,i=e.callback,a=i===void 0?function(){}:i;return h.searchPseudoElements&&yr(r),mr(r,a)}else return C.reject("Operation requires a DOM of some kind.")},css:Ke,insertCss:function(){be||(qt(Ke()),be=!0)},watch:function(){var e=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{},n=e.autoReplaceSvgRoot,r=e.observeMutationsRoot;h.autoReplaceSvg===!1&&(h.autoReplaceSvg=!0),h.observeMutations=!0,Tn(function(){Li({autoReplaceSvgRoot:n}),ii({treeCallback:mr,nodeCallback:ki,pseudoElementsCallback:yr,observeMutationsRoot:r})})}},Ti={transform:function(e){return hr(e)}},_i=Ci(function(t){var e=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},n=e.transform,r=n===void 0?_:n,i=e.symbol,a=i===void 0?!1:i,s=e.mask,o=s===void 0?null:s,l=e.title,u=l===void 0?null:l,c=e.classes,d=c===void 0?[]:c,g=e.attributes,p=g===void 0?{}:g,y=e.styles,b=y===void 0?{}:y;if(!!t){var k=t.prefix,R=t.iconName,P=t.icon;return ye(m({type:"icon"},t),function(){return ee(),h.autoA11y&&(u?p["aria-labelledby"]="".concat(h.replacementClass,"-title-").concat(J()):(p["aria-hidden"]="true",p.focusable="false")),Fe({icons:{main:Be(P),mask:o?Be(o.icon):{found:!1,width:null,height:null,icon:{}}},prefix:k,iconName:R,transform:m({},_,r),symbol:a,title:u,extra:{attributes:p,styles:b,classes:d}})})}}),Ii=function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},r=n.transform,i=r===void 0?_:r,a=n.title,s=a===void 0?null:a,o=n.classes,l=o===void 0?[]:o,u=n.attributes,c=u===void 0?{}:u,d=n.styles,g=d===void 0?{}:d;return ye({type:"text",content:e},function(){return ee(),Jt({content:e,transform:m({},_,i),title:s,extra:{attributes:c,styles:g,classes:["".concat(h.familyPrefix,"-layers-text")].concat(Oe(l))}})})},ji=function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},r=n.title,i=r===void 0?null:r,a=n.classes,s=a===void 0?[]:a,o=n.attributes,l=o===void 0?{}:o,u=n.styles,c=u===void 0?{}:u;return ye({type:"counter",content:e},function(){return ee(),Bn({content:e.toString(),title:i,extra:{attributes:l,styles:c,classes:["".concat(h.familyPrefix,"-layers-counter")].concat(Oe(s))}})})},Mi=function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},r=n.classes,i=r===void 0?[]:r;return ye({type:"layer"},function(){ee();var a=[];return e(function(s){Array.isArray(s)?s.map(function(o){a=a.concat(o.abstract)}):a=a.concat(s.abstract)}),[{tag:"span",attributes:{class:["".concat(h.familyPrefix,"-layers")].concat(Oe(i)).join(" ")},children:a}]})},Ni={noAuto:Oi,config:h,dom:Ei,library:br,parse:Ti,findIconDefinition:Je,icon:_i,text:Ii,counter:ji,layer:Mi,toHtml:G},Li=function(){var e=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{},n=e.autoReplaceSvgRoot,r=n===void 0?w:n;(Object.keys(A.styles).length>0||h.autoFetchSvg)&&O&&h.autoReplaceSvg&&Ni.dom.i2svg({node:r})},Us={prefix:"fas",iconName:"times",icon:[352,512,[],"f00d","M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"]},Vs={prefix:"fas",iconName:"window-maximize",icon:[512,512,[],"f2d0","M464 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h416c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zm-16 160H64v-84c0-6.6 5.4-12 12-12h360c6.6 0 12 5.4 12 12v84z"]},Hs={prefix:"fas",iconName:"window-minimize",icon:[512,512,[],"f2d1","M464 352H48c-26.5 0-48 21.5-48 48v32c0 26.5 21.5 48 48 48h416c26.5 0 48-21.5 48-48v-32c0-26.5-21.5-48-48-48z"]};function x(){return x=Object.assign||function(t){for(var e=1;e<arguments.length;e++){var n=arguments[e];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(t[r]=n[r])}return t},x.apply(this,arguments)}var wr=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(t){return typeof t}:function(t){return t&&typeof Symbol=="function"&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},te=(typeof window=="undefined"?"undefined":wr(window))==="object"&&(typeof document=="undefined"?"undefined":wr(document))==="object"&&document.nodeType===9;function xr(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r)}}function kr(t,e,n){return e&&xr(t.prototype,e),n&&xr(t,n),t}function Qe(t,e){return Qe=Object.setPrototypeOf||function(r,i){return r.__proto__=i,r},Qe(t,e)}function Sr(t,e){t.prototype=Object.create(e.prototype),t.prototype.constructor=t,Qe(t,e)}function Rr(t){if(t===void 0)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}function zi(t,e){if(t==null)return{};var n={},r=Object.keys(t),i,a;for(a=0;a<r.length;a++)i=r[a],!(e.indexOf(i)>=0)&&(n[i]=t[i]);return n}var $i={}.constructor;function Ze(t){if(t==null||typeof t!="object")return t;if(Array.isArray(t))return t.map(Ze);if(t.constructor!==$i)return t;var e={};for(var n in t)e[n]=Ze(t[n]);return e}function we(t,e,n){t===void 0&&(t="unnamed");var r=n.jss,i=Ze(e),a=r.plugins.onCreateRule(t,i,n);return a||(t[0]==="@",null)}var Pr=function(e,n){for(var r="",i=0;i<e.length&&e[i]!=="!important";i++)r&&(r+=n),r+=e[i];return r},$=function(e,n){if(n===void 0&&(n=!1),!Array.isArray(e))return e;var r="";if(Array.isArray(e[0]))for(var i=0;i<e.length&&e[i]!=="!important";i++)r&&(r+=", "),r+=Pr(e[i]," ");else r=Pr(e,", ");return!n&&e[e.length-1]==="!important"&&(r+=" !important"),r};function re(t,e){for(var n="",r=0;r<e;r++)n+="  ";return n+t}function ne(t,e,n){n===void 0&&(n={});var r="";if(!e)return r;var i=n,a=i.indent,s=a===void 0?0:a,o=e.fallbacks;if(t&&s++,o)if(Array.isArray(o))for(var l=0;l<o.length;l++){var u=o[l];for(var c in u){var d=u[c];d!=null&&(r&&(r+=`
`),r+=re(c+": "+$(d)+";",s))}}else for(var g in o){var p=o[g];p!=null&&(r&&(r+=`
`),r+=re(g+": "+$(p)+";",s))}for(var y in e){var b=e[y];b!=null&&y!=="fallbacks"&&(r&&(r+=`
`),r+=re(y+": "+$(b)+";",s))}return!r&&!n.allowEmpty||!t?r:(s--,r&&(r=`
`+r+`
`),re(t+" {"+r,s)+re("}",s))}var Fi=/([[\].#*$><+~=|^:(),"'`\s])/g,Ar=typeof CSS!="undefined"&&CSS.escape,et=function(t){return Ar?Ar(t):t.replace(Fi,"\\$1")},Cr=function(){function t(n,r,i){this.type="style",this.key=void 0,this.isProcessed=!1,this.style=void 0,this.renderer=void 0,this.renderable=void 0,this.options=void 0;var a=i.sheet,s=i.Renderer;this.key=n,this.options=i,this.style=r,a?this.renderer=a.renderer:s&&(this.renderer=new s)}var e=t.prototype;return e.prop=function(r,i,a){if(i===void 0)return this.style[r];var s=a?a.force:!1;if(!s&&this.style[r]===i)return this;var o=i;(!a||a.process!==!1)&&(o=this.options.jss.plugins.onChangeValue(i,r,this));var l=o==null||o===!1,u=r in this.style;if(l&&!u&&!s)return this;var c=l&&u;if(c?delete this.style[r]:this.style[r]=o,this.renderable&&this.renderer)return c?this.renderer.removeProperty(this.renderable,r):this.renderer.setProperty(this.renderable,r,o),this;var d=this.options.sheet;return d&&d.attached,this},t}(),tt=function(t){Sr(e,t);function e(r,i,a){var s;s=t.call(this,r,i,a)||this,s.selectorText=void 0,s.id=void 0,s.renderable=void 0;var o=a.selector,l=a.scoped,u=a.sheet,c=a.generateId;return o?s.selectorText=o:l!==!1&&(s.id=c(Rr(Rr(s)),u),s.selectorText="."+et(s.id)),s}var n=e.prototype;return n.applyTo=function(i){var a=this.renderer;if(a){var s=this.toJSON();for(var o in s)a.setProperty(i,o,s[o])}return this},n.toJSON=function(){var i={};for(var a in this.style){var s=this.style[a];typeof s!="object"?i[a]=s:Array.isArray(s)&&(i[a]=$(s))}return i},n.toString=function(i){var a=this.options.sheet,s=a?a.options.link:!1,o=s?x({},i,{allowEmpty:!0}):i;return ne(this.selectorText,this.style,o)},kr(e,[{key:"selector",set:function(i){if(i!==this.selectorText){this.selectorText=i;var a=this.renderer,s=this.renderable;if(!(!s||!a)){var o=a.setSelector(s,i);o||a.replaceRule(s,this)}}},get:function(){return this.selectorText}}]),e}(Cr),Di={onCreateRule:function(e,n,r){return e[0]==="@"||r.parent&&r.parent.type==="keyframes"?null:new tt(e,n,r)}},rt={indent:1,children:!0},Ui=/@([\w-]+)/,Vi=function(){function t(n,r,i){this.type="conditional",this.at=void 0,this.key=void 0,this.query=void 0,this.rules=void 0,this.options=void 0,this.isProcessed=!1,this.renderable=void 0,this.key=n;var a=n.match(Ui);this.at=a?a[1]:"unknown",this.query=i.name||"@"+this.at,this.options=i,this.rules=new xe(x({},i,{parent:this}));for(var s in r)this.rules.add(s,r[s]);this.rules.process()}var e=t.prototype;return e.getRule=function(r){return this.rules.get(r)},e.indexOf=function(r){return this.rules.indexOf(r)},e.addRule=function(r,i,a){var s=this.rules.add(r,i,a);return s?(this.options.jss.plugins.onProcessRule(s),s):null},e.toString=function(r){if(r===void 0&&(r=rt),r.indent==null&&(r.indent=rt.indent),r.children==null&&(r.children=rt.children),r.children===!1)return this.query+" {}";var i=this.rules.toString(r);return i?this.query+` {
`+i+`
}`:""},t}(),Hi=/@media|@supports\s+/,Wi={onCreateRule:function(e,n,r){return Hi.test(e)?new Vi(e,n,r):null}},nt={indent:1,children:!0},Gi=/@keyframes\s+([\w-]+)/,it=function(){function t(n,r,i){this.type="keyframes",this.at="@keyframes",this.key=void 0,this.name=void 0,this.id=void 0,this.rules=void 0,this.options=void 0,this.isProcessed=!1,this.renderable=void 0;var a=n.match(Gi);a&&a[1]?this.name=a[1]:this.name="noname",this.key=this.type+"-"+this.name,this.options=i;var s=i.scoped,o=i.sheet,l=i.generateId;this.id=s===!1?this.name:et(l(this,o)),this.rules=new xe(x({},i,{parent:this}));for(var u in r)this.rules.add(u,r[u],x({},i,{parent:this}));this.rules.process()}var e=t.prototype;return e.toString=function(r){if(r===void 0&&(r=nt),r.indent==null&&(r.indent=nt.indent),r.children==null&&(r.children=nt.children),r.children===!1)return this.at+" "+this.id+" {}";var i=this.rules.toString(r);return i&&(i=`
`+i+`
`),this.at+" "+this.id+" {"+i+"}"},t}(),Yi=/@keyframes\s+/,qi=/\$([\w-]+)/g,at=function(e,n){return typeof e=="string"?e.replace(qi,function(r,i){return i in n?n[i]:r}):e},Or=function(e,n,r){var i=e[n],a=at(i,r);a!==i&&(e[n]=a)},Bi={onCreateRule:function(e,n,r){return typeof e=="string"&&Yi.test(e)?new it(e,n,r):null},onProcessStyle:function(e,n,r){return n.type!=="style"||!r||("animation-name"in e&&Or(e,"animation-name",r.keyframes),"animation"in e&&Or(e,"animation",r.keyframes)),e},onChangeValue:function(e,n,r){var i=r.options.sheet;if(!i)return e;switch(n){case"animation":return at(e,i.keyframes);case"animation-name":return at(e,i.keyframes);default:return e}}},Xi=function(t){Sr(e,t);function e(){for(var r,i=arguments.length,a=new Array(i),s=0;s<i;s++)a[s]=arguments[s];return r=t.call.apply(t,[this].concat(a))||this,r.renderable=void 0,r}var n=e.prototype;return n.toString=function(i){var a=this.options.sheet,s=a?a.options.link:!1,o=s?x({},i,{allowEmpty:!0}):i;return ne(this.key,this.style,o)},e}(Cr),Ki={onCreateRule:function(e,n,r){return r.parent&&r.parent.type==="keyframes"?new Xi(e,n,r):null}},Ji=function(){function t(n,r,i){this.type="font-face",this.at="@font-face",this.key=void 0,this.style=void 0,this.options=void 0,this.isProcessed=!1,this.renderable=void 0,this.key=n,this.style=r,this.options=i}var e=t.prototype;return e.toString=function(r){if(Array.isArray(this.style)){for(var i="",a=0;a<this.style.length;a++)i+=ne(this.at,this.style[a]),this.style[a+1]&&(i+=`
`);return i}return ne(this.at,this.style,r)},t}(),Qi=/@font-face/,Zi={onCreateRule:function(e,n,r){return Qi.test(e)?new Ji(e,n,r):null}},ea=function(){function t(n,r,i){this.type="viewport",this.at="@viewport",this.key=void 0,this.style=void 0,this.options=void 0,this.isProcessed=!1,this.renderable=void 0,this.key=n,this.style=r,this.options=i}var e=t.prototype;return e.toString=function(r){return ne(this.key,this.style,r)},t}(),ta={onCreateRule:function(e,n,r){return e==="@viewport"||e==="@-ms-viewport"?new ea(e,n,r):null}},ra=function(){function t(n,r,i){this.type="simple",this.key=void 0,this.value=void 0,this.options=void 0,this.isProcessed=!1,this.renderable=void 0,this.key=n,this.value=r,this.options=i}var e=t.prototype;return e.toString=function(r){if(Array.isArray(this.value)){for(var i="",a=0;a<this.value.length;a++)i+=this.key+" "+this.value[a]+";",this.value[a+1]&&(i+=`
`);return i}return this.key+" "+this.value+";"},t}(),na={"@charset":!0,"@import":!0,"@namespace":!0},ia={onCreateRule:function(e,n,r){return e in na?new ra(e,n,r):null}},Er=[Di,Wi,Bi,Ki,Zi,ta,ia],aa={process:!0},Tr={force:!0,process:!0},xe=function(){function t(n){this.map={},this.raw={},this.index=[],this.counter=0,this.options=void 0,this.classes=void 0,this.keyframes=void 0,this.options=n,this.classes=n.classes,this.keyframes=n.keyframes}var e=t.prototype;return e.add=function(r,i,a){var s=this.options,o=s.parent,l=s.sheet,u=s.jss,c=s.Renderer,d=s.generateId,g=s.scoped,p=x({classes:this.classes,parent:o,sheet:l,jss:u,Renderer:c,generateId:d,scoped:g,name:r,keyframes:this.keyframes,selector:void 0},a),y=r;r in this.raw&&(y=r+"-d"+this.counter++),this.raw[y]=i,y in this.classes&&(p.selector="."+et(this.classes[y]));var b=we(y,i,p);if(!b)return null;this.register(b);var k=p.index===void 0?this.index.length:p.index;return this.index.splice(k,0,b),b},e.get=function(r){return this.map[r]},e.remove=function(r){this.unregister(r),delete this.raw[r.key],this.index.splice(this.index.indexOf(r),1)},e.indexOf=function(r){return this.index.indexOf(r)},e.process=function(){var r=this.options.jss.plugins;this.index.slice(0).forEach(r.onProcessRule,r)},e.register=function(r){this.map[r.key]=r,r instanceof tt?(this.map[r.selector]=r,r.id&&(this.classes[r.key]=r.id)):r instanceof it&&this.keyframes&&(this.keyframes[r.name]=r.id)},e.unregister=function(r){delete this.map[r.key],r instanceof tt?(delete this.map[r.selector],delete this.classes[r.key]):r instanceof it&&delete this.keyframes[r.name]},e.update=function(){var r,i,a;if(typeof(arguments.length<=0?void 0:arguments[0])=="string"?(r=arguments.length<=0?void 0:arguments[0],i=arguments.length<=1?void 0:arguments[1],a=arguments.length<=2?void 0:arguments[2]):(i=arguments.length<=0?void 0:arguments[0],a=arguments.length<=1?void 0:arguments[1],r=null),r)this.updateOne(this.map[r],i,a);else for(var s=0;s<this.index.length;s++)this.updateOne(this.index[s],i,a)},e.updateOne=function(r,i,a){a===void 0&&(a=aa);var s=this.options,o=s.jss.plugins,l=s.sheet;if(r.rules instanceof t){r.rules.update(i,a);return}var u=r,c=u.style;if(o.onUpdate(i,r,l,a),a.process&&c&&c!==u.style){o.onProcessStyle(u.style,u,l);for(var d in u.style){var g=u.style[d],p=c[d];g!==p&&u.prop(d,g,Tr)}for(var y in c){var b=u.style[y],k=c[y];b==null&&b!==k&&u.prop(y,null,Tr)}}},e.toString=function(r){for(var i="",a=this.options.sheet,s=a?a.options.link:!1,o=0;o<this.index.length;o++){var l=this.index[o],u=l.toString(r);!u&&!s||(i&&(i+=`
`),i+=u)}return i},t}(),_r=function(){function t(n,r){this.options=void 0,this.deployed=void 0,this.attached=void 0,this.rules=void 0,this.renderer=void 0,this.classes=void 0,this.keyframes=void 0,this.queue=void 0,this.attached=!1,this.deployed=!1,this.classes={},this.keyframes={},this.options=x({},r,{sheet:this,parent:this,classes:this.classes,keyframes:this.keyframes}),r.Renderer&&(this.renderer=new r.Renderer(this)),this.rules=new xe(this.options);for(var i in n)this.rules.add(i,n[i]);this.rules.process()}var e=t.prototype;return e.attach=function(){return this.attached?this:(this.renderer&&this.renderer.attach(),this.attached=!0,this.deployed||this.deploy(),this)},e.detach=function(){return this.attached?(this.renderer&&this.renderer.detach(),this.attached=!1,this):this},e.addRule=function(r,i,a){var s=this.queue;this.attached&&!s&&(this.queue=[]);var o=this.rules.add(r,i,a);return o?(this.options.jss.plugins.onProcessRule(o),this.attached?(this.deployed&&(s?s.push(o):(this.insertRule(o),this.queue&&(this.queue.forEach(this.insertRule,this),this.queue=void 0))),o):(this.deployed=!1,o)):null},e.insertRule=function(r){this.renderer&&this.renderer.insertRule(r)},e.addRules=function(r,i){var a=[];for(var s in r){var o=this.addRule(s,r[s],i);o&&a.push(o)}return a},e.getRule=function(r){return this.rules.get(r)},e.deleteRule=function(r){var i=typeof r=="object"?r:this.rules.get(r);return!i||this.attached&&!i.renderable?!1:(this.rules.remove(i),this.attached&&i.renderable&&this.renderer?this.renderer.deleteRule(i.renderable):!0)},e.indexOf=function(r){return this.rules.indexOf(r)},e.deploy=function(){return this.renderer&&this.renderer.deploy(),this.deployed=!0,this},e.update=function(){var r;return(r=this.rules).update.apply(r,arguments),this},e.updateOne=function(r,i,a){return this.rules.updateOne(r,i,a),this},e.toString=function(r){return this.rules.toString(r)},t}(),sa=function(){function t(){this.plugins={internal:[],external:[]},this.registry=void 0}var e=t.prototype;return e.onCreateRule=function(r,i,a){for(var s=0;s<this.registry.onCreateRule.length;s++){var o=this.registry.onCreateRule[s](r,i,a);if(o)return o}return null},e.onProcessRule=function(r){if(!r.isProcessed){for(var i=r.options.sheet,a=0;a<this.registry.onProcessRule.length;a++)this.registry.onProcessRule[a](r,i);r.style&&this.onProcessStyle(r.style,r,i),r.isProcessed=!0}},e.onProcessStyle=function(r,i,a){for(var s=0;s<this.registry.onProcessStyle.length;s++)i.style=this.registry.onProcessStyle[s](i.style,i,a)},e.onProcessSheet=function(r){for(var i=0;i<this.registry.onProcessSheet.length;i++)this.registry.onProcessSheet[i](r)},e.onUpdate=function(r,i,a,s){for(var o=0;o<this.registry.onUpdate.length;o++)this.registry.onUpdate[o](r,i,a,s)},e.onChangeValue=function(r,i,a){for(var s=r,o=0;o<this.registry.onChangeValue.length;o++)s=this.registry.onChangeValue[o](s,i,a);return s},e.use=function(r,i){i===void 0&&(i={queue:"external"});var a=this.plugins[i.queue];a.indexOf(r)===-1&&(a.push(r),this.registry=[].concat(this.plugins.external,this.plugins.internal).reduce(function(s,o){for(var l in o)l in s&&s[l].push(o[l]);return s},{onCreateRule:[],onProcessRule:[],onProcessStyle:[],onProcessSheet:[],onChangeValue:[],onUpdate:[]}))},t}(),oa=function(){function t(){this.registry=[]}var e=t.prototype;return e.add=function(r){var i=this.registry,a=r.options.index;if(i.indexOf(r)===-1){if(i.length===0||a>=this.index){i.push(r);return}for(var s=0;s<i.length;s++)if(i[s].options.index>a){i.splice(s,0,r);return}}},e.reset=function(){this.registry=[]},e.remove=function(r){var i=this.registry.indexOf(r);this.registry.splice(i,1)},e.toString=function(r){for(var i=r===void 0?{}:r,a=i.attached,s=zi(i,["attached"]),o="",l=0;l<this.registry.length;l++){var u=this.registry[l];a!=null&&u.attached!==a||(o&&(o+=`
`),o+=u.toString(s))}return o},kr(t,[{key:"index",get:function(){return this.registry.length===0?0:this.registry[this.registry.length-1].options.index}}]),t}(),ie=new oa,st=typeof globalThis!="undefined"?globalThis:typeof window!="undefined"&&window.Math===Math?window:typeof self!="undefined"&&self.Math===Math?self:Function("return this")(),ot="2f1acc6c3a606b082e5eef5e54414ffb";st[ot]==null&&(st[ot]=0);var Ir=st[ot]++,jr=function(e){e===void 0&&(e={});var n=0,r=function(a,s){n+=1;var o="",l="";return s&&(s.options.classNamePrefix&&(l=s.options.classNamePrefix),s.options.jss.id!=null&&(o=String(s.options.jss.id))),e.minify?""+(l||"c")+Ir+o+n:l+a.key+"-"+Ir+(o?"-"+o:"")+"-"+n};return r},Mr=function(e){var n;return function(){return n||(n=e()),n}},la=function(e,n){try{return e.attributeStyleMap?e.attributeStyleMap.get(n):e.style.getPropertyValue(n)}catch(r){return""}},fa=function(e,n,r){try{var i=r;if(Array.isArray(r)&&(i=$(r,!0),r[r.length-1]==="!important"))return e.style.setProperty(n,i,"important"),!0;e.attributeStyleMap?e.attributeStyleMap.set(n,i):e.style.setProperty(n,i)}catch(a){return!1}return!0},ua=function(e,n){try{e.attributeStyleMap?e.attributeStyleMap.delete(n):e.style.removeProperty(n)}catch(r){}},ca=function(e,n){return e.selectorText=n,e.selectorText===n},Nr=Mr(function(){return document.querySelector("head")});function da(t,e){for(var n=0;n<t.length;n++){var r=t[n];if(r.attached&&r.options.index>e.index&&r.options.insertionPoint===e.insertionPoint)return r}return null}function ha(t,e){for(var n=t.length-1;n>=0;n--){var r=t[n];if(r.attached&&r.options.insertionPoint===e.insertionPoint)return r}return null}function va(t){for(var e=Nr(),n=0;n<e.childNodes.length;n++){var r=e.childNodes[n];if(r.nodeType===8&&r.nodeValue.trim()===t)return r}return null}function ga(t){var e=ie.registry;if(e.length>0){var n=da(e,t);if(n&&n.renderer)return{parent:n.renderer.element.parentNode,node:n.renderer.element};if(n=ha(e,t),n&&n.renderer)return{parent:n.renderer.element.parentNode,node:n.renderer.element.nextSibling}}var r=t.insertionPoint;if(r&&typeof r=="string"){var i=va(r);if(i)return{parent:i.parentNode,node:i.nextSibling}}return!1}function ma(t,e){var n=e.insertionPoint,r=ga(e);if(r!==!1&&r.parent){r.parent.insertBefore(t,r.node);return}if(n&&typeof n.nodeType=="number"){var i=n,a=i.parentNode;a&&a.insertBefore(t,i.nextSibling);return}Nr().appendChild(t)}var pa=Mr(function(){var t=document.querySelector('meta[property="csp-nonce"]');return t?t.getAttribute("content"):null}),Lr=function(e,n,r){try{if("insertRule"in e){var i=e;i.insertRule(n,r)}else if("appendRule"in e){var a=e;a.appendRule(n)}}catch(s){return!1}return e.cssRules[r]},zr=function(e,n){var r=e.cssRules.length;return n===void 0||n>r?r:n},ya=function(){var e=document.createElement("style");return e.textContent=`
`,e},ba=function(){function t(n){this.getPropertyValue=la,this.setProperty=fa,this.removeProperty=ua,this.setSelector=ca,this.element=void 0,this.sheet=void 0,this.hasInsertedRules=!1,this.cssRules=[],n&&ie.add(n),this.sheet=n;var r=this.sheet?this.sheet.options:{},i=r.media,a=r.meta,s=r.element;this.element=s||ya(),this.element.setAttribute("data-jss",""),i&&this.element.setAttribute("media",i),a&&this.element.setAttribute("data-meta",a);var o=pa();o&&this.element.setAttribute("nonce",o)}var e=t.prototype;return e.attach=function(){if(!(this.element.parentNode||!this.sheet)){ma(this.element,this.sheet.options);var r=Boolean(this.sheet&&this.sheet.deployed);this.hasInsertedRules&&r&&(this.hasInsertedRules=!1,this.deploy())}},e.detach=function(){if(!!this.sheet){var r=this.element.parentNode;r&&r.removeChild(this.element),this.sheet.options.link&&(this.cssRules=[],this.element.textContent=`
`)}},e.deploy=function(){var r=this.sheet;if(!!r){if(r.options.link){this.insertRules(r.rules);return}this.element.textContent=`
`+r.toString()+`
`}},e.insertRules=function(r,i){for(var a=0;a<r.index.length;a++)this.insertRule(r.index[a],a,i)},e.insertRule=function(r,i,a){if(a===void 0&&(a=this.element.sheet),r.rules){var s=r,o=a;if(r.type==="conditional"||r.type==="keyframes"){var l=zr(a,i);if(o=Lr(a,s.toString({children:!1}),l),o===!1)return!1;this.refCssRule(r,l,o)}return this.insertRules(s.rules,o),o}var u=r.toString();if(!u)return!1;var c=zr(a,i),d=Lr(a,u,c);return d===!1?!1:(this.hasInsertedRules=!0,this.refCssRule(r,c,d),d)},e.refCssRule=function(r,i,a){r.renderable=a,r.options.parent instanceof _r&&(this.cssRules[i]=a)},e.deleteRule=function(r){var i=this.element.sheet,a=this.indexOf(r);return a===-1?!1:(i.deleteRule(a),this.cssRules.splice(a,1),!0)},e.indexOf=function(r){return this.cssRules.indexOf(r)},e.replaceRule=function(r,i){var a=this.indexOf(r);return a===-1?!1:(this.element.sheet.deleteRule(a),this.cssRules.splice(a,1),this.insertRule(i,a))},e.getRules=function(){return this.element.sheet.cssRules},t}(),wa=0,xa=function(){function t(n){this.id=wa++,this.version="10.7.1",this.plugins=new sa,this.options={id:{minify:!1},createGenerateId:jr,Renderer:te?ba:null,plugins:[]},this.generateId=jr({minify:!1});for(var r=0;r<Er.length;r++)this.plugins.use(Er[r],{queue:"internal"});this.setup(n)}var e=t.prototype;return e.setup=function(r){return r===void 0&&(r={}),r.createGenerateId&&(this.options.createGenerateId=r.createGenerateId),r.id&&(this.options.id=x({},this.options.id,r.id)),(r.createGenerateId||r.id)&&(this.generateId=this.options.createGenerateId(this.options.id)),r.insertionPoint!=null&&(this.options.insertionPoint=r.insertionPoint),"Renderer"in r&&(this.options.Renderer=r.Renderer),r.plugins&&this.use.apply(this,r.plugins),this},e.createStyleSheet=function(r,i){i===void 0&&(i={});var a=i,s=a.index;typeof s!="number"&&(s=ie.index===0?0:ie.index+1);var o=new _r(r,x({},i,{jss:this,generateId:i.generateId||this.generateId,insertionPoint:this.options.insertionPoint,Renderer:this.options.Renderer,index:s}));return this.plugins.onProcessSheet(o),o},e.removeStyleSheet=function(r){return r.detach(),ie.remove(r),this},e.createRule=function(r,i,a){if(i===void 0&&(i={}),a===void 0&&(a={}),typeof r=="object")return this.createRule(void 0,r,i);var s=x({},a,{name:r,jss:this,Renderer:this.options.Renderer});s.generateId||(s.generateId=this.generateId),s.classes||(s.classes={}),s.keyframes||(s.keyframes={});var o=we(r,i,s);return o&&this.plugins.onProcessRule(o),o},e.use=function(){for(var r=this,i=arguments.length,a=new Array(i),s=0;s<i;s++)a[s]=arguments[s];return a.forEach(function(o){r.plugins.use(o)}),this},t}();/**
 * A better abstraction over CSS.
 *
 * @copyright Oleg Isonen (Slobodskoi) / Isonen 2014-present
 * @website https://github.com/cssinjs/jss
 * @license MIT
 */var lt=typeof CSS=="object"&&CSS!=null&&"number"in CSS,ka=function(e){return new xa(e)},Sa=ka(),Ws=Sa,$r=Date.now(),ft="fnValues"+$r,ut="fnStyle"+ ++$r,Ra=function(){return{onCreateRule:function(n,r,i){if(typeof r!="function")return null;var a=we(n,{},i);return a[ut]=r,a},onProcessStyle:function(n,r){if(ft in r||ut in r)return n;var i={};for(var a in n){var s=n[a];typeof s=="function"&&(delete n[a],i[a]=s)}return r[ft]=i,n},onUpdate:function(n,r,i,a){var s=r,o=s[ut];o&&(s.style=o(n)||{});var l=s[ft];if(l)for(var u in l)s.prop(u,l[u](n),a)}}},Pa=Ra;function Aa(t){var e,n=t.Symbol;return typeof n=="function"?n.observable?e=n.observable:(e=n("observable"),n.observable=e):e="@@observable",e}var Y;typeof self!="undefined"?Y=self:typeof window!="undefined"?Y=window:typeof global!="undefined"?Y=global:typeof module!="undefined"?Y=module:Y=Function("return this")();var Fr=Aa(Y),Dr=function(e){return e&&e[Fr]&&e===e[Fr]()},Ca=function(e){return{onCreateRule:function(r,i,a){if(!Dr(i))return null;var s=i,o=we(r,{},a);return s.subscribe(function(l){for(var u in l)o.prop(u,l[u],e)}),o},onProcessRule:function(r){if(!(r&&r.type!=="style")){var i=r,a=i.style,s=function(c){var d=a[c];if(!Dr(d))return"continue";delete a[c],d.subscribe({next:function(p){i.prop(c,p,e)}})};for(var o in a)var l=s(o)}}}},Oa=Ca,Ea=/;\n/,Ta=function(e){for(var n={},r=e.split(Ea),i=0;i<r.length;i++){var a=(r[i]||"").trim();if(!!a){var s=a.indexOf(":");if(s!==-1){var o=a.substr(0,s).trim(),l=a.substr(s+1).trim();n[o]=l}}}return n},_a=function(e){typeof e.style=="string"&&(e.style=Ta(e.style))};function Ia(){return{onProcessRule:_a}}var M="@global",ct="@global ",ja=function(){function t(n,r,i){this.type="global",this.at=M,this.rules=void 0,this.options=void 0,this.key=void 0,this.isProcessed=!1,this.key=n,this.options=i,this.rules=new xe(x({},i,{parent:this}));for(var a in r)this.rules.add(a,r[a]);this.rules.process()}var e=t.prototype;return e.getRule=function(r){return this.rules.get(r)},e.addRule=function(r,i,a){var s=this.rules.add(r,i,a);return s&&this.options.jss.plugins.onProcessRule(s),s},e.indexOf=function(r){return this.rules.indexOf(r)},e.toString=function(){return this.rules.toString()},t}(),Ma=function(){function t(n,r,i){this.type="global",this.at=M,this.options=void 0,this.rule=void 0,this.isProcessed=!1,this.key=void 0,this.key=n,this.options=i;var a=n.substr(ct.length);this.rule=i.jss.createRule(a,r,x({},i,{parent:this}))}var e=t.prototype;return e.toString=function(r){return this.rule?this.rule.toString(r):""},t}(),Na=/\s*,\s*/g;function Ur(t,e){for(var n=t.split(Na),r="",i=0;i<n.length;i++)r+=e+" "+n[i].trim(),n[i+1]&&(r+=", ");return r}function La(t,e){var n=t.options,r=t.style,i=r?r[M]:null;if(!!i){for(var a in i)e.addRule(a,i[a],x({},n,{selector:Ur(a,t.selector)}));delete r[M]}}function za(t,e){var n=t.options,r=t.style;for(var i in r)if(!(i[0]!=="@"||i.substr(0,M.length)!==M)){var a=Ur(i.substr(M.length),t.selector);e.addRule(a,r[i],x({},n,{selector:a})),delete r[i]}}function $a(){function t(n,r,i){if(!n)return null;if(n===M)return new ja(n,r,i);if(n[0]==="@"&&n.substr(0,ct.length)===ct)return new Ma(n,r,i);var a=i.parent;return a&&(a.type==="global"||a.options.parent&&a.options.parent.type==="global")&&(i.scoped=!1),i.scoped===!1&&(i.selector=n),null}function e(n,r){n.type!=="style"||!r||(La(n,r),za(n,r))}return{onCreateRule:t,onProcessRule:e}}var ke=function(e){return e&&typeof e=="object"&&!Array.isArray(e)},dt="extendCurrValue"+Date.now();function Fa(t,e,n,r){var i=typeof t.extend;if(i==="string"){if(!n)return;var a=n.getRule(t.extend);if(!a||a===e)return;var s=a.options.parent;if(s){var o=s.rules.raw[t.extend];F(o,e,n,r)}return}if(Array.isArray(t.extend)){for(var l=0;l<t.extend.length;l++){var u=t.extend[l],c=typeof u=="string"?x({},t,{extend:u}):t.extend[l];F(c,e,n,r)}return}for(var d in t.extend){if(d==="extend"){F(t.extend.extend,e,n,r);continue}if(ke(t.extend[d])){d in r||(r[d]={}),F(t.extend[d],e,n,r[d]);continue}r[d]=t.extend[d]}}function Da(t,e,n,r){for(var i in t)if(i!=="extend"){if(ke(r[i])&&ke(t[i])){F(t[i],e,n,r[i]);continue}if(ke(t[i])){r[i]=F(t[i],e,n);continue}r[i]=t[i]}}function F(t,e,n,r){return r===void 0&&(r={}),Fa(t,e,n,r),Da(t,e,n,r),r}function Ua(){function t(n,r,i){return"extend"in n?F(n,r,i):n}function e(n,r,i){if(r!=="extend")return n;if(n==null||n===!1){for(var a in i[dt])i.prop(a,null);return i[dt]=null,null}if(typeof n=="object"){for(var s in n)i.prop(s,n[s]);i[dt]=n}return null}return{onProcessStyle:t,onChangeValue:e}}var Vr=/\s*,\s*/g,Va=/&/g,Ha=/\$([\w-]+)/g;function Wa(){function t(i,a){return function(s,o){var l=i.getRule(o)||a&&a.getRule(o);return l?(l=l,l.selector):o}}function e(i,a){for(var s=a.split(Vr),o=i.split(Vr),l="",u=0;u<s.length;u++)for(var c=s[u],d=0;d<o.length;d++){var g=o[d];l&&(l+=", "),l+=g.indexOf("&")!==-1?g.replace(Va,c):c+" "+g}return l}function n(i,a,s){if(s)return x({},s,{index:s.index+1});var o=i.options.nestingLevel;o=o===void 0?1:o+1;var l=x({},i.options,{nestingLevel:o,index:a.indexOf(i)+1});return delete l.name,l}function r(i,a,s){if(a.type!=="style")return i;var o=a,l=o.options.parent,u,c;for(var d in i){var g=d.indexOf("&")!==-1,p=d[0]==="@";if(!(!g&&!p)){if(u=n(o,l,u),g){var y=e(d,o.selector);c||(c=t(l,s)),y=y.replace(Ha,c),l.addRule(y,i[d],x({},u,{selector:y}))}else p&&l.addRule(d,{},u).addRule(o.key,i[d],{selector:o.selector});delete i[d]}}return i}return{onProcessStyle:r}}function ht(t,e){if(!e)return!0;if(Array.isArray(e)){for(var n=0;n<e.length;n++){var r=ht(t,e[n]);if(!r)return!1}return!0}if(e.indexOf(" ")>-1)return ht(t,e.split(" "));var i=t.options,a=i.parent;if(e[0]==="$"){var s=a.getRule(e.substr(1));return!s||s===t?!1:(a.classes[t.key]+=" "+a.classes[s.key],!0)}return a.classes[t.key]+=" "+e,!0}function Ga(){function t(e,n){return"composes"in e&&(ht(n,e.composes),delete e.composes),e}return{onProcessStyle:t}}var Ya=/[A-Z]/g,qa=/^ms-/,vt={};function Ba(t){return"-"+t.toLowerCase()}function Hr(t){if(vt.hasOwnProperty(t))return vt[t];var e=t.replace(Ya,Ba);return vt[t]=qa.test(e)?"-"+e:e}function Se(t){var e={};for(var n in t){var r=n.indexOf("--")===0?n:Hr(n);e[r]=t[n]}return t.fallbacks&&(Array.isArray(t.fallbacks)?e.fallbacks=t.fallbacks.map(Se):e.fallbacks=Se(t.fallbacks)),e}function Xa(){function t(n){if(Array.isArray(n)){for(var r=0;r<n.length;r++)n[r]=Se(n[r]);return n}return Se(n)}function e(n,r,i){if(r.indexOf("--")===0)return n;var a=Hr(r);return r===a?n:(i.prop(a,n),null)}return{onProcessStyle:t,onChangeValue:e}}var f=lt&&CSS?CSS.px:"px",Re=lt&&CSS?CSS.ms:"ms",q=lt&&CSS?CSS.percent:"%",Ka={"animation-delay":Re,"animation-duration":Re,"background-position":f,"background-position-x":f,"background-position-y":f,"background-size":f,border:f,"border-bottom":f,"border-bottom-left-radius":f,"border-bottom-right-radius":f,"border-bottom-width":f,"border-left":f,"border-left-width":f,"border-radius":f,"border-right":f,"border-right-width":f,"border-top":f,"border-top-left-radius":f,"border-top-right-radius":f,"border-top-width":f,"border-width":f,"border-block":f,"border-block-end":f,"border-block-end-width":f,"border-block-start":f,"border-block-start-width":f,"border-block-width":f,"border-inline":f,"border-inline-end":f,"border-inline-end-width":f,"border-inline-start":f,"border-inline-start-width":f,"border-inline-width":f,"border-start-start-radius":f,"border-start-end-radius":f,"border-end-start-radius":f,"border-end-end-radius":f,margin:f,"margin-bottom":f,"margin-left":f,"margin-right":f,"margin-top":f,"margin-block":f,"margin-block-end":f,"margin-block-start":f,"margin-inline":f,"margin-inline-end":f,"margin-inline-start":f,padding:f,"padding-bottom":f,"padding-left":f,"padding-right":f,"padding-top":f,"padding-block":f,"padding-block-end":f,"padding-block-start":f,"padding-inline":f,"padding-inline-end":f,"padding-inline-start":f,"mask-position-x":f,"mask-position-y":f,"mask-size":f,height:f,width:f,"min-height":f,"max-height":f,"min-width":f,"max-width":f,bottom:f,left:f,top:f,right:f,inset:f,"inset-block":f,"inset-block-end":f,"inset-block-start":f,"inset-inline":f,"inset-inline-end":f,"inset-inline-start":f,"box-shadow":f,"text-shadow":f,"column-gap":f,"column-rule":f,"column-rule-width":f,"column-width":f,"font-size":f,"font-size-delta":f,"letter-spacing":f,"text-decoration-thickness":f,"text-indent":f,"text-stroke":f,"text-stroke-width":f,"word-spacing":f,motion:f,"motion-offset":f,outline:f,"outline-offset":f,"outline-width":f,perspective:f,"perspective-origin-x":q,"perspective-origin-y":q,"transform-origin":q,"transform-origin-x":q,"transform-origin-y":q,"transform-origin-z":q,"transition-delay":Re,"transition-duration":Re,"vertical-align":f,"flex-basis":f,"shape-margin":f,size:f,gap:f,grid:f,"grid-gap":f,"row-gap":f,"grid-row-gap":f,"grid-column-gap":f,"grid-template-rows":f,"grid-template-columns":f,"grid-auto-rows":f,"grid-auto-columns":f,"box-shadow-x":f,"box-shadow-y":f,"box-shadow-blur":f,"box-shadow-spread":f,"font-line-height":f,"text-shadow-x":f,"text-shadow-y":f,"text-shadow-blur":f};function Wr(t){var e=/(-[a-z])/g,n=function(s){return s[1].toUpperCase()},r={};for(var i in t)r[i]=t[i],r[i.replace(e,n)]=t[i];return r}var Ja=Wr(Ka);function ae(t,e,n){if(e==null)return e;if(Array.isArray(e))for(var r=0;r<e.length;r++)e[r]=ae(t,e[r],n);else if(typeof e=="object")if(t==="fallbacks")for(var i in e)e[i]=ae(i,e[i],n);else for(var a in e)e[a]=ae(t+"-"+a,e[a],n);else if(typeof e=="number"&&isNaN(e)===!1){var s=n[t]||Ja[t];return s&&!(e===0&&s===f)?typeof s=="function"?s(e).toString():""+e+s:e.toString()}return e}function Qa(t){t===void 0&&(t={});var e=Wr(t);function n(i,a){if(a.type!=="style")return i;for(var s in i)i[s]=ae(s,i[s],e);return i}function r(i,a){return ae(a,i,e)}return{onProcessStyle:n,onChangeValue:r}}var Za={"background-size":!0,"background-position":!0,border:!0,"border-bottom":!0,"border-left":!0,"border-top":!0,"border-right":!0,"border-radius":!0,"border-image":!0,"border-width":!0,"border-style":!0,"border-color":!0,"box-shadow":!0,flex:!0,margin:!0,padding:!0,outline:!0,"transform-origin":!0,transform:!0,transition:!0},es={position:!0,size:!0},Pe={padding:{top:0,right:0,bottom:0,left:0},margin:{top:0,right:0,bottom:0,left:0},background:{attachment:null,color:null,image:null,position:null,repeat:null},border:{width:null,style:null,color:null},"border-top":{width:null,style:null,color:null},"border-right":{width:null,style:null,color:null},"border-bottom":{width:null,style:null,color:null},"border-left":{width:null,style:null,color:null},outline:{width:null,style:null,color:null},"list-style":{type:null,position:null,image:null},transition:{property:null,duration:null,"timing-function":null,timingFunction:null,delay:null},animation:{name:null,duration:null,"timing-function":null,timingFunction:null,delay:null,"iteration-count":null,iterationCount:null,direction:null,"fill-mode":null,fillMode:null,"play-state":null,playState:null},"box-shadow":{x:0,y:0,blur:0,spread:0,color:null,inset:null},"text-shadow":{x:0,y:0,blur:null,color:null}},gt={border:{radius:"border-radius",image:"border-image",width:"border-width",style:"border-style",color:"border-color"},"border-bottom":{width:"border-bottom-width",style:"border-bottom-style",color:"border-bottom-color"},"border-top":{width:"border-top-width",style:"border-top-style",color:"border-top-color"},"border-left":{width:"border-left-width",style:"border-left-style",color:"border-left-color"},"border-right":{width:"border-right-width",style:"border-right-style",color:"border-right-color"},background:{size:"background-size",image:"background-image"},font:{style:"font-style",variant:"font-variant",weight:"font-weight",stretch:"font-stretch",size:"font-size",family:"font-family",lineHeight:"line-height","line-height":"line-height"},flex:{grow:"flex-grow",basis:"flex-basis",direction:"flex-direction",wrap:"flex-wrap",flow:"flex-flow",shrink:"flex-shrink"},align:{self:"align-self",items:"align-items",content:"align-content"},grid:{"template-columns":"grid-template-columns",templateColumns:"grid-template-columns","template-rows":"grid-template-rows",templateRows:"grid-template-rows","template-areas":"grid-template-areas",templateAreas:"grid-template-areas",template:"grid-template","auto-columns":"grid-auto-columns",autoColumns:"grid-auto-columns","auto-rows":"grid-auto-rows",autoRows:"grid-auto-rows","auto-flow":"grid-auto-flow",autoFlow:"grid-auto-flow",row:"grid-row",column:"grid-column","row-start":"grid-row-start",rowStart:"grid-row-start","row-end":"grid-row-end",rowEnd:"grid-row-end","column-start":"grid-column-start",columnStart:"grid-column-start","column-end":"grid-column-end",columnEnd:"grid-column-end",area:"grid-area",gap:"grid-gap","row-gap":"grid-row-gap",rowGap:"grid-row-gap","column-gap":"grid-column-gap",columnGap:"grid-column-gap"}};function ts(t,e,n){return t.map(function(r){return Yr(r,e,n,!1,!0)})}function Gr(t,e,n,r){return n[e]==null?t:t.length===0?[]:Array.isArray(t[0])?Gr(t[0],e,n,r):typeof t[0]=="object"?ts(t,e,r):[t]}function Yr(t,e,n,r,i){if(!(Pe[e]||gt[e]))return[];var a=[];if(gt[e]&&(t=rs(t,n,gt[e],r)),Object.keys(t).length)for(var s in Pe[e]){if(t[s]){Array.isArray(t[s])?a.push(es[s]===null?t[s]:t[s].join(" ")):a.push(t[s]);continue}Pe[e][s]!=null&&a.push(Pe[e][s])}return!a.length||i?a:[a]}function rs(t,e,n,r){for(var i in n){var a=n[i];if(typeof t[i]!="undefined"&&(r||!e.prop(a))){var s,o=se((s={},s[a]=t[i],s),e)[a];r?e.style.fallbacks[a]=o:e.style[a]=o}delete t[i]}return t}function se(t,e,n){for(var r in t){var i=t[r];if(Array.isArray(i)){if(!Array.isArray(i[0])){if(r==="fallbacks"){for(var a=0;a<t.fallbacks.length;a++)t.fallbacks[a]=se(t.fallbacks[a],e,!0);continue}t[r]=Gr(i,r,Za,e),t[r].length||delete t[r]}}else if(typeof i=="object"){if(r==="fallbacks"){t.fallbacks=se(t.fallbacks,e,!0);continue}t[r]=Yr(i,r,e,n),t[r].length||delete t[r]}else t[r]===""&&delete t[r]}return t}function ns(){function t(e,n){if(!e||n.type!=="style")return e;if(Array.isArray(e)){for(var r=0;r<e.length;r++)e[r]=se(e[r],n);return e}return se(e,n)}return{onProcessStyle:t}}function mt(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,r=new Array(e);n<e;n++)r[n]=t[n];return r}function is(t){if(Array.isArray(t))return mt(t)}function as(t){if(typeof Symbol!="undefined"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function ss(t,e){if(!!t){if(typeof t=="string")return mt(t,e);var n=Object.prototype.toString.call(t).slice(8,-1);if(n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set")return Array.from(t);if(n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return mt(t,e)}}function os(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function ls(t){return is(t)||as(t)||ss(t)||os()}var oe="",pt="",qr="",Br="",fs=te&&"ontouchstart"in document.documentElement;if(te){var yt={Moz:"-moz-",ms:"-ms-",O:"-o-",Webkit:"-webkit-"},us=document.createElement("p"),bt=us.style,cs="Transform";for(var wt in yt)if(wt+cs in bt){oe=wt,pt=yt[wt];break}oe==="Webkit"&&"msHyphens"in bt&&(oe="ms",pt=yt.ms,Br="edge"),oe==="Webkit"&&"-apple-trailing-word"in bt&&(qr="apple")}var v={js:oe,css:pt,vendor:qr,browser:Br,isTouch:fs};function ds(t){return t[1]==="-"||v.js==="ms"?t:"@"+v.css+"keyframes"+t.substr(10)}var hs={noPrefill:["appearance"],supportedProperty:function(e){return e!=="appearance"?!1:v.js==="ms"?"-webkit-"+e:v.css+e}},vs={noPrefill:["color-adjust"],supportedProperty:function(e){return e!=="color-adjust"?!1:v.js==="Webkit"?v.css+"print-"+e:e}},gs=/[-\s]+(.)?/g;function ms(t,e){return e?e.toUpperCase():""}function xt(t){return t.replace(gs,ms)}function N(t){return xt("-"+t)}var ps={noPrefill:["mask"],supportedProperty:function(e,n){if(!/^mask/.test(e))return!1;if(v.js==="Webkit"){var r="mask-image";if(xt(r)in n)return e;if(v.js+N(r)in n)return v.css+e}return e}},ys={noPrefill:["text-orientation"],supportedProperty:function(e){return e!=="text-orientation"?!1:v.vendor==="apple"&&!v.isTouch?v.css+e:e}},bs={noPrefill:["transform"],supportedProperty:function(e,n,r){return e!=="transform"?!1:r.transform?e:v.css+e}},ws={noPrefill:["transition"],supportedProperty:function(e,n,r){return e!=="transition"?!1:r.transition?e:v.css+e}},xs={noPrefill:["writing-mode"],supportedProperty:function(e){return e!=="writing-mode"?!1:v.js==="Webkit"||v.js==="ms"&&v.browser!=="edge"?v.css+e:e}},ks={noPrefill:["user-select"],supportedProperty:function(e){return e!=="user-select"?!1:v.js==="Moz"||v.js==="ms"||v.vendor==="apple"?v.css+e:e}},Ss={supportedProperty:function(e,n){if(!/^break-/.test(e))return!1;if(v.js==="Webkit"){var r="WebkitColumn"+N(e);return r in n?v.css+"column-"+e:!1}if(v.js==="Moz"){var i="page"+N(e);return i in n?"page-"+e:!1}return!1}},Rs={supportedProperty:function(e,n){if(!/^(border|margin|padding)-inline/.test(e))return!1;if(v.js==="Moz")return e;var r=e.replace("-inline","");return v.js+N(r)in n?v.css+r:!1}},Ps={supportedProperty:function(e,n){return xt(e)in n?e:!1}},As={supportedProperty:function(e,n){var r=N(e);return e[0]==="-"||e[0]==="-"&&e[1]==="-"?e:v.js+r in n?v.css+e:v.js!=="Webkit"&&"Webkit"+r in n?"-webkit-"+e:!1}},Cs={supportedProperty:function(e){return e.substring(0,11)!=="scroll-snap"?!1:v.js==="ms"?""+v.css+e:e}},Os={supportedProperty:function(e){return e!=="overscroll-behavior"?!1:v.js==="ms"?v.css+"scroll-chaining":e}},Es={"flex-grow":"flex-positive","flex-shrink":"flex-negative","flex-basis":"flex-preferred-size","justify-content":"flex-pack",order:"flex-order","align-items":"flex-align","align-content":"flex-line-pack"},Ts={supportedProperty:function(e,n){var r=Es[e];return r&&v.js+N(r)in n?v.css+r:!1}},Xr={flex:"box-flex","flex-grow":"box-flex","flex-direction":["box-orient","box-direction"],order:"box-ordinal-group","align-items":"box-align","flex-flow":["box-orient","box-direction"],"justify-content":"box-pack"},_s=Object.keys(Xr),Is=function(e){return v.css+e},js={supportedProperty:function(e,n,r){var i=r.multiple;if(_s.indexOf(e)>-1){var a=Xr[e];if(!Array.isArray(a))return v.js+N(a)in n?v.css+a:!1;if(!i)return!1;for(var s=0;s<a.length;s++)if(!(v.js+N(a[0])in n))return!1;return a.map(Is)}return!1}},Kr=[hs,vs,ps,ys,bs,ws,xs,ks,Ss,Rs,Ps,As,Cs,Os,Ts,js],Jr=Kr.filter(function(t){return t.supportedProperty}).map(function(t){return t.supportedProperty}),Ms=Kr.filter(function(t){return t.noPrefill}).reduce(function(t,e){return t.push.apply(t,ls(e.noPrefill)),t},[]),le,D={};if(te){le=document.createElement("p");var kt=window.getComputedStyle(document.documentElement,"");for(var St in kt)isNaN(St)||(D[kt[St]]=kt[St]);Ms.forEach(function(t){return delete D[t]})}function Rt(t,e){if(e===void 0&&(e={}),!le)return t;if(D[t]!=null)return D[t];(t==="transition"||t==="transform")&&(e[t]=t in le.style);for(var n=0;n<Jr.length&&(D[t]=Jr[n](t,le.style,e),!D[t]);n++);try{le.style[t]=""}catch(r){return!1}return D[t]}var B={},Ns={transition:1,"transition-property":1,"-webkit-transition":1,"-webkit-transition-property":1},Ls=/(^\s*[\w-]+)|, (\s*[\w-]+)(?![^()]*\))/g,L;function zs(t,e,n){if(e==="var")return"var";if(e==="all")return"all";if(n==="all")return", all";var r=e?Rt(e):", "+Rt(n);return r||e||n}te&&(L=document.createElement("p"));function Qr(t,e){var n=e;if(!L||t==="content")return e;if(typeof n!="string"||!isNaN(parseInt(n,10)))return n;var r=t+n;if(B[r]!=null)return B[r];try{L.style[t]=n}catch(i){return B[r]=!1,!1}if(Ns[t])n=n.replace(Ls,zs);else if(L.style[t]===""&&(n=v.css+n,n==="-ms-flex"&&(L.style[t]="-ms-flexbox"),L.style[t]=n,L.style[t]===""))return B[r]=!1,!1;return L.style[t]="",B[r]=n,B[r]}function $s(){function t(i){if(i.type==="keyframes"){var a=i;a.at=ds(a.at)}}function e(i){for(var a in i){var s=i[a];if(a==="fallbacks"&&Array.isArray(s)){i[a]=s.map(e);continue}var o=!1,l=Rt(a);l&&l!==a&&(o=!0);var u=!1,c=Qr(l,$(s));c&&c!==s&&(u=!0),(o||u)&&(o&&delete i[a],i[l||a]=c||s)}return i}function n(i,a){return a.type!=="style"?i:e(i)}function r(i,a){return Qr(a,$(i))||i}return{onProcessRule:t,onProcessStyle:n,onChangeValue:r}}function Fs(){var t=function(n,r){return n.length===r.length?n>r?1:-1:n.length-r.length};return{onProcessStyle:function(n,r){if(r.type!=="style")return n;for(var i={},a=Object.keys(n).sort(t),s=0;s<a.length;s++)i[a[s]]=n[a[s]];return i}}}var Ds=function(e){return e===void 0&&(e={}),{plugins:[Pa(),Oa(e.observable),Ia(),$a(),Ua(),Wa(),Ga(),Xa(),Qa(e.defaultUnit),ns(),$s(),Fs()]}},Gs=Ds;export{Wa as a,Vs as b,Hs as c,Ei as d,Us as f,Ws as j,br as l,Gs as p};
