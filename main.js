window.onload = () => {
  'use strict';

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('./sw.js');
  }
  camStart();
}

// Override the function with all the posibilities
navigator.getUserMedia ||
  (navigator.getUserMedia = navigator.mozGetUserMedia ||
    navigator.webkitGetUserMedia || navigator.msGetUserMedia);

var gl;
var canvas;
var Param1 = 0.0;
var Param2 = 0;
var Param3 = 0.0;
var mouseX = 0.5;
var mouseY = 0.5;

function initGL() {
  try {
    gl = canvas.getContext("experimental-webgl");
  } catch (e) {
  }
  if (!gl) {
    alert("Could not initialise WebGL, sorry :-(");
  }
}


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
  if (shaderScript.type == "f") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "v") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }

  gl.shaderSource(shader, str);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

var programsArray = new Array();
var current_program;

function initShaders() {
  programsArray.push(createProgram("shader-vs", "shader-1-fs"));
  programsArray.push(createProgram("shader-vs", "shader-2-fs"));
  programsArray.push(createProgram("shader-vs", "shader-3-fs"));
  programsArray.push(createProgram("shader-vs", "shader-4-fs"));
  programsArray.push(createProgram("shader-vs", "shader-5-fs"));
  programsArray.push(createProgram("shader-vs", "shader-6-fs"));
  programsArray.push(createProgram("shader-vs", "shader-7-fs"));
  programsArray.push(createProgram("shader-vs", "shader-8-fs"));
  current_program = programsArray[0];
}

function createProgram(vertexShaderId, fragmentShaderId) {
  var shaderProgram;
  var fragmentShader = getShader(gl, fragmentShaderId);
  var vertexShader = getShader(gl, vertexShaderId);

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Could not initialise shaders");
  }

  gl.useProgram(shaderProgram);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
  gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "texture0");
  shaderProgram.resolutionUniform = gl.getUniformLocation(shaderProgram, "resolution");
  shaderProgram.mouse = gl.getUniformLocation(shaderProgram, "mouse");
  shaderProgram.indexUniform = gl.getUniformLocation(shaderProgram, "index");
  shaderProgram.time = gl.getUniformLocation(shaderProgram, "time");
  shaderProgram.Param1 = gl.getUniformLocation(shaderProgram, "Param1");
  shaderProgram.Param2 = gl.getUniformLocation(shaderProgram, "Param2");
  shaderProgram.Param3 = gl.getUniformLocation(shaderProgram, "Param3");
  return shaderProgram;
}

var webcam;
var texture;

