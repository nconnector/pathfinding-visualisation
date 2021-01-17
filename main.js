let GRIDSIZE = 41 //odd only
let DELAY = 40/GRIDSIZE // change these to variables as they are no longer constant
let TILESIZE = `calc(${60/GRIDSIZE}vmin + 1px)`

let gridPopulated = false;
let timeouts = [];
let totalDelay = 0

let out = document.getElementById('output');
out.textContent="Welcome to pathfinder";

let html = document.documentElement
let grid = document.getElementById('the-grid');
let gridContainer = document.getElementById('column-container');
let gridItems = null

let selectedTileCoords = null


// resize grid
function gridResize(newSize) {
  gridPopulated = false
  GRIDSIZE = newSize
  DELAY = 40/GRIDSIZE
  TILESIZE = `calc(${60/GRIDSIZE}vmin + 1px)`
  while (grid.firstChild) {grid.removeChild(grid.lastChild)}
  clearTimeouts()
  populate()
}


// create new tile
function addNewTile(element, delay, x, y) {
  timeouts.push(setTimeout(function() {
    let newTile = document.createElement("div")
    newTile.className = "default"
    newTile.setAttribute('data-x', x)
    newTile.setAttribute('data-y', y)
    newTile.setAttribute('data-tile', true)
    newTile.setAttribute('dragable', true)
    element.appendChild(newTile);
  }, delay))
}

// populate initial grid
function populate() {
  gridItems = []
  grid.style.backgroundColor = null
  let gridStyle = `repeat(${GRIDSIZE}, ${TILESIZE})`
  grid.style.gridTemplateRows = gridStyle
  grid.style.gridTemplateColumns = gridStyle
  gridContainer.style.maxWidth = `calc(60vmin + 40px + ${GRIDSIZE-1}px)`

  // optimised population row by row
  // todo: load 2 rows per fragment for very large maps
  for (y=0; y<GRIDSIZE; y++) {
    let fragment = document.createDocumentFragment()
    totalDelay += DELAY*GRIDSIZE/2
    for (x=0; x<GRIDSIZE; x++) {
      addNewTile(fragment, totalDelay, x=x, y=y)
    }
    timeouts.push(setTimeout(function() {
      grid.appendChild(fragment)}, totalDelay
    ))
  }
  
  timeouts.push(setTimeout(function() {
    gridPopulated = true
    // set listeners for clicks on the Grid, passing X,Y of clicked tiles
    html.addEventListener('mouseover', event => {
      if (event.target.getAttribute('data-tile')) {
        let x = event.target.getAttribute('data-x')
        let y = event.target.getAttribute('data-y')
        out.textContent = `x:${x}, y:${y}`
        selectedTileCoords = [x,y]
      }})
    html.addEventListener('mouseup', event => {
      if (event.target.getAttribute('data-tile')) {
        console.log('mouseUp')
        let x = event.target.getAttribute('data-x')
        let y = event.target.getAttribute('data-y')
        out.textContent = `moved from ${selectedTileCoords} to ${x},${y}`
        selectedTileCoords = null
      } else {
        out.textContent = ""
        selectedTileCoords = null
      }})

  }, totalDelay))
  gridItems = grid.children
};


// set tile class from the list of items using x^2 grid coordinates
function tileSetClass(x, y, newClass="selected", label="") {
  tileID = x + y * GRIDSIZE
  gridItems[tileID].className = newClass
  gridItems[tileID].textContent = label
}

// get randome tile coodrinate (x or y separately)
function tileRandom() {
  return Math.floor(Math.random() * GRIDSIZE)
}

// make a step (color [x,y] tile, write out message)
function step(x, y, msg=null, newClass="selected", delay, label=null) {
  timeouts.push(setTimeout(function() {
    tileSetClass(x, y, newClass, label)
    if (msg) {out.textContent = msg}
  }, delay))
}

//clear grid function
function clearGrid(){
  for (x=0; x<GRIDSIZE; x++) {
    for (y=0; y<GRIDSIZE; y++) {
      tileSetClass(x,y,"default","")
}}}
function clearTimeouts() {
  for (var i=0; i<timeouts.length; i++) {
    clearTimeout(timeouts[i])
  }
  totalDelay = 0
}
function clearAll() {
  let timeStart = 'now'
  clearTimeouts()
  clearGrid()
  //totalDelay += 'now'-timeStart
}



