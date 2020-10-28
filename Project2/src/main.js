import * as utils from './utils.js';
import * as audio from './audio.js';
import * as canvas from './canvas.js';
import * as classes from './classes.js';
import * as songs from './songs.js';
let drawParams = {
  showGradient: true,
  showBars: true,
  showCircles: false,
  showNoise: false,
  invertColors: false,
  showEmboss: false,
  showBezier: true,
  numBars: 12,
  activeNote: 0,
  bezierTimer: 0
};
let notes = ["media/C.mp3", "media/CSharp.mp3", "media/D.mp3", "media/DSharp.mp3", 
            "media/E.mp3", "media/F.mp3", "media/FSharp.mp3", "media/G.mp3", "media/GSharp.mp3",
            "media/A.mp3", "media/ASharp.mp3", "media/B.mp3"];
let gameParams = {
  song : songs.odeToJoyNotes(), //Array of song pitches.
  tempo: songs.odeToJoyBeats(), //Array of notes to be played
  gameTimer: 0, //Counts frames passed since song start. Used to time notes.
  prevNote: -1, //Used for bezier drawing.
  newestNote: 0, //Used to keep track of notes.
  activeNote: 0, //Used for bezier drawing.
  defaultNoteTarget: 300, //Alter lower to make notes move slower, higher to make notes faster.
  noteSize: 10, //Default note radius.
  noteColor: 'rgba(0, 0, 0, 1)', //Default note color.
  currentNotes: [], //Array of notes on screen.
  paused: true
};
let canvasElement = document.querySelector("canvas"); // hookup <canvas> element
let playButton;

const DEFAULTS = Object.freeze({
	sound1  :  "media/C.mp3"
});

function init(){
  audio.setupWebaudio(DEFAULTS.sound1);
  setupUI(canvasElement);
  setupPiano();
  canvas.setupCanvas(canvasElement, audio.analyserNode);
  setupCollapsible();
  setupGame();
  loop();
}

function setupUI(canvasElement){
  //hookup fullscreen button
  const fsButton = document.querySelector("#fsButton");
	
  // add .onclick event to button
  fsButton.onclick = e => {
    console.log("init called");
    utils.goFullscreen(canvasElement);
  };

  //Hook up play button.
  playButton = document.querySelector("#playButton");
  playButton.onclick = e => {
    if(gameParams.paused) 
    {
      document.querySelector("#playButton").textContent = "Pause";
      gameParams.paused = false;
    }
    else
    {
      document.querySelector("#playButton").textContent = "Play";
      gameParams.paused = true;
    }
  };

  //Hook up checkboxes.
  let gradientCB = document.querySelector('#gradientCB');
  gradientCB.checked = drawParams.showGradient;
  let barsCB = document.querySelector('#barsCB');
  barsCB.checked = drawParams.showBars;
  let circlesCB = document.querySelector('#circlesCB');
  circlesCB.checked = drawParams.showCircles;
  let noiseCB = document.querySelector('#noiseCB');
  noiseCB.checked = drawParams.showNoise;
  let invertCB = document.querySelector('#invertCB');
  invertCB.checked = drawParams.invertColors;
  let embossCB = document.querySelector('#embossCB');
  embossCB.checked = drawParams.showEmboss;
  let bezierCB = document.querySelector('#bezierCB');
  bezierCB.checked = drawParams.showBezier;

  //Give checkboxes events.
  gradientCB.onchange = e => {
    drawParams.showGradient = e.target.checked;
  }
  barsCB.onchange = e => {
    drawParams.showBars = e.target.checked;
  }
  circlesCB.onchange = e => {
    drawParams.showCircles = e.target.checked;
  }
  noiseCB.onchange = e => {
    drawParams.showNoise = e.target.checked;
  }
  invertCB.onchange = e => {
    drawParams.invertColors = e.target.checked;
  }
  embossCB.onchange = e => {
    drawParams.showEmboss = e.target.checked;
  }
  bezierCB.onchange = e => {
    drawParams.showEmboss = e.target.checked;
  }
}