function initTexture() {
  texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

function mvPushMatrix() {
  var copy = mat4.create();
  mat4.set(mvMatrix, copy);
  mvMatrixStack.push(copy);
}

function mvPopMatrix() {
  if (mvMatrixStack.length == 0) {
    throw "Invalid popMatrix!";
  }
  mvMatrix = mvMatrixStack.pop();
}

var ix = 0;
var frame_num = 0.0;
var end;
var st = new Date().getTime();
function setUniforms() {
  end = new Date().getTime();
  gl.uniformMatrix4fv(current_program.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(current_program.mvMatrixUniform, false, mvMatrix);
  gl.uniform2f(current_program.resolutionUniform, canvas.width, canvas.height);
  gl.uniform2f(current_program.mouse, mouseX, mouseY);
  gl.uniform1i(current_program.indexUniform, ix);
  //        gl.uniform1f(current_program.time, performance.now()/1000.0);
  gl.uniform1f(current_program.time, ((end - st) % 1000000) / 1000.0);
  gl.uniform1f(current_program.Param1, Param1);
  gl.uniform1f(current_program.Param2, Param2);
  gl.uniform1f(current_program.Param3, Param3);
}

var cubeVertexPositionBuffer;
var cubeVertexTextureCoordBuffer;
var cubeVertexIndexBuffer;
function initBuffers() {
  cubeVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
  vertices = [-1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  cubeVertexPositionBuffer.itemSize = 2;
  cubeVertexPositionBuffer.numItems = 4;

  cubeVertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
  var textureCoords = [0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
  cubeVertexTextureCoordBuffer.itemSize = 2;
  cubeVertexTextureCoordBuffer.numItems = 4;

  cubeVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
  var cubeVertexIndices = [0, 1, 2, 0, 2, 3];
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
  cubeVertexIndexBuffer.itemSize = 1;
  cubeVertexIndexBuffer.numItems = 6;
}

function drawScene() {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  mat4.ortho(-1.0, 1.0, -1.0, 1.0, -1.0, 1.0, pMatrix);

  gl.useProgram(current_program);
  mat4.identity(mvMatrix);

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
  gl.vertexAttribPointer(current_program.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
  gl.vertexAttribPointer(current_program.textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, webcam);
  gl.uniform1i(current_program.samplerUniform, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
  setUniforms();
  gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
  gl.bindTexture(gl.TEXTURE_2D, null);
}


var old_time = Date.now();
var count = 0;
function tick() {
  count++;
  if (count < 60) {
    requestAnimFrame(tick);
    return;
  }
  requestAnimFrame(tick);
  drawScene();
}

function webGLStart() {

  canvas = document.getElementById("webgl-canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  initGL();
  initShaders();
  initBuffers();
  initTexture();

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  tick();
}

var ixMax = 7;
function ixCount(i) {
  switch (i) {
    case 1: return 9;
      break;
    case 2: return 7;
      break;
    case 3: return 6;
      break;
    case 4: return 4;
      break;
    case 5: return 8;
      break;
    case 6: return 8;
      break;
    case 7: return 8;
      break;
    case 8: return 7;
      break;
  }

}
var effectSet = 0;
function processing_changer() {

}
66

function Action(i) {
  switch (i) {
    case 1:
      ix = ix + 1;
      if (ix > ixMax)
        ix = 0;
      break;
    case 2:
      ix = ix - 1;
      if (ix < 0)
        ix = ixMax;
      break;
    case 3:
      effectSet = effectSet + 1;
      if (effectSet > 7)
        effectSet = 0;
      ix = 0;
      ixMax = ixCount(effectSet + 1);
      current_program = programsArray[effectSet];
      break;
    case 4:
      effectSet = effectSet - 1;
      if (effectSet < 0)
        effectSet = 7;
      ix = 0;
      ixMax = ixCount(effectSet + 1);
      current_program = programsArray[effectSet];
      break;
  }
}

function userMedia() {
  webcam = document.createElement('video'); //getElementById('webcam');
  navigator.getUserMedia({ video: true, audio: false }, onSuccess, onError);
}

function camStart() {

  //      var button = document.querySelector('button');
  var splash = document.querySelector('splash');
  var buttonRight = document.querySelector('buttonRight');
  var buttonLeft = document.querySelector('buttonLeft');
  var buttonUp = document.querySelector('buttonUp');
  var buttonDown = document.querySelector('buttonDown');
  splash.onclick = function (e) {
    userMedia();
    if (document.body.requestFullscreen) {
      document.body.requestFullscreen();
    } else if (document.body.msRequestFullscreen) {
      document.body.msRequestFullscreen();
    } else if (document.body.mozRequestFullScreen) {
      document.body.mozRequestFullScreen();
    } else if (document.body.webkitRequestFullscreen) {
      document.body.webkitRequestFullscreen();
    }
    splash.hidden = true;
  }

  document.onkeypress = function (e) {
    if (e.keyCode == 52) {
      e.preventDefault();
      Action(4);
    }
    if (e.keyCode == 51 || e.keyCode == 13) {
      e.preventDefault();
      Action(3);
    }
    if (e.keyCode == 32 || e.keyCode == 49) {
      e.preventDefault();
      Action(1);
    }
    if (e.keyCode == 50) {
      e.preventDefault();
      Action(2);
    }
    if (e.keyCode == 53) {
      buttonRight.hidden = !buttonRight.hidden;
      buttonLeft.hidden = !buttonLeft.hidden;
      buttonUp.hidden = !buttonUp.hidden;
      buttonDown.hidden = !buttonDown.hidden;
      e.preventDefault();
    }
    if (e.keyCode == 54) {
      Param2 = 1 - Param2;
      e.preventDefault();
    }
  };
  buttonRight.onclick = function (e) {
    Action(1);
  }
  buttonLeft.onclick = function (e) {
    Action(2);
  }
  buttonUp.onclick = function (e) {
    Action(3);
  }
  buttonDown.onclick = function (e) {
    Action(4);
  }
}

function PlayIt() {
  webcam.play();
  webGLStart();
}

function onSuccess(stream) {
  //      var videoSource;
  //
  //      if (window.URL) {
  //         videoSource = window.URL.createObjectURL(stream);
  //      } else {
  //         videoSource = stream;
  //      }
  //      webcam.src = stream;
  webcam.srcObject = stream;
  PlayIt();
}

function onError() {
  alert('There has been a problem retreiving the streams - are you running on file:/// or did you disallow access?');
}
