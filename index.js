/*uncommeny for project nav and lint - comment for run*/
//import * as twgl from './node_modules/twgl.js/dist/4.x/twgl-full.js';
//import { StringDecoder } from 'string_decoder';
/*eslint-disable no-undef*/
/*global some_unused_var*/
/*eslint-disable nonblock-statement-body-position*/
const tdlfps = 'tdl.fps';
const tdlfast = 'tdl.fast';
const tdlprim = 'tdl.primitives';
tdl.require(tdlfps);
tdl.require(tdlfast);
tdl.require(tdlprim);

if (!window.Float32Array) {
    // This makes errors go away when there is no WebGL.
    window.Float32Array = function() {};
}
/*globals*/
var bugs = []; // array of bugs verts only
var bugsArray = []; //local variable to store all bug data
var btime = 0;
var bugSize = 0.25;
var bugSpeed = 3; // intervaúl at which bugs appear
var bugMaxGroups = 10; //max num bugs per group
var bugsgroup = document.getElementById("bugsgroup");
var bugsgroupu= 10;//active bug groups in game
var bugsdead = document.getElementById("bugsdead");
var bugsdeadu = 0;//sum of killed bugs
var bugscount=0;
var bugstotal = document.getElementById("bugstotal");
var bugstotalu = 0;
const numb = 159;//max bugs to display
var clock = 0.0;
var clx, cly;
var clicked;
var debug = true;
var diskSpeed = [0.5, 0.3, 0.2];//initial movement speed for 3D disk
var frameCount = 0;
var g_fpsTimer;
var gamescore = document.getElementById("gamescore");
var gamescoreu = 0;
var stime = document.getElementById("stime");
var statusu = 0;

var then = 0.0;

/*BOILERPLATE SETUP*/
/*WEBGL INIT TASKS CONTINUES AFTER SHADERS DEINED
create shaders, create vertexes, upload to buffers
create textures and upload to buffers*/
twgl.setDefaults({ attribPrefix: "a_" });
twgl.setDefaults({enableVertexArrayObjects: true});
const m4 = twgl.m4;
const gl = document.querySelector("#c").getContext("webgl");
const programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);
g_fpsTimer = new tdl.fps.FPSTimer();
//The master sphere vArrrayAttribBuffers
const sphere = twgl.primitives.createSphereBufferInfo(gl, 5, 48, 24);
//the game bugs
const bugbuff = twgl.primitives.createSphereBufferInfo(gl, bugSize, 6, 4);

//combine all vertex buffers
const shapes = [];
shapes.push(sphere);
for (i=0; i< numb;i++)
  shapes.push(bugbuff);

var ctx = WebGLDebugUtils.makeDebugContext(c.getContext("webgl"));
WebGLDebugUtils.init(ctx);

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

/*game functions*/
function rand(min, max) {
    if (max === undefined) {
      max = min;
      min = 0;
    }
    return min + Math.random() * (max - min);
}

function deathToll(indx){
  bugsdeadu++;
  bugscount--;
  bugsArray.pop(indx);
  shapes.pop(indx+1);
  objects.pop(indx+1);
  r.pop(indx+1);
  drawRenders.pop(indx+1);
  drawObjects.pop(indx+1);
}

function bugCount(){
  if (bugscount >=1){
    bugstotalu = Math.min(bugscount,r.length);
    //bugstotalu -= bugsdeadu;
  }
}

function stupdate(){
  return btime;
}

function gameupdate(){
  bugsdead.innerHTML = bugsdeadu;
  gamescoreu=btime;
  gamescore.innerHTML = gamescoreu+bugsdeadu*10;
  bugCount();
  bugstotal.innerHTML = bugstotalu;
  bugsgroupu = Math.ceil((bugstotalu/bugMaxGroups));
  bugsgroup.innerHTML = bugsgroupu;
  statusu = stupdate();
  stime.innerHTML = statusu;
}

// Shared values
const lightWorldPosition = [1, 8, -10];
const lightColor = [1, 1, 1, 1];
const camera = m4.identity();
const view = m4.identity();
const viewProjection = m4.identity();
var fpsElem = document.getElementById("fps");

const tex = twgl.createTexture(gl, {
    /*Applies beach ball or stripe like texture so that spehere and bug
     animation can be seen better through lighting effect
     for beachball change to m4*/ 
    mag: gl.NEAREST,
    min: gl.LINEAR,
    format: gl.LUMINANCE,
    src: [
      128, 
      255, 
      128, 
      128, 
      255, 
      128, 
      128, 
      255, 
      128,  
    ],
    width: 1,
});