// TRAVERSAL ALGORITHMS


// #1 Random Traverse
// TODO: there is no stop() function for it
function algoRandom() {
  let startX = tileRandom()
  let startY = tileRandom()
  let endX = tileRandom()
  let endY = tileRandom()
  tileSetClass(startX, startY, "start")
  tileSetClass(endX, endY, "end")

  let complete = false
  let stepCount = 1
  let x = startX
  let y = startY
  let SMALLDELAY = 5
  while (complete === false) {
    if (Math.random() > 0.5) {
      if (Math.random() > 0.5) {if (x < GRIDSIZE-1) {x++}} else {if (x > 0) {x--}}
    } else {
      if (Math.random() > 0.5) {if (y < GRIDSIZE-1) {y++}} else {if (y > 0) {y--}}
    }
    totalDelay += SMALLDELAY
    if (x === endX && y === endY) {
      complete = true
      step(startX, startY, msg="complete in " + stepCount + " steps", newClass="start", delay=totalDelay) 
    } else if (!(x === startX && y === startY)) {
      step(x, y, msg="step #" + stepCount, newClass="selected", delay=totalDelay)
      stepCount++
    }
  }
}


// #2 A* algorithm
function algoAStar(mode=null, percentage=null) {
  let pathFound = false
  let SMALLDELAY = 300/GRIDSIZE
  let BIGDELAY = 1000/GRIDSIZE
  let stepCount = 0

  //map all tiles
  let tiles = []
  for (i=0; i<Math.pow(GRIDSIZE, 2); i++) {
    tiles.push({available:true, cost:Number.POSITIVE_INFINITY, parent:[NaN, NaN], x:i%GRIDSIZE, y:Math.floor(i/GRIDSIZE)})
  }

  //obstacles
  if (mode=='dots') {tiles = algoRandomDots(tiles, percentage)}
  else if (mode=='mazeBinaryTree') {tiles = algoBinaryTreeMaze(tiles)}
  else if (mode=='mazeRecursive') {tiles = algoRecursiveMaze(tiles)} 

  //generate start and end points
  let startX = tileRandom()
  let startY = tileRandom()
  while (!tiles[startX+startY*GRIDSIZE].available) {
    startX = tileRandom()
    startY = tileRandom()
  }
  let endX = tileRandom()
  let endY = tileRandom()
  while (!tiles[endX+endY*GRIDSIZE].available) {
    endX = tileRandom()
    endY = tileRandom()
  }
  step(startX, startY,"", "start", totalDelay)
  step(endX, endY, "", "end", totalDelay)
  let next = tiles[startX+startY*GRIDSIZE]

  //distance between two tiles (diagonal) 
  function distanceDiag(x1,y1,x2,y2) {
    let dX = Math.abs(x2-x1)
    let dY = Math.abs(y2-y1)
    let dMin = Math.min(dX, dY)
    let dMax = Math.max(dX, dY)
    let dTotal = dMin * 1414 + (dMax - dMin) * 1000
    return dTotal;
  }
  //distance between two tiles (manhattan)
  function distanceLinear(x1,y1,x2,y2) {
    let dX = Math.abs(x2-x1)
    let dY = Math.abs(y2-y1)
    let dTotal = dX + dY
    return dTotal;
  }

  //check availability
  function isAvailable(x,y) {
    if (x>=0 && y>=0 && x<GRIDSIZE && y<GRIDSIZE) {
      if (tiles[x + y*GRIDSIZE].available == true) {
        return true
      }
    }
    return false
  }

  //calculate neighbours' costs
  function calcNeihgbours(x, y) {
    stepCount++
    totalDelay += SMALLDELAY
    if (!(x == startX && y == startY)) {
      step(x, y, "", "selected", totalDelay)
    }
    tiles[x + y*GRIDSIZE].available = false
    
    //get neighbours
    let iX, iY, tile, costG, costH, cost
    for(coords of [[0,-1], [1,0], [0,1], [-1,0]]) {
      iX = x + coords[0]
      iY = y + coords[1]
      if (isAvailable(iX, iY)) {
        tile = tiles[iX + iY*GRIDSIZE]
        costG = distanceDiag(iX,iY,startX,startY)
        costH = distanceDiag(iX,iY,endX,endY)
        cost = costG + costH
        // path complete
        if (iX == endX && iY == endY) {
          tile.parent = [x, y]
          stepCount++
          totalDelay += SMALLDELAY
          stepCount = 0
          while (!isNaN(tile.parent[0])) {
            parentID = tile.parent[0] + tile.parent[1] * GRIDSIZE
            tile = tiles[parentID]
            totalDelay += BIGDELAY
            step(tile.x, tile.y, "", "start", totalDelay)
          }
          return true
        }
        // path incomplete
        else if (cost < tile.cost || isNaN(tile.cost)) {
          stepCount++
          totalDelay += SMALLDELAY
          step(iX, iY, "step #" + stepCount, "selected2", totalDelay) //cost here for labels
          tile.cost = cost
          tile.costH = costH
          tile.parent = [x, y]
        }
      }
    }
    return false
  }
  
  //select next cheapest tile
  let tilesAvailable = null
  while (!pathFound) {
    if (!calcNeihgbours(next.x, next.y)) {
      // filter available only
      tilesAvailable = tiles.filter(i => i.available == true)
      // return smallest cost, if multiple return smallest costH
      tilesAvailable.sort((a,b) => a.cost === b.cost ? a.costH - b.costH : a.cost - b.cost)
      next = tilesAvailable[0]
    } else {
      pathFound = true
    }
  }
}
  


