var Model = function (Json, Diffuse, Specular, Normal) {
    this.Json = Json;

    this.VertexnormalBuffer;
    this.VertextextureCoorBuffer;
    this.VertexPositionBuffer;
    this.VertexIndexBuffer;

    this.Texture = initTexture(Diffuse);
    this.SpecularTexture = initTexture(Specular);
    this.NormalTexture = initTexture(Normal);

    this.modelvertexpos;
    var con = this;
    con.loadJson();
    
};


Model.prototype.loadJson = function () {
    var t = this;
    var request = new XMLHttpRequest();
    request.open("GET", this.Json);
    request.onreadystatechange = function () {
        if (request.readyState == 4) {
            t.handleLoadedJson(JSON.parse(request.responseText));           
        }
    }
    request.send();
};
Model.prototype.handleLoadedJson = function (ModelData) {
    this.VertexnormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,  this.VertexnormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ModelData.vertexNormals), gl.DYNAMIC_DRAW);
    this.VertexnormalBuffer.itemSize = 3;
    this.VertexnormalBuffer.numItems = ModelData.vertexNormals.length / 3;

    this.VertextextureCoorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.VertextextureCoorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ModelData.vertexTextureCoords), gl.DYNAMIC_DRAW);
    this.VertextextureCoorBuffer.itemSize = 2;
    this.VertextextureCoorBuffer.numItems = ModelData.vertexTextureCoords.length / 2;

        //prueba para animar
        this.modelvertexpos = ModelData.vertexPositions;

    this.VertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ModelData.vertexPositions), gl.DYNAMIC_DRAW);
    this.VertexPositionBuffer.itemSize = 3;
    this.VertexPositionBuffer.numItems = ModelData.vertexPositions.length / 3;

    this.VertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.VertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(ModelData.indices), gl.DYNAMIC_DRAW);
    this.VertexIndexBuffer.itemSize = 1;
    this.VertexIndexBuffer.numItems = ModelData.indices.length;


};
Model.prototype.drawJson = function () {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.Texture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.SpecularTexture);
    gl.uniform1i(shaderProgram.samplerSpecularUniform, 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.NormalTexture);
    gl.uniform1i(shaderProgram.samplerNormalUniform, 2);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
        
    gl.bindBuffer(gl.ARRAY_BUFFER, this.VertextextureCoorBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, this.VertextextureCoorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexnormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, this.VertexnormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.VertexIndexBuffer); //dibujar por indices 
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, this.VertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);// dibujar por indices

};
   //prueba para animar
Model.prototype.animatewater = function(phase){
//logica de movimiento de animacion.
var row=1;
var sube=true;
var wave = 0;
switch(phase){
    case 1:
    wave=-1.0
    break;

    case 2:
    wave=-1.6
    break;

    case 3:
    wave=-1.8
    break;

    case 4:
    wave=-2.2
    break;
}



for(x=0;x<30;x++){


   

    for(i=row;i<row+90;i+=3)
    {       
        this.modelvertexpos[i]= wave/3;        
    }
  // /*
   if(wave>=-1)
    sube=false;
   if(wave<=-1.4)
    sube=true;

if(sube)
    wave+=.2;
else
    wave-=.2;

//*/

    row+=90;
 }


    gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(this.modelvertexpos));

};


function initTexture(imgUrl) {
    var texture;
    texture = gl.createTexture();
    texture.image = new Image();
    texture.image.onload = function () {
        handleLoadedTexture(texture)
    }

    texture.image.src = imgUrl;
    return texture;
}

function handleLoadedTexture(texture) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

