/* eslint-disable strict */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable nonblock-statement-body-position */
// Handles the mouse down event and stores the coordinates of the user
// Also calculates the distance from the center of the circle
tdl.require('tdl.fps');
tdl.require('tdl.fast');
if (!window.Float32Array) {
    // This just makes some errors go away when there is no WebGL.
    window.Float32Array = function() {};
}

var at;
var bugClickedOn = [];
var bugColors = []; // colors for bugs
var bugs = []; // array of bugs verts only
var bugsArray = []; //local variable to store all bug data
var btime = 0;
var bugSize = 0.3;
var bugSpeed = 5; // interval at which bugs appear
var bugMaxVertices = 10; //max number of bugs

var clock = 0.0;
var clx, cly;
var clicked;
var colors;
var currBugs = 0;
var eye;
var eyeClock = 0;
var frameCount = 0;
var g_fpsTimer;
var gamePoints = 0;
var incrementer = 0;
var localMatrix;
var modelViewMatrix;
var noOfBugPoints = 1600;
var noOfBugs = 25; //max number of bugs at once
var noOfBugsKilled = 0;
var normalize = false;
var pointSize = 10;
var poisonIncrementer = [];
var projectionMatrix;
var radiusOfCircle = 0.4;
var then = 0.0;
var twgl;
var vertices = [];
var vv;
var WorldMatrix;

/*BOILERPLATE SETUP*/
/*WEBGL INIT TASKS CONTINUES AFTER SHADERS DEINED
create shaders, create vertexes, upload to buffers, 
create textures and upload to buffers*/
twgl.setDefaults({ attribPrefix: "a_" });
const m4 = twgl.m4;
const gl = document.querySelector("#c").getContext("webgl");
const programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);
g_fpsTimer = new tdl.fps.FPSTimer();
const shapes = [
    //templates for gameWorld object shaps
    //sphere
    twgl.primitives.createSphereBufferInfo(gl, 5, 48, 24),
    //game-bug
    twgl.primitives.createSphereBufferInfo(gl, bugSize, 6, 5),
    twgl.primitives.createSphereBufferInfo(gl, bugSize, 6, 5),
    twgl.primitives.createSphereBufferInfo(gl, bugSize, 6, 5),
    twgl.primitives.createSphereBufferInfo(gl, bugSize, 6, 5),
    twgl.primitives.createSphereBufferInfo(gl, bugSize, 6, 5),
    twgl.primitives.createSphereBufferInfo(gl, bugSize, 6, 5),
    twgl.primitives.createSphereBufferInfo(gl, bugSize, 6, 5),
];

var ctx = WebGLDebugUtils.makeDebugContext(c.getContext("webgl"));
WebGLDebugUtils.init(ctx);
//alert(WebGLDebugUtils.glEnumToString(ctx.getError()));
/* Helps setup parent child scene relationships*/
/*var Node = function() {
      this.children = [];
      this.localMatrix = m4.identity();
      this.worldMatrix = m4.identity();
    };

    Node.prototype.setParent = function(parent) {
      // remove us from our parent
      if (this.parent) {
        var ndx = this.parent.children.indexOf(this);
        if (ndx >= 0) {
          this.parent.children.splice(ndx, 1);
        }
      }
      // Add us to our new parent
      if (parent) {
        parent.children.append(this);
      }
      this.parent = parent;
    };

    Node.prototype.updateWorldMatrix = function(parentWorldMatrix) {
      if (parentWorldMatrix) {
        // a matrix was passed in so do the math and
        // store the result in `this.worldMatrix`.
        m4.multiply(this.localMatrix, parentWorldMatrix, this.worldMatrix);
      } else {
        // no matrix was passed in so just copy localMatrix to worldMatrix
        m4.copy(this.localMatrix, this.worldMatrix);
      }
    
      // now process all the children
      var worldMatrix = this.worldMatrix;
      this.children.forEach(function(child) {
        child.updateWorldMatrix(worldMatrix);
      });
  };*/

function rand(min, max) {
    return min + Math.random() * (max - min);
}

// Shared values
const lightWorldPosition = [1, 8, -10];
const lightColor = [1, 1, 1, 1];
const camera = m4.identity();
const view = m4.identity();
const viewProjection = m4.identity();
var fpsElem = document.getElementById("fps");

const tex = twgl.createTexture(gl, {
    /*Applies beach ball like texture so that spehere and bug
     animation can be seen better through lighting effect*/
    min: gl.NEAREST,
    mag: gl.NEAREST,
    src: [
        255, 255, 255, 255,
        192, 192, 192, 255,
        192, 192, 192, 255,
        255, 255, 255, 255,
    ],
});

const objects = [];
const drawObjects = [];
const numObjects = 8;
for (let ii = 0; ii < numObjects; ++ii) {
    const baseHue = rand(0, 360);
    const uniforms = {
        u_lightWorldPos: lightWorldPosition,
        u_lightColor: lightColor,
        u_diffuseMult: chroma.hsv((baseHue + rand(0, 60) % 360), 0.5 + (ii * 0.5), 0.8 + (ii * 0.1)).gl(),
        //u_diffuseMult: chroma.random().hsv().gl(),
        u_specular: [1, 1, 1, 1],
        u_shininess: 75,
        u_specularFactor: 1,
        u_diffuse: tex,
        u_viewInverse: camera,
        u_world: m4.identity(),
        u_worldInverseTranspose: m4.identity(),
        u_worldViewProjection: m4.identity(),
    };
    drawObjects.push({
        programInfo: programInfo,
        bufferInfo: shapes[ii % shapes.length],
        uniforms: uniforms,
    });
    if (ii == 0) {
        objects.push({
            //translation: [rand(-10, 10), rand(-10, 10), rand(-10, 10)],
            translation: [0.0, 0.0, 0.0],
            ySpeed: rand(0.0, 0.0),
            zSpeed: rand(0.2, 0.4),
            uniforms: uniforms,
        });
    }
    if (ii > 0) {
        //add bugs to object for render
        objects.push({
            //translation: [rand(-10, 10), rand(-10, 10), rand(-10, 10)],
            translation: [rand(-1, 1), rand(-1, 1), -5],
            ySpeed: rand(0.1, 0.2),
            zSpeed: rand(0.2, 0.4),
            uniforms: uniforms,
        });
        let alive = true;
        let position = [objects[ii].translation[0], objects[ii].translation[1]];
        let bug = {};
        bug.position = position;
        bug.alive = alive;
        bugs.push(position);
        bugsArray.push(bug);
        //need functin to calculate clickable bug space verts
        //push(bugs);
    }
}