// MAZE ALGORITHMS 


// 1. Random Dots
function algoRandomDots(tiles, percentage) {
  amount = Math.floor(GRIDSIZE*GRIDSIZE*percentage/100)
  for (i=0; i<amount; i++) {
    totalDelay += DELAY
    let x = tileRandom()
    let y = tileRandom()
    tiles[x + y*GRIDSIZE].available = false
    step(x, y, '', 'wall', totalDelay)
  }
  return tiles
}
  
// 2. Binary Tree Maze
// display in rows?
function algoBinaryTreeMaze(tiles){
  let DELAY = 40/GRIDSIZE
  function isAvailable(x, y, down){
    // directions are false:left true:down
    if (down) {
      if (y<GRIDSIZE-3) {return true}
      return false
    }
    else {
      if (x<GRIDSIZE-3) {return true}
      return false
    }    
  }
  // entire field as walls
  for (x=0; x<GRIDSIZE; x++) {
    for (y=0; y<GRIDSIZE; y++) {
      tiles[x+y*GRIDSIZE].available = false
      tileSetClass(x,y,"wall")
  }}
  // traverse
  for (y=1; y<GRIDSIZE-1; y+=2) {
    for (x=1; x<GRIDSIZE-1; x+=2) {
      totalDelay += DELAY
      step(x, y, "", "default", totalDelay)
      // decide whether to go down or left
      let down = Boolean(Math.round(Math.random()))
      console.log(`x=${x}, y=${y}`)
      if (!isAvailable(x,y,down)) {down = !down}
      if (isAvailable(x,y,down)) {
        //step
        totalDelay += DELAY
        if (down) {
          console.log(`${x},${y+1} is available`)
          console.log(`${x},${y+2} is available`)
          tiles[x+(y+1)*GRIDSIZE].available = true
          tiles[x+(y+2)*GRIDSIZE].available = true
          step(x, y+1, "", "default", totalDelay)
          step(x, y+2, "", "default", totalDelay)
        } else {
          console.log(`${x+1},${y} is available`)
          console.log(`${x+2},${y} is available`)
          tiles[(x+1)+y*GRIDSIZE].available = true
          tiles[(x+2)+y*GRIDSIZE].available = true
          step(x+1, y, "", "default", totalDelay)
          step(x+2, y, "", "default", totalDelay)      
        }
      } else {
        console.log('ran out')
      }
    }
  }
  return tiles
}