const objects = [];
const drawObjects = [];
const numObjects = 100;
/*
function msphere(){
    const baseHue = rand(0, 360);
    const uniforms = {
        u_lightWorldPos: lightWorldPosition,
        u_lightColor: lightColor,
        u_diffuseMult: chroma.hsv((baseHue + rand(0, 60) % 360), 0.6 , 0.8 ).gl(),
        //u_diffuseMult: chroma.random().hsv().gl(),
        u_specular: [1, 1, 1, 1],
        u_shininess: 100,
        u_specularFactor: 1,
        u_diffuse: tex,
        u_viewInverse: camera,
        u_world: m4.identity(),
        u_worldInverseTranspose: m4.identity(),
        u_worldViewProjection: m4.identity(),
    };
    drawObjects.push({
        programInfo: programInfo,
        bufferInfo: shapes,
        uniforms: uniforms,
    });
      objects.push({
            //translation: [rand(-10, 10), rand(-10, 10), rand(-10, 10)],
            translation: [0.0, 0.0, 0.0],
            xSpeed: diskSpeed[0],
            ySpeed: diskSpeed[1],
            zSpeed: diskSpeed[2],
            uniforms: uniforms,
        });
  }
  msphere();

        //need functin to calculate clickable bug space verts
        //push(bugs);

/* Bug Prep*/

const texb = twgl.createTexture(gl, {
  //Applies bug lined textures*
  mag: gl.NEAREST,
  min: gl.LINEAR,
  format: gl.LUMINANCE,
  src: [
    128, 255,128, 255,128, 255,128, 255,
    255, 128,255, 128,255, 128,255, 128,
    128, 255,128, 255,128, 255,128, 255,
    255, 128,255, 128,255, 128,255, 128,
    128, 255,128, 255,128, 255,128, 255,
    255, 128,255, 128,255, 128,255, 128,
    128, 255,128, 255,128, 255,128, 255,
    255, 128,255, 128,255, 128,255, 128,
    128, 255,128, 255,128, 255,128, 255, 
  ],
  width: 1,
});

for (let i = 0; i < numObjects; i++) {
  const baseHueb = rand(0, 360);
  const id = i;
  if (i === 0){
  const uniforms = {
      u_lightWorldPos: lightWorldPosition,
      u_lightColor: lightColor,
      u_diffuseMult: chroma.hsv((baseHueb + rand(0, 60) % 360), 0.6 , 0.8 ).gl(),
      //u_diffuseMult: chroma.random().hsv().gl(),
      u_specular: [1, 1, 1, 1],
      u_shininess: 100,
      u_specularFactor: 1,
      u_diffuse: tex,
      u_viewInverse: camera,
      u_world: m4.identity(),
      u_worldInverseTranspose: m4.identity(),
      u_worldViewProjection: m4.identity(),
  };
    drawObjects.push({
      programInfo: programInfo,
      bufferInfo: shapes[i%shapes.length],
      uniforms: uniforms,
  });
    objects.push({
          //translation: [rand(-10, 10), rand(-10, 10), rand(-10, 10)],
          id: id,
          translation: [0.0, 0.0, 0.0],
          xSpeed: diskSpeed[0],
          ySpeed: diskSpeed[1],
          zSpeed: diskSpeed[2],
          uniforms: uniforms,
      });
  }
  if (i > 0) {
    const uniforms = {
      u_lightWorldPos: lightWorldPosition,
      u_lightColor: lightColor,
      u_diffuseMult: chroma.hsv((baseHueb + rand(0, 60) % 360), 0.6 , 0.8 ).gl(),
      //u_diffuseMult: chroma.random().hsv().gl(),
      u_specular: [1, 1, 1, 1],
      u_shininess: 100,
      u_specularFactor: 1,
      u_diffuse: texb,
      u_viewInverse: camera,
      u_world: m4.identity(),
      u_worldInverseTranspose: m4.identity(),
      u_worldViewProjection: m4.identity(),
    };
    drawObjects.push({
        id: id,
        programInfo: programInfo,
        bufferInfo: shapes[i%shapes.length],
        uniforms: uniforms,
    });
    var switx=rand(0, 1.5);
    var switz=-4.9;
    if (i % 2 == 0){
      switx=rand(-1.5,0);
      switz = 4.9;
      }
    objects.push({
          //translation: [rand(-10, 10), rand(-10, 10), rand(-10, 10)],
          translation: [switx, rand(-1.5, 1.5), switz],
          xSpeed: diskSpeed[0],
          ySpeed: diskSpeed[1],
          zSpeed: diskSpeed[2],
          uniforms: uniforms,
      });
    let alive = true;
    let position = [objects[i].translation[0], objects[i].translation[1]];
    let bug = {};
    bug.position = position;
    bug.alive = alive;
    bug.ySpeed =objects[i].ySpeed;
    bug.zSpeed =objects[i].zSpeed;
    bugs.push(position);
    bugsArray.push(bug);
  }
}

