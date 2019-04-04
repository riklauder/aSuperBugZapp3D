/*eslint-disable no-undef*/
/*global some_unused_var*/
/*eslint-disable nonblock-statement-body-position*/
function Explosion(clickx, clicky, elapsedTimep ){
//local variables for particle explosion
    var canvas, glp,
    ratio,
    vertices,
    velocities,
    freqArr,
    cw,
    ch,
    colorLoc,
    thetaArr,
    velThetaArr,
    ptsArr,
    randRateArr,
    drawType,
    numLines = 2000;
  var then = 0.0;
  var target = [];
  var randomTargetXArr = [], randomTargetYArr = [];
  drawType = 2;

  loadParticle();

  function loadParticle(){
    /**
   * Initialises WebGL and canvas element
   */
    const m4 = twgl.m4;
    canvas = document.getElementById("p");
    glp = document.querySelector("#p").getContext("experimental-webgl", { premultipliedAlpha: false });
    const program = twgl.createProgramInfo(glp, ["shader-vs", "shader-fs"]);

    if (!glp) {
      alert("There's no WebGL context available.");
      return;
    }
    p.addEventListener("webglcontextlost", function(e) { e.preventDefault(); }, false); 
    p.addEventListener("webglcontextrestored", function(e) { e.initializeResources();}, false); 
    //Set the viewport based on click coordinates
    cw = 160;
    ch = 100;
    clickw = clickx/2+cw/2;
    clickh = (p.clientHeight/2 - clicky/2);
    glp.viewport(clickw, clickh, cw, ch);
    //Shaders
    var vertexShaderScript = document.getElementById("shader-vs");
    var vertexShader = glp.createShader(glp.VERTEX_SHADER);
    glp.shaderSource(vertexShader, vertexShaderScript.text);
    glp.compileShader(vertexShader);
    if (!glp.getShaderParameter(vertexShader, glp.COMPILE_STATUS)) {
      alert("Couldn't compile the vertex shader");
      glp.deleteShader(vertexShader);
      return;
    }

    var fragmentShaderScript = document.getElementById("shader-fs");
    var fragmentShader = glp.createShader(glp.FRAGMENT_SHADER);
    glp.shaderSource(fragmentShader, fragmentShaderScript.text);
    glp.compileShader(fragmentShader);
    if (!glp.getShaderParameter(fragmentShader, glp.COMPILE_STATUS)) {
      alert("Couldn't compile the fragment shader");
      glp.deleteShader(fragmentShader);
      return;
    }
    
    //    Create a shader program.
    glp.program = glp.createProgram();
    glp.attachShader(glp.program, vertexShader);
    glp.attachShader(glp.program, fragmentShader);
    glp.linkProgram(glp.program);
    //    Install the program as part of the current rendering state
    glp.useProgram(glp.program);
    //    Get the vertexPosition attribute from the linked shader program
    var vertexPosition = glp.getAttribLocation(glp.program, "vertexPosition");
    glp.enableVertexAttribArray(vertexPosition);
    //    Clear the color buffer (r, g, b, a) with the specified color
    glp.clearColor(0.0, 0.0, 0.0, 0.0);
    //    Clear the depth buffer. The value specified is clamped to the range [0,1].
    glp.clearDepth(1.0);
    //    Enable depth testing.  When another pixel is drawn at the same location the z
    //    values are compared in order to determine which pixel should be drawn.
    //glp.enable(glp.DEPTH_TEST);
    glp.enable(glp.BLEND);
    glp.disable(glp.DEPTH_TEST);
    glp.blendFunc(glp.ONE, glp.ONE_MINUS_SRC_ALPHA );
    //    Specify which function to use for depth buffer comparisons. It compares the
    //    GL_NEVER - Never passes.
    //    GL_LESS - Passes if the incoming depth value is less than the stored depth value.
    //    GL_EQUAL - Passes if the incoming depth value is equal to the stored depth value.
    //    GL_LEQUAL - Passes if the incoming depth value is less than or equal to the stored depth value.
    //    GL_GREATER - Passes if the incoming depth value is greater than the stored depth value.
    //    GL_NOTEQUAL - Passes if the incoming depth value is not equal to the stored depth value.
    //    GL_GEQUAL - Passes if the incoming depth value is greater than or equal to the stored depth value.
    //    GL_ALWAYS - Always passes.
    //glp.depthFunc(glp.NEVER);

    var vertexBuffer = glp.createBuffer();
    //    Bind the buffer object to the ARRAY_BUFFER target.
    glp.bindBuffer(glp.ARRAY_BUFFER, vertexBuffer);
    setup();

    vertices = new Float32Array(vertices);
    velocities = new Float32Array(velocities);
    thetaArr = new Float32Array(thetaArr);
    velThetaArr = new Float32Array(velThetaArr);
    ptsArr = new Float32Array(ptsArr);

    //    gl.bufferData
    //    STREAM - The data store contents will be modified once and used at most a few times.
    //    STATIC - The data store contents will be modified once and used many times.
    //    DYNAMIC - The data store contents will be modified repeatedly and used many times.
    //    The nature of access may be one of these:
    //    DRAW - The data store contents are modified by the application, and used as the source for
    //           GL drawing and image specification commands.
    //    READ - The data store contents are modified by reading data from the GL, and used to return
    //           that data when queried by the application.
    //    COPY - The data store contents are modified by reading data from the GL, and used as the source
    //           for GL drawing and image specification commands.
    glp.bufferData(glp.ARRAY_BUFFER, vertices, glp.DYNAMIC_DRAW);
    //    Clear the color buffer and the depth buffer
    glp.clear(glp.COLOR_BUFFER_BIT | glp.DEPTH_BUFFER_BIT);
    //    Define the viewing frustum parameters
    //    More info: http://en.wikipedia.org/wiki/Viewing_frustum
    var fieldOfView = 40.0;
    var aspectRatio = canvas.width / canvas.height;
    var nearPlane = 1.0;
    var farPlane = 1000.0;
    var top = nearPlane * Math.tan(fieldOfView * Math.PI / 360.0);
    var bottom = -top;
    var right = top * aspectRatio;
    var left = -right;
    /*Perspective MAtrix with all calcs*/
    var a = (right + left) / (right - left);
    var b = (top + bottom) / (top - bottom);
    var c = (farPlane + nearPlane) / (farPlane - nearPlane);
    var d = (2 * farPlane * nearPlane) / (farPlane - nearPlane);
    var x = (2 * nearPlane) / (right - left);
    var y = (2 * nearPlane) / (top - bottom);
    var perspectiveMatrix = [
      x, 0, a, 0,
      0, y, b, 0,
      0, 0, c, d,
      0, 0, -1, 0      ];

    //     modelview matrix based on I
    var modelViewMatrix = m4.identity();
    //     Get the gl vertex position attribute from shader program
    var vertexPosAttribLocation = glp.getAttribLocation(glp.program, "vertexPosition");
    //     Specify the location and format of the vertex position attribute
    glp.vertexAttribPointer(vertexPosAttribLocation, 3.0, glp.FLOAT, false, 0, 0);
    //     Get the location of the modelViewMatrix fron shader program
    var uModelViewMatrix = glp.getUniformLocation(glp.program, "modelViewMatrix");
    //     Get the location of the perspectiveMatrix for uniforms from shader program
    var uPerspectiveMatrix = glp.getUniformLocation(glp.program, "perspectiveMatrix");
    //     Set unifomr values
    glp.uniformMatrix4fv(uModelViewMatrix, false, new Float32Array(perspectiveMatrix));
    glp.uniformMatrix4fv(uPerspectiveMatrix, false, new Float32Array(modelViewMatrix));
    p.onmousedown = handleMouseDown;
    animate();
    setTimeout(timer, 400);
  }
/*Single anmate function*/
function animate() {
  if (elapsedTimep > 1)
    return;
  requestAnimationFrame(animate);
  drawScene();
}

function drawScene() {
  var now = (new Date()).getTime() * 0.001;
    if (then === 0.0) {
        elapsedTimep = 0.001;
    } else {
        elapsedTimep += 0.015;
    }
    then = now;
  if (elapsedTimep < 1)
    draw();
  else {
    glp.clearColor(1.0, 1.0,1.0, 0.0);
    glp.clear(glp.COLOR_BUFFER_BIT | glp.DEPTH_BUFFER_BIT);
    return;
  }
  glp.lineWidth(10);
  glp.bufferData(glp.ARRAY_BUFFER, vertices, glp.DYNAMIC_DRAW);
  glp.clear(glp.COLOR_BUFFER_BIT | glp.DEPTH_BUFFER_BIT);
  //glp.drawArrays( glp.LINES_STRIP, 0, numLines );
  glp.drawArrays(glp.LINES, 0, numLines);
  //glp.drawArrays( glp.QUAD_STRIP, 0, numLines );
  glp.flush();
}
/**Cycle through 3 particle states */
function draw() {
  switch (drawType) {
    case 0:
      draw0();
      break;
    case 1:
      draw1();
      break;
    case 2:
      draw2();
      break;
  }
}
/**Setting up all the render info for vertices */
function setup() {
  vertices = [];
  velThetaArr = [];
  ptsArr = [];
  ratio = cw / ch;
  velocities = [];
  thetaArr = [];
  freqArr = [];
  randRateArr = [];

  for (var ii = 0; ii < numLines; ii++) {
    var pts = ( 0.1 + 0.2 * Math.random() );
    var theta = Math.random() * Math.PI * 2;
    var velTheta = Math.random() * Math.PI * 2 / 30;
    var freq = Math.random() * 0.12 + 0.03;
    var randRate = Math.random() * 0.04 + 0.01;
    var randomPosX = (Math.random() * 2  - 1) * window.innerWidth / window.innerHeight;
    var randomPosY = Math.random() * 2 - 1;

    vertices.push(pts * Math.cos(theta), pts * Math.sin(theta), 1.83);
    vertices.push(pts * Math.cos(theta), pts * Math.sin(theta), 1.83);

    thetaArr.push(theta);
    velThetaArr.push(velTheta);
    ptsArr.push(pts);
    freqArr.push(freq);
    randRateArr.push(randRate);

    randomTargetXArr.push(randomPosX);
    randomTargetYArr.push(randomPosY);
  }
  freqArr = new Float32Array(freqArr);
}
/** 1 of 3 particle state functions*/
function draw0() {//randomTargetArr
  var i=vertices.length, bp;
  var px, py;
  var num;
  var targetX, targetY;
  for (i = 0; i < numLines * 2; i += 2) {
    bp = i * 3;
    vertices[bp] = vertices[bp + 3];
    vertices[bp + 1] = vertices[bp + 4];

    num = parseInt(i / 2);
    targetX = randomTargetXArr[num];
    targetY = randomTargetYArr[num];

    px = vertices[bp + 3];
    px += (targetX - px) * (Math.random() * 0.04 + 0.06);
    vertices[bp + 3] = px;
    py = vertices[bp + 4];
    py += (targetY - py) * (Math.random() * 0.04 + 0.06);
    vertices[bp + 4] = py;
  }
}
// -------------------------------
function draw1() {//ThetaArr-velTehta
  var i, n = vertices.length, p, bp;
  var px, py;
  var pTheta;
  var pts;
  var num;
  var targetX, targetY;
  for (i = 0; i < numLines * 2; i += 2) {
    bp = i * 3;
    vertices[bp] = vertices[bp + 3];
    vertices[bp + 1] = vertices[bp + 4];

    num = parseInt(i / 2);
    pTheta = thetaArr[num];
    pts = ptsArr[num];

    pTheta = pTheta + velThetaArr[num];
    thetaArr[num] = pTheta;

    targetX = pts * Math.cos(pTheta);
    targetY = pts * Math.sin(pTheta);

    px = vertices[bp + 3];
    px += (targetX - px) * (Math.random() * 0.1 + 0.1);
    vertices[bp + 3] = px;


    py = vertices[bp + 4];
    py += (targetY - py) * (Math.random() * 0.1 + 0.1);
    vertices[bp + 4] = py;
  }
}

function draw2() {

  var i, n = vertices.length, p, bp;
  var px, py;
  var pTheta;
  var pts;
  var num;

  for (i = 0; i < numLines * 2; i += 2) {
    bp = i * 3;
    // copy old positions 
    vertices[bp] = vertices[bp + 3];
    vertices[bp + 1] = vertices[bp + 4];

    num = parseInt(i / 2);
    pTheta = thetaArr[num];

    pts = ptsArr[num];// + Math.cos(pTheta + i * freqArr[i]) *  randRateArr[num];

    pTheta = pTheta + velThetaArr[num];
    thetaArr[num] = pTheta;

    px = vertices[bp + 3];
    px = pts * Math.cos(pTheta) * 0.1 + px;
    vertices[bp + 3] = px;

    py = vertices[bp + 4];

    py = py + pts * Math.sin(pTheta) * 0.1;
    //p *= ( Math.random() -.5);
    vertices[bp + 4] = py;
  }
}

function timer() {
  drawType = (drawType+1) % 3;
  setTimeout(timer, 400);
  }
}

