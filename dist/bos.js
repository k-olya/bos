!function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e():"function"==typeof define&&define.amd?define([],e):"object"==typeof exports?exports.Bos=e():t.Bos=e()}(this,(()=>(()=>{"use strict";var t={d:(e,r)=>{for(var i in r)t.o(r,i)&&!t.o(e,i)&&Object.defineProperty(e,i,{enumerable:!0,get:r[i]})},o:(t,e)=>Object.prototype.hasOwnProperty.call(t,e)},e={};t.d(e,{default:()=>A});var r=function(){return r=Object.assign||function(t){for(var e,r=1,i=arguments.length;r<i;r++)for(var o in e=arguments[r])Object.prototype.hasOwnProperty.call(e,o)&&(t[o]=e[o]);return t},r.apply(this,arguments)};function i(t,e,r){var i=t.createShader(e);if(t.shaderSource(i,r),t.compileShader(i),!t.getShaderParameter(i,t.COMPILE_STATUS)){var o="Shader compilation error: "+t.getShaderInfoLog(i);throw t.deleteShader(i),new Error(o)}return i}function o(t,e,r){var i=t.createProgram();if(t.attachShader(i,e),t.attachShader(i,r),t.linkProgram(i),!t.getProgramParameter(i,t.LINK_STATUS)){var o="Program linking error: "+t.getProgramInfoLog(i);throw t.deleteProgram(i),new Error(o)}return i}function n(t,e,i,o,n){var a=r({framebuffer:null,pixels:null,minFilter:t.LINEAR,magFilter:t.LINEAR,wrapS:t.CLAMP_TO_EDGE,wrapT:t.CLAMP_TO_EDGE,flip:!1,premultiply:!1},n),u=t.createTexture();return t.activeTexture(e),t.bindTexture(t.TEXTURE_2D,u),a.flip&&t.pixelStorei(t.UNPACK_FLIP_Y_WEBGL,1),a.premultiply&&t.pixelStorei(t.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!0),t.texImage2D(t.TEXTURE_2D,0,t.RGBA,i,o,0,t.RGBA,t.UNSIGNED_BYTE,a.pixels||null),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,a.minFilter),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,a.magFilter),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,a.wrapS),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,a.wrapT),a.framebuffer&&(t.bindFramebuffer(t.FRAMEBUFFER,a.framebuffer),t.framebufferTexture2D(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.TEXTURE_2D,u,0)),u}function a(t,e){var r,i=t.createBuffer();return r=e instanceof Array&&!(e instanceof Float32Array)?new Float32Array(e):e,t.bindBuffer(t.ARRAY_BUFFER,i),t.bufferData(t.ARRAY_BUFFER,r||null,t.STATIC_DRAW),i}function u(t,e){for(var i=[],o=2;o<arguments.length;o++)i[o-2]=arguments[o];return i.reduce((function(i,o){var n;return r(r({},i),((n={})[o]=t.getUniformLocation(e,o),n))}),{})}var s,h={"lowp float":"uniform1f","mediump float":"uniform1f","highp float":"uniform1f",float:"uniform1f",vec2:"uniform2f","lowp vec2":"uniform2f","mediump vec2":"uniform2f","highp vec2":"uniform2f",vec3:"uniform3f","lowp vec3":"uniform3f","mediump vec3":"uniform3f","highp vec3":"uniform3f","float[]":"uniform1fv","lowp float[]":"uniform1fv","mediump float[]":"uniform1fv","highp float[]":"uniform1fv","vec2[]":"uniform2fv","lowp vec2[]":"uniform2fv","mediump vec2[]":"uniform2fv","highp vec2[]":"uniform2fv","vec3[]":"uniform3fv","lowp vec3[]":"uniform3fv","mediump vec3[]":"uniform3fv","highp vec3[]":"uniform3fv"},f=[[-.5,-.5,"uvleft","uvbottom"],[.5,-.5,"uvright","uvbottom"],[-.5,.5,"uvleft","uvtop"],[-.5,.5,"uvleft","uvtop"],[.5,-.5,"uvright","uvbottom"],[.5,.5,"uvright","uvtop"]],l=["x","y","scalex","scaley","rot","alpha","u","v"],c=function(t,e,r,i,o){var n=o||"\n    // bos's default customizable vertex shader\n    attribute mat4 a_all;\n    varying vec2 v_uv;\n    varying float v_alpha;\n    \n    // custom varying\n    ".concat(e||"","\n    // custom uniforms\n    ").concat(r||"","\n    // end of custom variable declarations\n   \n    // time is always highp\n    uniform highp float u_time;\n    uniform vec2 u_aspect;\n\n    void main() {\n        vec2 c = a_all[0].xy;\n        vec2 scale = a_all[0].ba;\n        float rot = a_all[1][0];\n        float alpha = a_all[1][1];\n        vec2 uv = a_all[1].ba;\n        vec2 pos = a_all[2].xy;\n\n        float custom0 = a_all[2][2];\n        float custom1 = a_all[2][3];\n        float custom2 = a_all[3][0];\n        float custom3 = a_all[3][1];\n        float custom4 = a_all[3][2];\n        float custom5 = a_all[3][3];\n\n        // custom animation code goes here\n        ").concat(t||"","\n        // end of custom animation code\n\n        // rotate\n        float _sin = sin(rot);\n        float _cos = cos(rot);\n        mat2 rotationMatrix = mat2(_cos, _sin, -_sin, _cos);\n        pos = rotationMatrix * pos;\n\n        // scale and translate\n        pos = pos * scale + c;\n\n        // apply aspect ratio\n        pos *= u_aspect;\n\n        v_uv = uv;\n        v_alpha = alpha;\n        gl_Position = vec4(pos, 0.0, 1.0);\n    }\n\n");return!o&&i&&(n="precision ".concat(i," float;")+n),n},m=function(t,e){var r=t||"\n    // bos's default fragment shader\n    uniform sampler2D u_texture0;\n\n    varying vec2 v_uv;\n    varying float v_alpha;\n\n    void main() {\n        vec2 st = v_uv;\n        vec4 col = texture2D(u_texture0, st);\n        gl_FragColor = vec4(col.xyz, col.a * v_alpha);\n    }\n";return!t&&e&&(r="precision ".concat(e," float;")+r),r},p=(s=function(t,e){return s=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var r in e)Object.prototype.hasOwnProperty.call(e,r)&&(t[r]=e[r])},s(t,e)},function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Class extends value "+String(e)+" is not a constructor or null");function r(){this.constructor=t}s(t,e),t.prototype=null===e?Object.create(e):(r.prototype=e.prototype,new r)}),v=function(){return v=Object.assign||function(t){for(var e,r=1,i=arguments.length;r<i;r++)for(var o in e=arguments[r])Object.prototype.hasOwnProperty.call(e,o)&&(t[o]=e[o]);return t},v.apply(this,arguments)},d=function(t,e,r){if(r||2===arguments.length)for(var i,o=0,n=e.length;o<n;o++)!i&&o in e||(i||(i=Array.prototype.slice.call(e,0,o)),i[o]=e[o]);return t.concat(i||Array.prototype.slice.call(e))},g=96,y="highp",x=function(t,e){return void 0===t?e:t},b=function(t){function e(e,r){var i,o,n=t.call(this)||this;n.vertexShader=null,n.fragmentShader=null,n.program=null,n.attribute=0,n.vertexBuffer=null,n.texture=null,n.uniforms={};var a=e.gl;n.bos=e;var u=(null===(i=r.image)||void 0===i?void 0:i[0])||r.image,s=(null===(o=r.framebufferTexture)||void 0===o?void 0:o[0])||r.framebufferTexture,h=(null==u||u.naturalWidth,v({image:[],aspect:!0,framebufferTexture:[],outputFramebuffer:null,width:e.width,height:e.height,textureWidth:(null==u?void 0:u.naturalWidth)||(null==s?void 0:s.width)||(null==r?void 0:r.width)||e.width||0,textureHeight:(null==u?void 0:u.naturalHeight)||(null==s?void 0:s.height)||(null==r?void 0:r.height)||e.height||0,visible:!0,autoResize:void 0===r.height&&void 0===r.width,textureFilter:a.LINEAR,vertexAnimationCode:"",customFragmentShader:"",customVertexShader:"",customVarying:"",customUniforms:{},precision:y,uniformValues:{}},r));if((u||s)&&(!h.textureWidth||!h.textureHeight))throw new Error("Texture width or texture height not specified");for(var f in n.gl=a,n.size=1,n.length=0,n.data=new Float32Array(n.size*g),n.visible=h.visible,n.textureFilter=h.textureFilter,n.image=h.image,n.width=h.width,n.height=h.height,n.textureWidth=h.textureWidth,n.textureHeight=h.textureHeight,n.vertexAnimationCode=h.vertexAnimationCode,n.customVertexShader=h.customVertexShader,n.customFragmentShader=h.customFragmentShader,n.customVarying=h.customVarying,n.uniformValues=h.uniformValues,n.customUniformsList=Object.keys(h.customUniforms),n.outputFramebuffer=h.outputFramebuffer,n.framebufferTexture=h.framebufferTexture,n.autoResize=h.autoResize,n.aspect=h.aspect,n.precision=h.precision,n.customUniforms={},n.customArrayUniformsLengths={},h.customUniforms){n.customUniforms[f]=h.customUniforms[f].replace(/\[\d+\]/g,"[]");var l=h.customUniforms[f].split(/\[|\]/g);l[1]&&(n.customArrayUniformsLengths[f]=parseInt(l[1]))}return n.dirty={compile:!0,texture:!0,vbo:!0},n}return p(e,t),e.prototype.addSprite=function(t){return this.addSprites([t])},e.prototype.addSprites=function(t){this.modSprites(t,this.length)},e.prototype.modSprites=function(t,e){var r=this,i=t.length+e,o=!0;if(i>this.size){for(;i>this.size;)this.size+=Math.max(i,Math.min(this.size,256));var n=new Float32Array(this.size*g);n.set(this.data,0),this.data=n,o=!1}for(var a=function(i){var o=(e+i)*g,n=t[i],a=n.custom||[],s=f.flatMap((function(t){var e=n.u+("uvright"===t[2]?n.w:0)||0,i=n.v+("uvbottom"===t[3]?n.h:0)||0,o=x(n.scaley,1),u=x(n.scalex,n.w/n.h*o||o);return[n.x||0,n.y||0,u,o,n.rot||0,x(n.alpha,1),e/r.textureWidth,1-i/r.textureHeight,t[0]||0,t[1]||0,a[0]||0,a[1]||0,a[2]||0,a[3]||0,a[4]||0,a[5]||0]}));u.data.set(s,o)},u=this,s=0;s<t.length;s++)a(s);o?(this.dirty.vboStart="number"==typeof this.dirty.vboStart?Math.min(this.dirty.vboStart,e):e,this.dirty.vboEnd="number"==typeof this.dirty.vboEnd?Math.max(this.dirty.vboEnd,i):i):this.dirty.vbo=!0,this.length=i},e.prototype.patchSprite=function(t,e){for(var r=t.custom||[],i=0;i<6;i++){for(var o=e*g+16*i,n=0;n<6;n++)void 0!==t[l[n]]&&(this.data[o+n]=t[l[n]]);if(void 0!==t.u){var a=t.u+(("uvright"===f[i][2]?t.w:0)||0);this.data[o+6]=a/this.textureWidth}if(void 0!==t.v){var u=t.v+(("uvbottom"===f[i][3]?t.h:0)||0);this.data[o+7]=1-u/this.textureHeight}for(n=0;n<6;n++)void 0!==r[n]&&(this.data[o+10+n]=r[n])}this.dirty.vboStart="number"==typeof this.dirty.vboStart?Math.min(this.dirty.vboStart,e):e,this.dirty.vboEnd="number"==typeof this.dirty.vboEnd?Math.max(this.dirty.vboEnd,e+1):e+1},e.prototype.removeSprites=function(t,e){void 0===e&&(e=1),this.data.copyWithin(t*g,(t+e)*g),this.data.fill(0,(this.length-e)*g,e*g),this.dirty.vbo=!0,this.length-=e},e.prototype.nullSprite=function(t,e){void 0===e&&(e=1),this.data.fill(0,t*g,e*g),this.dirty.vboStart="number"==typeof this.dirty.vboStart?Math.min(this.dirty.vboStart,t):t,this.dirty.vboEnd="number"==typeof this.dirty.vboEnd?Math.max(this.dirty.vboEnd,t+e):t+e},e.prototype.readSpriteData=function(t){for(var e={},r=t*g+0,i=0;i<6;i++)e[l[i]]=this.data[r+i];return e},e.prototype.setUniforms=function(t){this.uniformValues=v(v({},this.uniformValues),t)},e.prototype.setUniformsGL=function(t){var e;for(var r in t)if(this.uniforms[r],this.uniforms[r]){if(!this.customUniformsList.includes(r))throw new Error("'".concat(r,"' not found in layer's uniforms list"));var i=h[this.customUniforms[r]];if(!this.gl[i])throw new Error("'".concat(r,"' has unrecognized type '").concat(this.customUniforms[r],"'"));"object"!=typeof t[r]||this.customArrayUniformsLengths[r]?this.gl[i](this.uniforms[r],t[r]):(e=this.gl)[i].apply(e,d([this.uniforms[r]],t[r],!1))}},e.prototype.resize=function(t,e){this.width=t,this.height=e},e.prototype.compile=function(){var t=this,e=this.gl,r=this.customUniformsList.map((function(e){var r=t.customUniforms[e],i=t.customArrayUniformsLengths[e];if(i){var o=r.split("[");return"\nuniform ".concat(o[0]," ").concat(e,"[").concat(i).concat(o[1],";")}return"\nuniform ".concat(r," ").concat(e,";")})).join("");"function"==typeof this.customVertexShader?this.vertexShader=i(e,e.VERTEX_SHADER,this.customVertexShader(c(this.vertexAnimationCode,this.customVarying,r,this.precision||y,""))):this.vertexShader=i(e,e.VERTEX_SHADER,c(this.vertexAnimationCode,this.customVarying,r,this.precision||y,this.customVertexShader)),"function"==typeof this.customFragmentShader?this.fragmentShader=i(e,e.FRAGMENT_SHADER,this.customFragmentShader(m("",this.precision||y))):this.fragmentShader=i(e,e.FRAGMENT_SHADER,m(this.customFragmentShader||"",this.precision||y)),this.program=o(e,this.vertexShader,this.fragmentShader),this.attribute=e.getAttribLocation(this.program,"a_all"),this.uniforms=u.apply(void 0,d([e,this.program,"u_time","u_texture0","u_texture1","u_texture2","u_texture3","u_texture4","u_texture5","u_texture6","u_texture7","u_aspect"],this.customUniformsList,!1)),this.dirty.compile=!1},e.prototype.createvbo=function(){this.vertexBuffer=a(this.gl,this.data),this.dirty.vbo=!1,this.dirty.vboStart=void 0,this.dirty.vboEnd=void 0},e.prototype.createTexture=function(){this.texture||(this.texture=[]);for(var t=Array.isArray(this.image)?this.image:[this.image],e=0;e<t.length;e++)this.updateImage(e);this.dirty.texture=!1},e.prototype.render=function(t){this.dirty.compile&&this.compile(),(this.dirty.vbo||this.dirty.vboStart||this.dirty.vboEnd)&&this.createvbo(),this.dirty.texture&&this.createTexture();var e=this.gl;e.useProgram(this.program),e.bindBuffer(e.ARRAY_BUFFER,this.vertexBuffer);for(var r=0;r<4;r++)e.enableVertexAttribArray(this.attribute+r),e.vertexAttribPointer(this.attribute+r,4,e.FLOAT,!1,64,16*r);for(var i=0;i<this.texture.length;i++)e.activeTexture(e["TEXTURE".concat(i)]),e.bindTexture(e.TEXTURE_2D,this.texture[i]),e.uniform1i(this.uniforms["u_texture".concat(i)],i);if(Array.isArray(this.framebufferTexture))for(var o=0;o<this.framebufferTexture.length;o++)e.activeTexture(e["TEXTURE".concat(i+o)]),e.bindTexture(e.TEXTURE_2D,this.framebufferTexture[o].texture),e.uniform1i(this.uniforms["u_texture".concat(i+o)],i+o);else e.activeTexture(e["TEXTURE".concat(i)]),e.bindTexture(e.TEXTURE_2D,this.framebufferTexture.texture),e.uniform1i(this.uniforms["u_texture".concat(i)],i);e.uniform1f(this.uniforms.u_time,t||0),this.uniformValues&&this.setUniformsGL(this.uniformValues),"number"==typeof this.aspect?e.uniform2f(this.uniforms.u_aspect,this.aspect,1):this.aspect?e.uniform2f(this.uniforms.u_aspect,this.height/this.width,1):e.uniform2f(this.uniforms.u_aspect,1,1),e.bindFramebuffer(e.FRAMEBUFFER,this.outputFramebuffer),e.viewport(0,0,this.width,this.height),e.drawArrays(e.TRIANGLES,0,6*this.length)},e.prototype.updateImage=function(t){void 0===t&&(t=0),this.texture||(this.texture=[]),this.texture[t]&&this.gl.deleteTexture(this.texture[t]);var e=Array.isArray(this.image)?this.image[t]:this.image;this.texture[t]=n(this.gl,this.gl.TEXTURE0,this.textureWidth,this.textureHeight,{pixels:e,minFilter:this.textureFilter,magFilter:this.textureFilter,flip:!0,premultiply:!0})},e}((function(){})),E=function(){return E=Object.assign||function(t){for(var e,r=1,i=arguments.length;r<i;r++)for(var o in e=arguments[r])Object.prototype.hasOwnProperty.call(e,o)&&(t[o]=e[o]);return t},E.apply(this,arguments)},_=function(){function t(t,e){var r=t.gl;this.gl=r;var i=E({image:null,textureWidth:t.width,textureHeight:t.height,textureFilter:r.LINEAR},e);this.framebuffer=r.createFramebuffer(),this.texture=n(r,r.TEXTURE0,i.textureWidth,i.textureHeight,{pixels:i.image,minFilter:i.textureFilter,magFilter:i.textureFilter,wrapS:r.CLAMP_TO_EDGE,wrapT:r.CLAMP_TO_EDGE}),r.bindFramebuffer(r.FRAMEBUFFER,this.framebuffer),r.framebufferTexture2D(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,this.texture,0),r.bindFramebuffer(r.FRAMEBUFFER,null),this.width=i.textureWidth,this.height=i.textureHeight}return t.prototype.resize=function(t,e){var r=this.gl;r.bindTexture(r.TEXTURE_2D,this.texture),r.texImage2D(r.TEXTURE_2D,0,r.RGBA,t,e,0,r.RGBA,r.UNSIGNED_BYTE,null),r.bindTexture(r.TEXTURE_2D,null)},t.prototype.free=function(){var t=this.gl;t.deleteFramebuffer(this.framebuffer),t.deleteTexture(this.texture)},t}(),T=function(){return T=Object.assign||function(t){for(var e,r=1,i=arguments.length;r<i;r++)for(var o in e=arguments[r])Object.prototype.hasOwnProperty.call(e,o)&&(t[o]=e[o]);return t},T.apply(this,arguments)};const A=function(){function t(t,e,r,i){T({},i),this.gl=t,this.width=e,this.height=r,this.layers=[],t.enable(t.BLEND),t.blendFunc(t.SRC_ALPHA,t.ONE_MINUS_SRC_ALPHA)}return t.prototype.addLayer=function(t){var e=new b(this,t);return this.layers.push(e),e},t.prototype.render=function(t){this.gl;for(var e=0;e<this.layers.length;e++)this.layers[e].visible&&this.layers[e].render(t)},t.prototype.resize=function(t,e){this.width=t,this.height=e;for(var r=0;r<this.layers.length;r++)this.layers[r].autoResize&&this.layers[r].resize(t,e)},t.prototype.canvasXtoGl=function(t,e){return(t/this.width*2-1)/(e||1)},t.prototype.canvasYtoGl=function(t){return 1-t/this.height*2},t.Utils={createProgram:o,createShader:i,createTexture:n,createVertexBuffer:a,getUniformLocations:u},t.FramebufferTexture=_,t.Layer=b,t}();return e.default})()));