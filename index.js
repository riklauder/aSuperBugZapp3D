/*uncommeny for project nav and lint - comment for run*/
//import * as twgl from './node_modules/twgl.js/dist/4.x/twgl-full.js';

tdl.require('tdl.buffers');
const tdlfps = 'tdl.fps';
const tdlfast = 'tdl.fast';
const tdlfull = 'tdl.fullscreen';
tdl.require(tdlfast);
tdl.require(tdlfps);
tdl.require(tdlfull);

if (!window.Float32Array) {
    // This makes errors go away when there is no WebGL.
    window.Float32Array = function() {};
}
/*globals*/
var bugs = []; // array of bugs verts only
var bugsArray = []; //local variable to store all bug data
var btime = 0;
var bugSize = 0.2;
var bugSpeed = 2; // interval at which bugs appear
var bugMaxGroups = 12; //max num bug groups
var bugsgroup = document.getElementById("bugsgroup");
var bugsgroupu= 0;//active bug groups in game
var bugsdead = document.getElementById("bugsdead");
var bugsdeadu = 0;//sum of killed bugs
var bugscount=0;
var bugspawn = document.getElementById("bugspawn");
var bugspawnu = -1;
var bugstotal = document.getElementById("bugstotal");
var bugstotalu = 0;
const numb = 600;//max bugs to buffer
var clx, cly;
var ctx;//used with webgl debug
var clicked;
var debug = true;
var debugverbose = false;
var diskSpeed = [(-(Math.PI/2)/60), (Math.PI/2)/60, (Math.PI/2)/60];//initial movement speed for 3D disk
var diskStop = [0, 0, 0];
var diskRestart = [(-(Math.PI/2)/60), (Math.PI/2)/60, (Math.PI/2)/60];
var diskstopflag = false;
var elapsedTimep = 0.0;
var frameCount = 0;
var fast;
var g_fpsTimer;
var glp;
var gamescore = document.getElementById("gamescore");
var gamescoreu = 200;
var light = 1;//toggle 0 is on 1 is off
var limit = degToRad(10);
const lightColor = [[0.0, 0.0, 0.0, 1.0],[1.0, 1.0, 1.0, 1.0]];
var stime = document.getElementById("stime");
var statusu = 0;
var smess = document.getElementById("smessage");
var smessu = "zap the bugs";
var swin = "YOU WON!!!!";
var slose = "YOU LOST!!!";

var then = 0.0;

/*BOILERPLATE SETUP*/
/*WEBGL INIT TASKS CONTINUES AFTER SHADERS DEINED
create shaders, create vertexes, upload to buffers
create textures and upload to buffers*/
twgl.setDefaults({ attribPrefix: "a_" });
twgl.setDefaults({enableVertexArrayObjects: true});
const m4 = twgl.m4;
const gl = document.querySelector("#c").getContext("experimental-webgl", { premultipliedAlpha: false });
const programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);
g_fpsTimer = new tdl.fps.FPSTimer();
c.addEventListener("webglcontextlost", function(e) { e.preventDefault(); }, false); 
//The master sphere vArrrayAttribBuffers
const sphere = twgl.primitives.createSphereBufferInfo(gl, 5, 48, 24);
//the game bugs
const bugbuff = twgl.primitives.createSphereBufferInfo(gl, bugSize, 5,6);

//combine all vertex buffers
const shapes = [];
shapes.push(sphere);
for (i=0; i< numb;i++)
  shapes.push(bugbuff);

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
/*get Rad for rotations*/
function degToRad(d) {
  return d * Math.PI / 180;
}