function setupPiano(){
  window.addEventListener("keydown", function (event) {
    if (event.defaultPrevented) {
      return; // Do nothing if the event was already processed
    }
    console.log(event.key);
    switch (event.key) { //Hook keys up to piano keys.
      case "1":
        drawParams.activeNote = 0;
        audio.loadSoundFile(notes[drawParams.activeNote]);
        break;
      case "2":
        drawParams.activeNote = 1;
        audio.loadSoundFile(notes[drawParams.activeNote]);
        break;
      case "3":
        drawParams.activeNote = 2;
        audio.loadSoundFile(notes[drawParams.activeNote]);
        break;
      case "4":
        drawParams.activeNote = 3;
        audio.loadSoundFile(notes[drawParams.activeNote]);
        break;
      case "5":
        drawParams.activeNote = 4;
        audio.loadSoundFile(notes[drawParams.activeNote]);
        break;
      case "6":
        drawParams.activeNote = 5;
        audio.loadSoundFile(notes[drawParams.activeNote]);
        break;
      case "7":
        drawParams.activeNote = 6;
        audio.loadSoundFile(notes[drawParams.activeNote]);
        break;
      case "8":
        drawParams.activeNote = 7;
        audio.loadSoundFile(notes[drawParams.activeNote]);
        break;
      case "9":
        drawParams.activeNote = 8;
        audio.loadSoundFile(notes[drawParams.activeNote]);
        break;
      case "0":
        drawParams.activeNote = 9;
        audio.loadSoundFile(notes[drawParams.activeNote]);
        break;
      case "-":
        drawParams.activeNote = 10;
        audio.loadSoundFile(notes[drawParams.activeNote]);
        break;
      case "=":
        drawParams.activeNote = 11;
        audio.loadSoundFile(notes[drawParams.activeNote]);
        break;
      default:
        return; // Quit when this doesn't handle the key event.
    }
    audio.playCurrentSound();
    // Cancel the default action to avoid it being handled twice
    event.preventDefault();
  }, true);
}

function setupGame(){
  gameParams.currentNotes.push(createNote(gameParams.newestNote));
}

//Setup collapsible button at the top.
function setupCollapsible(){
  let coll = document.querySelector(".collapsible");
  coll.addEventListener("click", function() {
    this.classList.toggle("active");
    let content = this.nextElementSibling;
    if (content.style.display === "block") {
      content.style.display = "none";
    } else {
      content.style.display = "block";
    }
  });
}

function createNote(noteIndex)
{
  //It just works :^)
  return new classes.Note(5 + 62 * (gameParams.song[noteIndex] + 1) + (4 * gameParams.song[noteIndex]) - 31, -200, gameParams.defaultNoteTarget, 300, gameParams.noteSize, gameParams.noteColor);
}

function loop(){
  requestAnimationFrame(loop); //Loop game.
  canvas.draw(drawParams, gameParams.currentNotes, gameParams.song, gameParams.activeNote); //Draw, even if game is paused.
  if(gameParams.paused == false) //Do not run game if it is paused.
  {
    gameParams.gameTimer++;
    if(gameParams.gameTimer >= gameParams.tempo[gameParams.newestNote]) //Check to see if next note is due to be created.
    {
      gameParams.gameTimer = 0;
      gameParams.newestNote++;
      gameParams.currentNotes.push(createNote(gameParams.newestNote));
    }
  }  
  for(let a = 0; a < gameParams.currentNotes.length; a++)//Check through every note.
  {
    if(gameParams.paused == false) //Don't update positions if paused.
    {
      gameParams.currentNotes[a].updatePos();
    }
    gameParams.currentNotes[a].draw(canvasElement); //Draw note.
    if(gameParams.currentNotes[a].noteHit) //Check for collision. Doesn't need to be in a pause check because paused notes won't be hit early, only late.
    {
      gameParams.currentNotes.shift();
      gameParams.activeNote++;
      gameParams.prevNote++;
      drawParams.bezierTimer = 5;
      break;
    }
  }
  if(drawParams.showBezier && drawParams.bezierTimer > 0) //Draw bezier curves.
  {
    drawParams.bezierTimer--;
    canvas.drawBezier(gameParams.song[gameParams.activeNote], gameParams.song[gameParams.prevNote])
  }
}
export {init};