// 3. Recursive Division Maze
// todo: walls&doors only on odd tiles 
function algoRecursiveMaze(tiles) {
  let SMALLDELAY = 400/GRIDSIZE
  let roomSize = 3
  let rooms = [[1, GRIDSIZE-2, 1, GRIDSIZE-2]]
  let doorsX = [Array(GRIDSIZE-1).keys()]
  let doorsY = []
  let walls = [] // delete
  function randomBetween(x, y) {
    // returns random integer between x and y, inclusively
    return Math.floor(Math.random()*(y+1-x)+x)
  }
  function wall(x,y) {
    totalDelay += SMALLDELAY
    tiles[x + y*GRIDSIZE].available = false
    step(x, y, "", "wall", totalDelay)
  }
  function door(x,y) {
    totalDelay += SMALLDELAY
    tiles[x + y*GRIDSIZE].available = true
    step(x, y, "", "default", totalDelay)
  }
  // create surrounding walls
  for (x=0; x<GRIDSIZE; x++) {y = 0; wall(x, y)}
  for (y=0; y<GRIDSIZE; y++) {x = GRIDSIZE-1; wall(x, y)}
  for (x=GRIDSIZE-1; x>=0; x--) {y = GRIDSIZE-1; wall(x, y)}
  for (y=GRIDSIZE-1; y>=0; y--) {x = 0; wall(x, y)}
  // divide (true:vertically, false: horisontally)

  function split(room) {
    let x1 = room[0]
    let x2 = room[1]
    let y1 = room[2]
    let y2 = room[3]
    //if (x2-x1 > y2-y1) {
    if (x2-x1 >= y2-y1) {
      // vertical split if dX > dY
      if (x2-x1 >= roomSize && y2-y1 > 1) {
        x = randomBetween(x1+1, x2-1)
        let i=1
        while (tiles[x + (y1-1)*GRIDSIZE].available || tiles[x + (y2+1)*GRIDSIZE].available) {
            i++
            if(i>(x2-x1)*2){i=0;break;}
            x = randomBetween(x1+1, x2-1)
          }
        walls.push(x)
        if (i) {
          for (y=y1; y<=y2; y++) {
            wall(x, y)
          }
        }
        //door
        doorY = randomBetween(y1, y2)
        doorsY.push(doorY)
        door(x, doorY)
        //next split
        rooms.push([x1, x-1, y1, y2])
        rooms.push([x+1, x2, y1, y2])
      }
    } else {
      // horisontal split if dX < dY
      if (y2-y1 >= roomSize && x2-x1 > 1) {
        y = randomBetween(y1+1, y2-1)
        let i=1
        while (tiles[x1-1 + y*GRIDSIZE].available || tiles[x2+1 + y*GRIDSIZE].available) {
          i++
          if(i>(x2-x1)*2){i=0;break} 
          y = randomBetween(y1+1, y2-1)
        }
        if (i) {
          for (x=x1; x<=x2; x++) {
            wall (x, y)
          }
        }
        //door
        doorX = randomBetween(x1, x2)
        doorsX.push(doorX)
        door(doorX, y)
        //next split
        rooms.push([x1, x2, y1, y-1])
        rooms.push([x1, x2, y+1, y2])
      }
    }   
  }
  while (rooms.length > 0) {
    room = rooms.pop()
    split(room)
  }
  return tiles
}



// UI - START BUTTONS


// TODO: refactor this section
let startButtonAlgoRandom = document.getElementById("startButtonAlgoRandom")
startButtonAlgoRandom.onclick = function() {
  if (gridPopulated) {
    clearAll()
    algoRandom()
  }
}
let startButtonAlgoAStar = document.getElementById("startButtonAlgoAStar")
startButtonAlgoAStar.onclick = function() {
  if (gridPopulated) {
    clearAll()
    algoAStar()
  }
}
let startButtonAlgoAStarDots = document.getElementById("startButtonAlgoAStarDots")
startButtonAlgoAStarDots.onclick = function() {
  if (gridPopulated) {
    clearAll()
    algoAStar(mode='dots', percentage=30)
  }
}
let startButtonAlgoAStarMazeBinary = document.getElementById("startButtonAlgoAStarMazeBinary")
startButtonAlgoAStarMazeBinary.onclick = function() {
  if (gridPopulated) {
    clearAll()
    algoAStar(mode='mazeBinaryTree')
  }
}
let startButtonAlgoAStarMazeRecursive = document.getElementById("startButtonAlgoAStarMazeRecursive")
startButtonAlgoAStarMazeRecursive.onclick = function() {
  if (gridPopulated) {
    clearAll()
    algoAStar(mode='mazeRecursive')
  }
}

