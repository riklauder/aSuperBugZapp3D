/* eslint-disable nonblock-statement-body-position */
// Handles the mouse down event and stores the coordinates of the user
// Also calculates the distance from the center of the circle

let findClickedBug = function (clicked) {
  for (let i = 0; i < bugs.length; i += 1) {
    const bugxl = Math.abs(bugsArray[i].position[0]) - 0.2;
    const bugxh = Math.abs(bugsArray[i].position[0]) + 0.2;
    const bugyl = Math.abs(bugsArray[i].position[1]) - 0.2;
    const bugyh = Math.abs(bugsArray[i].position[1]) + 0.2;
    if (clicked[0] >= bugxl && clicked[0] <= bugxh) {
      if (clicked[1] >= bugyl && clicked[0] <= bugyh){
        return true;
    }
  }
  return false;
  }
}

var handleMouseDown = function (event) {
  let audio = new Audio('common/music/click.mp3');
  audio.play();
  clx = event.clientX - (c.width / 2);
  cly = (c.height - event.clientY) - (c.height / 2);
  vv = Math.sqrt((clx * clx) + (cly * cly));
  clicked = [clx / vv, cly / vv];
  findClickedBug(clicked);
 }

