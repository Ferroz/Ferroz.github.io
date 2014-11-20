function getShader(gl, id) {
        var shaderScript = document.getElementById(id);
        if (!shaderScript) {
                return null;
        }


        var str = "";
        var k = shaderScript.firstChild;
        
        while (k) {
                if (k.nodeType == 3) {
                        str += k.textContent;
                }
                k = k.nextSibling;
        }


        var shader;
        if (shaderScript.type == "x-shader/x-fragment") {
                shader = gl.createShader(gl.FRAGMENT_SHADER);
        } else if (shaderScript.type == "x-shader/x-vertex") {
                shader = gl.createShader(gl.VERTEX_SHADER);
        } else {
                return null;
        }


        gl.shaderSource(shader, str);
        gl.compileShader(shader);


        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.log(gl.getShaderInfoLog(shader));
                return null;
        }


        return shader;
}


function initShadersGLModel( gl, shaderProgram ) {
        var fragmentShader = getShader(gl, "shader-fs");
        var vertexShader = getShader(gl, "shader-vs");


        shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);


        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
                console.log("Could not initialise shaders");
        }


        shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);


        shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
        gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);


        shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
        gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);


        shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
        shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
        shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
        shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
        shaderProgram.materialShininessUniform = gl.getUniformLocation(shaderProgram, "uMaterialShininess");
        shaderProgram.showSpecularHighlightsUniform = gl.getUniformLocation(shaderProgram, "uShowSpecularHighlights");
        shaderProgram.useTexturesUniform = gl.getUniformLocation(shaderProgram, "uUseTextures");
        shaderProgram.useLightingUniform = gl.getUniformLocation(shaderProgram, "uUseLighting");
        shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
        shaderProgram.pointLightingLocationUniform = gl.getUniformLocation(shaderProgram, "uPointLightingLocation");
        shaderProgram.pointLightingSpecularColorUniform = gl.getUniformLocation(shaderProgram, "uPointLightingSpecularColor");
        shaderProgram.pointLightingDiffuseColorUniform = gl.getUniformLocation(shaderProgram, "uPointLightingDiffuseColor");


        return shaderProgram;
}


function handleLoadedTexture(texture, filter) {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);


        
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        gl.generateMipmap(gl.TEXTURE_2D);


        if( filter !== undefined ){
                var ext = ( gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('MOZ_EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') );
                if (ext){
                        var max = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
                        gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, max);
                }
        }


        gl.bindTexture(gl.TEXTURE_2D, null);
        


}


function initTexture( image_url, filter ) {
        var _texture = gl.createTexture();
        _texture.image = new Image();
        _texture.image.onload = function () {
                handleLoadedTexture(_texture, filter)
        }
        _texture.image.src = image_url;
        return _texture;
}


function setMatrixUniforms( shaderProgram, pMatrix, mvMatrix) {
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}


function mvPushMatrix(mvMatrix, mvMatrixStack) {
        var copy = mat4.create();
        mat4.set(mvMatrix, copy);
        mvMatrixStack.push(copy);
}


function mvPopMatrix(mvMatrixStack) {
        if (mvMatrixStack.length == 0) {
                throw "Invalid popMatrix!";
        }
        return mvMatrixStack.pop();
}


function degToRad(degrees) {
        return degrees * Math.PI / 180;
}
window.requestAnimFrame = (function() {
        return window.requestAnimationFrame ||
                        window.webkitRequestAnimationFrame ||
                        window.mozRequestAnimationFrame ||
                        window.oRequestAnimationFrame ||
                        window.msRequestAnimationFrame ||
                        function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
                        window.setTimeout(callback, 1000/60);
        };
} )();


function loadObj(url, callback){
        var req = new XMLHttpRequest();
        req.onreadystatechange = function () { processLoadObj(req, callback ); };
        req.open("GET", url, true);
        req.send(null);
}


function processLoadObj(req, callback){
        if (req.readyState == 4) {
                callback( doLoadObj(req.responseText) );
        }
}


function doLoadObj(text){
        vertexArray = [ ];
        normalArray = [ ];
        textureArray = [ ];
        indexArray = [ ];


        var vertex = [ ];
        var normal = [ ];
        var texture = [ ];
        var facemap = { };
        var index = 0;


        var lines = text.split("\n");
        console.log( lines.length );
        for (var lineIndex in lines) {
            var line = lines[lineIndex].replace(/[ \t]+/g, " ").replace(/\s\s*$/, "");


            // ignore comments
            if (line[0] == "#")
                continue;


            var array = line.split(" ");
            if (array[0] == "v") {
                // vertex
                vertex.push(parseFloat(array[1]));
                vertex.push(parseFloat(array[2]));
                vertex.push(parseFloat(array[3]));
            }
            else if (array[0] == "vt") {
                // normal
                texture.push(parseFloat(array[1]));
                texture.push(parseFloat(array[2]));
            }
            else if (array[0] == "vn") {
                // normal
                normal.push(parseFloat(array[1]));
                normal.push(parseFloat(array[2]));
                normal.push(parseFloat(array[3]));
            }
            else if (array[0] == "f") {
                // face
                if (array.length != 4) {
                    //obj.ctx.console.log("*** Error: face '"+line+"' not handled");
                    continue;
                }


                for (var i = 1; i < 4; ++i) {
                    if (!(array[i] in facemap)) {
                        // add a new entry to the map and arrays
                        var f = array[i].split("/");
                        var vtx, nor, tex;


                        if (f.length == 1) {
                            vtx = parseInt(f[0]) - 1;
                            nor = vtx;
                            tex = vtx;
                        }
                        else if (f.length = 3) {
                            vtx = parseInt(f[0]) - 1;
                            tex = parseInt(f[1]) - 1;
                            nor = parseInt(f[2]) - 1;
                        }
                        else {
                            //obj.ctx.console.log("*** Error: did not understand face '"+array[i]+"'");
                            return null;
                        }


                        // do the vertices
                        var x = 0;
                        var y = 0;
                        var z = 0;
                        if (vtx * 3 + 2 < vertex.length) {
                            x = vertex[vtx*3];
                            y = vertex[vtx*3+1];
                            z = vertex[vtx*3+2];
                        }
                        vertexArray.push(x);
                        vertexArray.push(y);
                        vertexArray.push(z);


                        // do the textures
                        x = 0;
                        y = 0;
                        if (tex * 2 + 1 < texture.length) {
                            x = texture[tex*2];
                            y = texture[tex*2+1];
                        }
                        textureArray.push(x);
                        textureArray.push(y);


                        // do the normals
                        x = 0;
                        y = 0;
                        z = 1;
                        if (nor * 3 + 2 < normal.length) {
                            x = normal[nor*3];
                            y = normal[nor*3+1];
                            z = normal[nor*3+2];
                        }
                        normalArray.push(x);
                        normalArray.push(y);
                        normalArray.push(z);


                        facemap[array[i]] = index++;
                    }


                    indexArray.push(facemap[array[i]]);
                }
            }
        }


        result = {};
        result["vertexPositions"] = vertexArray;
        result["vertexNormals"] = normalArray;
        result["vertexTextureCoords"] = textureArray;
        result["indices"] = indexArray;;


        document.write(JSON.stringify(result));
}