var createFlattenedVertices = function(gl, vertices) {
    var last;
    return webglUtils.createBufferInfoFromArrays(
        gl,
        primitives.makeRandomVertexColors(
            primitives.deindexVertices(vertices), {
                vertsPerColor: 1,
                rand: function(ndx, channel) {
                    if (channel === 0) {
                        last = 128 + Math.random() * 128 | 0;
                    }
                    return channel < 3 ? last : 255;
                }
            })
    );
};

//
//var objectsToDraw = [];//also objects[]
/*
// make all the nodes
var sphereNode = new Node();
  sphereNode.localMatrix = m4.translation(0, 0, 0);//it's already at centre of world
  sphereNode.drawInfo = {
    uniforms: {
      u_colorOffset: [0.6, 0.6, 0, 1], // 
      u_colorMult:   [0.5, 0.5, 0, 1],
    },
    programInfo: programInfo,
    bufferInfo: sphereBufferInfo,
  };

var bugsNode = new Node();
  bugsNode.localMatrix = m4.translation(100, 0, 0);  // earth 100 units from the sun
  bugsNode.drawInfo = {
    uniforms: {
      u_colorOffset: [0.2, 0.5, 0.8, 1],  // blue-green
      u_colorMult:   [0.8, 0.5, 0.2, 1],
    },
    programInfo: programInfo,
    bufferInfo: sphereBufferInfo,
  };

// connect the scene objects
bugsNode.setParent(sphereNode);

objects = [
    sphereNode,
    bugsNode,
  ];
*/

/*RENDER TIME - 3of3 -ear and set the viewport and other global state 
 --call gl.useProgram, setup uniforms, gl.drawArrays, gl.drawElemetns
  */
function render(time) {
    time *= 0.001;
    c.onmousedown = handleMouseDown;
    ++frameCount;
    if (frameCount % 60 == 0)
        btime += 1;
    bugSize = (btime / 10) + 0.5;
    var now = (new Date()).getTime() * 0.001;
    var elapsedTime;
    if (then == 0.0) {
        elapsedTime = 0.0;
    } else {
        elapsedTime = now - then;
    }
    then = now;
    clock += elapsedTime;
    //eye speed 1/10 of elapsed time
    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const projection = m4.perspective(30 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.5, 100);
    const eye = [1, 4, -20];
    const target = [0, 0, 0];
    const up = [0, 1, 0];

    g_fpsTimer.update(elapsedTime);
    fpsElem.innerHTML = g_fpsTimer.averageFPS;

    m4.lookAt(eye, target, up, camera);
    m4.inverse(camera, view);
    m4.multiply(projection, view, viewProjection);
    var i = btime / 10;
    objects.forEach(function(obj) {
        const uni = obj.uniforms;
        const world = uni.u_world;
        m4.identity(world);
        m4.rotateY(world, time * obj.ySpeed, world);
        m4.rotateZ(world, time * obj.zSpeed, world);
        m4.translate(world, obj.translation, world);
        m4.rotateX(world, time, world);
        m4.transpose(m4.inverse(world, uni.u_worldInverseTranspose), uni.u_worldInverseTranspose);
        m4.multiply(viewProjection, uni.u_world, uni.u_worldViewProjection);
    });

    twgl.drawObjectList(gl, drawObjects);

    requestAnimationFrame(render);
}
requestAnimationFrame(render);

/*takes the clicked vector and searches through current game bugs that
are alive and match the clicked cods which are stored in the bugsArray.position
as vector coordinates
returns true if any match is found - false otherwise*/
// eslint-disable-next-line strict
function findClickedBug(clicked) {
    for (let i = 0; i < bugs.length; i += 1) {
        const bugx = Math.abs(bugsArray[i].position[0]);
        const bugy = Math.abs(bugsArray[i].position[1]);
        const bugxl = bugx - 0.2;
        const bugxh = bugx + 0.2;
        const bugyl = bugy - 0.2;
        const bugyh = bugy + 0.2;
        if (clicked[0] >= bugxl && clicked[0] <= bugxh) {
            if (clicked[1] >= bugyl && clicked[0] <= bugyh) {
                bugsArray[i].alive = false;
                console.log("bug kileed at vector: [" + bugx + ", " + bugy + "]");
                return true;
            }
        }
    }
    return false;
}

/*handlemouse down uses canvas click event x-y coordinates
maps to origin at centre coordinates, normalizes coordinates to
a vector using float values for webgl*/
function handleMouseDown(event) {
    let audio = new Audio('common/music/click.mp3');
    audio.play();
    clx = event.clientX - (c.width / 2);
    cly = (c.height - event.clientY) - (c.height / 2);
    vv = (Math.sqrt(clx * clx) + Math.sqrt(cly * cly));
    clicked = [clx / vv, cly / vv];
    console.log("clicked:" + clicked);
    findClickedBug(clicked);
}