function deathToll(indx){
  bugsdeadu++;
  bugscount--;
  bugs.pop(indx);
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
function bugspawhupdate(){
  return bugspawnu;
}
function stupdate(){
  return btime;
}

function gameupdate(){
  bugsdead.innerHTML = bugsdeadu;
  gamescoreu=200-bugspawnu;
  gamescore.innerHTML = gamescoreu+bugsdeadu*10;
  bugCount();
  bugstotal.innerHTML = bugstotalu;
  bugsgroupu = Math.min(bugMaxGroups, bugstotalu);
  bugsgroup.innerHTML = bugsgroupu;
  bugspawnu=bugspawhupdate();
  bugspawn.innerHTML = bugspawnu;
  statusu = stupdate();
  stime.innerHTML = statusu;
  if ((gamescoreu+bugsdeadu*10) > 1000){
    if (smessu != swin)
      confirm("YOU WON!!!!");
    smessu = swin;
    }
  if (bugstotalu > 200) {
    if (smessu != slose);
      confirm("YOU LOST!!!!");
    smessu = slose;
  }
  smess.innerHTML = smessu;
    if (btime == 45) 
    bugSpeed=1;
}

// Shared Or Updated values
/**
 * Sets lighting on or off
 */
function setLighing() {
  if (light==0)
    light = 1;
  else
   light=0;
  }

function stopDisk(){
  if (diskstopflag == false){
    diskSpeed = diskStop;
    diskstopflag = true;
  }
  else {
    diskSpeed = diskRestart;
    diskstopflag = false;
  }
}

function flipVertd(){
  if (diskSpeed[0] < 0.5)
    diskSpeed[0] += degToRad(6)/60;
  diskSpeed[2] = (-diskSpeed[0]);
}

function flipVert(){
  if (diskSpeed[0] > -0.5)
    diskSpeed[0] -= degToRad(6)/60;
  diskSpeed[2] = (-diskSpeed[0]);
}

function flipHor(){
  if (diskSpeed[1] < 0.5)
    diskSpeed[1] += degToRad(6)/60;
}
function flipHord(){
  if (diskSpeed[1] > -0.5)
    diskSpeed[1] -= degToRad(6)/60;
}

const lightWorldPosition = [0, 4, -10];
const camera = m4.identity();
const view = m4.identity();
const viewProjection = m4.identity();
var fpsElem = document.getElementById("fps");

/*tex is used for the sphere itself while texb applies to bugs */
const tex = twgl.createTexture(gl, {
    /*Applies beach ball or stripe like texture so that spehere and bug
    animation can be seen better through lighting effect
    for beachball change to m4*/ 
    mag: gl.LINEAR,
    min: gl.LINEAR,
    format: gl.RGB,
    src: [
      128, 255, 128, 128,  
      255, 128, 255, 255,  
      128, 255, 128, 255,  
      128, 128, 255, 128,  
      255, 255, 128, 255,  
      128, 255, 128, 128,  
      128, 128, 255, 128,  
      255, 128, 255, 255,  
      128, 128, 128, 128,   
    ],
    width: 1,
});

const objects = [];
const drawObjects = [];

/*function msphere(){
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
  mag: gl.LINEAR,
  min: gl.LINEAR,
  format: gl.RGB,
  src: [
    128, 255,128, 255,255,
    128, 128,255, 128,255,
    128, 100,100, 100,255,
    128, 255,255, 255,255,
    128, 255,128, 255,255,
    128, 100,100, 128,255,
    128, 128,128, 128,255,
    128, 128,255, 128,255,
    128, 128,128, 128,128, 
  ],
  width: 1,
});
const baseHueb=[];
for (i=0;i<bugMaxGroups;i++){
  const baseHue = rand(0, 360);
  baseHueb.push(baseHue);
}

for (let i = 0; i < numb; i++) {
  const baseHuec = rand(0, 360);
  const id = i;
  if (i === 0){
  const uniforms = {
      u_lightWorldPos: lightWorldPosition,
      u_lightColor: lightColor[light],
      u_diffuseMult: chroma.hsv((baseHuec + rand(0, 60) % 360), 0.6 , 0.8 ).gl(),
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
          translation: [0.0, 0.0, 0.0],
          ySpeed: diskSpeed[1],
          zSpeed: diskSpeed[2],
          uniforms: uniforms,
      });
  }
  if (i > 0) {
    const uniforms = {
      u_lightWorldPos: lightWorldPosition,
      u_lightColor: lightColor[light],
      u_diffuseMult: chroma.hsv((baseHueb[i%bugMaxGroups] + rand(0, 60) % 360), 0.6 , 0.8 ).gl(),
      //u_diffuseMult: chroma.random().hsv().gl(),
      u_specular: [1, 1, 1, 1],
      u_shininess: 200,
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
    const buggrp = ((i-1)%bugMaxGroups);
    var switx=rand(-1.6,1.6);
    var swity=rand(-1.0,1.0);
    var switz=(-4.9);
    if (buggrp == 1){
      switx=rand(-1.6, 1.6);
      switz =(-4.9);
      }
    if (buggrp == 2){
      switx=rand(-1.6, 1.6);
      swity =(4.9);
      switz=rand(-1.0/1.0);
      }
    if (buggrp == 3){
      var switx=rand(-1.6, 1.6);
      var switz=(-4.9);
    }
    if (buggrp == 4){
      switx=rand(-1.6, 1.6);
      switz =(4.9);
      }
    if (buggrp == 5){
      switx=rand(-1.6, 1.6);
      swity =(-4.9);
      var switz=rand(-1.0,1.0);
      }
    objects.push({
          //translation: [rand(-10, 10), rand(-10, 10), rand(-10, 10)],
          translation: [switx, swity, switz],
          ySpeed: diskSpeed[1],
          zSpeed: diskSpeed[2],
          uniforms: uniforms,
      });
    let position = [objects[i].translation[0], objects[i].translation[1]];
    let bug = {};
    bug.position = position;
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
ctx = WebGLDebugUtils.makeDebugContext(c.getContext("webgl"));
WebGLDebugUtils.init(ctx);
var interval_;

document.getElementById("lightb").onclick = function(){setLighing();};

document.getElementById("flipvert").onmousedown = function(){
  interval_ = setInterval(function(){ flipVert(); }, 500);
};
document.getElementById("flipvert").onmouseup = function(){
  clearInterval(interval_);
};
document.getElementById("fliphor").onmousedown = function(){
  interval_ = setInterval(function(){flipHor();}, 500);
};
document.getElementById("fliphor").onmouseup = function(){
  clearInterval(interval_);
};
document.getElementById("flipvertd").onmousedown = function(){
};
document.getElementById("flipvertd").onmouseup = function(){
  clearInterval(interval_);
};
document.getElementById("fliphord").onmousedown  = function(){
  interval_ = setInterval(function(){flipHord();}, 500);
};
document.getElementById("fliphord").onmouseup = function(){
  clearInterval(interval_);
};

document.getElementById("stopdisk").onclick = function(){stopDisk();};
document.getElementById("flipvert").ontouchstart = function(){flipVert();};
document.getElementById("fliphor").ontouchstart = function(){flipHor();};
document.getElementById("flipvertd").ontouchstart = function(){flipVertd();};
document.getElementById("fliphord").ontouchstart = function(){flipHord();};
Explosion(500, 300);
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
          bugscount = Math.floor((btime / bugSpeed)-bugsdeadu);
        if (btime > 60)
          bugscount += (btime -60);
        if (btime > 90)
          bugscount += (btime-85);
    }
    var now = (new Date()).getTime() * 0.001;
    var elapsedTime;
    if (then === 0.0) {
        elapsedTime = 0.0;
    } else {
        elapsedTime = now - then;
    }
    then = now;
    //eye speed 1/10 of elapsed time
    
    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //const projection = m4.ortho(-1,1,-1,1,10,-10);
    const projection = m4.perspective(degToRad(30), gl.canvas.clientWidth / gl.canvas.clientHeight, 0.5, 100);
    const eye= [0, -5, -20];
    const eyer = [0, -4, 20];
    const target = [0, 0, 0];
    const up = [0, 1, 0];
    const down = [0, -1, 0];
    const zero = [0, 0, 0];
    g_fpsTimer.update(elapsedTime);
    fpsElem.innerHTML = g_fpsTimer.averageFPS;

    m4.lookAt(eye, target, up, camera);
    if (light == 0)
      m4.lookAt(eyer, target, down, camera);
    m4.inverse(camera, view);
    m4.multiply(projection, view, viewProjection);
    
    if (r.length <= bugscount){
      r.push(objects[bugspawnu+1]);
    }
    
    r.forEach(function(obj){
      const uni = obj.uniforms;
      const world = uni.u_world;
      m4.identity(world);

      m4.rotateX(world, time*diskSpeed[0], world);
      m4.rotateY(world, time*diskSpeed[1], world);
      m4.rotateZ(world, time*diskSpeed[2], world);
      m4.translate(world, obj.translation, world);
      m4.transpose(m4.inverse(world, uni.u_worldInverseTranspose), uni.u_worldInverseTranspose);
      m4.multiply(viewProjection, uni.u_world, uni.u_worldViewProjection);
      });
    if (drawRenders.length <= bugscount){
      drawRenders.push(drawObjects[bugspawnu+1]);
      bugspawnu+=1;
    }
    twgl.drawObjectList(gl, drawRenders);

    requestAnimationFrame(render);
    c.onmousedown = handleMouseDown;
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
    const asp = c.width/c.height;
    bugsArray[i-1].position[0] = (tx/tz)/(-asp*4.9/tz);
    bugsArray[i-1].position[1] = (ty/tz)/(4.9/tz);
    bugsArray[i-1].position[2] = tz;
    if (debugverbose === true){
      console.log("bug["+bugi+"] x:"+bugsArray[i-1].position[0]+" y:"+bugsArray[i-1].position[1]+
      ".........    " +"tx,ty,tz.tw" + tx + ", " + ty + ", " + tz+" "+tw);
      //console.log("U_WORLD:" + objects[i].uniforms.u_world);
    }
  }
}

// eslint-disable-next-line strict
function findClickedBug(clicked, clickx, clicky) {
  let audioc = new Audio('common/music/click.mp3');
  bugverts();
  for (let i = 0; i < bugscount; i += 1) {
      if (bugsArray[i].position[2] < 0){
        const bugx = bugsArray[i].position[0];
        const bugy = bugsArray[i].position[1];
        const bugxd = (Math.abs(clicked[0] - bugx));
        const bugyd = (Math.abs(clicked[1] - bugy));
        if (debugverbose === true)
          console.log("bug[ "+i+"]xd, bugyd" + bugxd +", " + bugyd+"< bugsize");
        if ((bugxd <= bugSize))
          if ((bugyd <= bugSize)) {
          //if (bugsArray[i].alive == false)
            //return false;
          //bugsArray[i].alive = false;
          audioc.play();
          deathToll(i);
          console.log("bug["+i+"] killed at vector: [" + bugx + ", " + bugy + "]");
          elapsedTimep = 0.0;
          Explosion(clickx, clicky, elapsedTimep);
          }
      }
  }
}

/*handlemouse down uses canvas click event x-y coordinates
maps to origin at centre coordinates, normalizes coordinates to
a vector using float values for webgl*/
function handleMouseDown(event) {
    let clickx = event.clientX;
    let clicky = event.clientY;
    clx = -1 + 2*clickx/c.width;
    cly = -1 + 2*(c.height-clicky)/c.height;
    //vv = (Math.sqrt((clx * clx) + (cly * cly)));
    clicked = [clx , cly];
    if (debug === true){
      console.log("canvas:" + clickx + ", " + clicky);
      console.log("CLICKED:" + clicked);
    }
    findClickedBug(clicked, clickx, clicky);
}