var createFlattenedVertices = function(gl, vertices) {
    var last;
    return WebGLUtils.createBufferInfoFromArrays(
        gl,
        twgl.primitives.makeRandomVertexColors(
            twgl.primitives.deindexVertices(vertices), {
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

const r = [];
const drawRenders= [];
/*RENDER TIME - 3of3 -ear and set the viewport and other global state
 --call gl.useProgram, setup uniforms, gl.drawArrays, gl.drawElemetns
  */
function render(time) {
    time *= 0.001;
    ++frameCount;
    if (frameCount % 60 === 0){
        btime += 1;
        if (btime % bugSpeed == 0)
          bugscount = Math.min(((btime / bugSpeed)-bugsdeadu), numObjects);
    }
    var now = (new Date()).getTime() * 0.001;
    var elapsedTime;
    if (then === 0.0) {
        elapsedTime = 0.0;
    } else {
        elapsedTime = now - then;
    }
    then = now;
    clock += elapsedTime;
    c.onmousedown = handleMouseDown;
    //eye speed 1/10 of elapsed time
    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const projection = m4.perspective(30 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.5, 100);
    const eye = [1, 1, -20];
    const target = [0, 0, 0];
    const up = [0, 1, 0];
    const zero = [0, 0, 0];
    g_fpsTimer.update(elapsedTime);
    fpsElem.innerHTML = g_fpsTimer.averageFPS;

    m4.lookAt(eye, target, up, camera);
    m4.inverse(camera, view);
    m4.multiply(projection, view, viewProjection);
    
    if (r.length <= bugscount)
          r.push(objects[bugscount]);
    
    r.forEach(function(obj){
      const uni = obj.uniforms;
      const world = uni.u_world;
      m4.identity(world);
      m4.rotateY(world, time * obj.ySpeed, world);
      m4.rotateZ(world, time * obj.zSpeed, world);
      m4.translate(world, obj.translation, world);
      m4.rotateX(world, obj.xSpeed, world);
      m4.transpose(m4.inverse(world, uni.u_worldInverseTranspose), uni.u_worldInverseTranspose);
      m4.multiply(viewProjection, uni.u_world, uni.u_worldViewProjection);
      });
    if (drawRenders.length <= bugscount)
      drawRenders.push(drawObjects[bugscount]);
    twgl.drawObjectList(gl, drawRenders);
    requestAnimationFrame(render);
    gameupdate();
}
requestAnimationFrame(render);

/*takes the clicked vector and searches through current game bugs that
are alive and match the clicked cods which are stored in the bugsArray.position
as vector coordinates
returns true if any match is found - false otherwise*/
function bugverts(){
  for (let i=1; i <= bugscount; i++){
    const tx = r[i].uniforms.u_world[12];
    const ty = r[i].uniforms.u_world[13];
    const tz = r[i].uniforms.u_world[14];
    const tw = tx + ty + tz;
    const bugi = i-1;
    //console.log( "w:"+ tw);
    bugsArray[i-1].position[0] = (tx/tz)/(-9/tz);
    bugsArray[i-1].position[1] = (ty/tz)/(5/tz);
    bugsArray[i-1].position[2] = tz;
    if (debug === true){
      console.log("bug["+bugi+"] x:"+bugsArray[i-1].position[0]+" y:"+bugsArray[i-1].position[1]+
      ".........    " +"tx,ty,tz.tw" + tx + ", " + ty + ", " + tz+" "+tw);
      //console.log("U_WORLD:" + objects[i].uniforms.u_world);
    }
  }
}

// eslint-disable-next-line strict
function findClickedBug(clicked) {
  let audioc = new Audio('common/music/click.mp3');
  bugverts();
  for (let i = 0; i < bugscount; i += 1) {
      if (bugsArray[i].position[2] < 0){
        const bugx = bugsArray[i].position[0];
        const bugy = bugsArray[i].position[1];
        const bugxl = (Math.abs(clicked[0] - bugx));
        const bugyl = (Math.abs(clicked[1] - bugy));
        if (debug === true)
          console.log("bugxl, bugxy[ "+i+"]" + bugxl +", " + bugyl+"<"+bugSize);
        if ((bugxl < bugSize) && (bugyl < bugSize)) {
              //if (bugsArray[i].alive == false)
                //return false;
              //bugsArray[i].alive = false;
              audioc.play();
              deathToll(i);
              if (debug === true){
                console.log("bug["+i+"] killed at vector: [" + bugx + ", " + bugy + "]");
              }
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
    clx = -1 + 2*event.clientX/c.width;
    cly = -1 + 2*(c.height-event.clientY)/c.height;
    //vv = (Math.sqrt((clx * clx) + (cly * cly)));
    clicked = [clx , cly];
    if (debug === true){
      console.log("client:" + event.clientX + ", " + event.clientY);
      console.log("clicked:" + clicked);
    }
    findClickedBug(clicked);
}
