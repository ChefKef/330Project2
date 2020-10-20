/*
	main.js is primarily responsible for hooking up the UI to the rest of the application 
	and setting up the main event loop
*/

// We will write the functions in this file in the traditional ES5 way
// In this instance, we feel the code is more readable if written this way
// If you want to re-write these as ES6 arrow functions, to be consistent with the other files, go ahead!

import * as utils from './utils.js';
import * as audio from './audio.js';
import * as canvas from './canvas.js';
let drawParams = {
  showGradient: true,
  showBars: true,
  showCircles: true,
  showNoise: false,
  invertColors: false,
  showEmboss: false,
  numBars: 12,
  activeNote: 0
};

// 1 - here we are faking an enumeration
const DEFAULTS = Object.freeze({
	sound1  :  "media/C.mp3"
});

function init(){
  audio.setupWebaudio(DEFAULTS.sound1);
	let canvasElement = document.querySelector("canvas"); // hookup <canvas> element
  setupUI(canvasElement);
  setupPiano();
  canvas.setupCanvas(canvasElement, audio.analyserNode);
  loop();
}

function setupUI(canvasElement){
  // A - hookup fullscreen button
  const fsButton = document.querySelector("#fsButton");
	
  // add .onclick event to button
  fsButton.onclick = e => {
    console.log("init called");
    utils.goFullscreen(canvasElement);
  };

  /*
  let playButton = document.querySelector("#playButton");
  playButton.onclick = e => {
    if(audio.audioCtx.state == "suspended") {
      audio.audioCtx.resume();
    }
    if(e.target.dataset.playing == "no"){
      audio.playCurrentSound();
      e.target.dataset.playing = "yes";
    }
    else{
      audio.pauseCurrentSound();
      e.target.dataset.playing = "no";
    }
  };

  
  //C - hookup volume slider & label
  let volumeSlider = document.querySelector("#volumeSlider");
  let volumeLabel = document.querySelector("#volumeLabel");

  //add .oninput event to slider
  volumeSlider.oninput = e => {
    //set the gain
    audio.setVolume(e.target.value);
    //update value of label to match value of slider
    volumeLabel.innerHTML = Math.round(e.target.value/2 * 100);
  };

  //set value of label to match initial value of slider
  volumeSlider.dispatchEvent(new Event("input"));
  

  //D - hookup track <select>
  let trackSelect = document.querySelector("#trackSelect");
  //add .onchange event to <select>
  trackSelect.onchange = e => {
    audio.loadSoundFile(e.target.value);
    //pause the current track if it is playing
    if(playButton.dataset.playing = "yes"){
      playButton.dispatchEvent(new MouseEvent("click"));
    }
  };*/

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

} // end setupUI

function setupPiano(){
  window.addEventListener("keydown", function (event) {
    if (event.defaultPrevented) {
      return; // Do nothing if the event was already processed
    }
    console.log(event.key);
    switch (event.key) { //Hook keys up to piano keys.
      case "1":
        audio.loadSoundFile("media/C.mp3");
        drawParams.activeNote = 0;
        break;
      case "2":
        audio.loadSoundFile("media/CSharp.mp3");
        drawParams.activeNote = 1;
        break;
      case "3":
        audio.loadSoundFile("media/D.mp3");
        drawParams.activeNote = 2;
        break;
      case "4":
        audio.loadSoundFile("media/DSharp.mp3");
        drawParams.activeNote = 3;
        break;
      case "5":
        audio.loadSoundFile("media/E.mp3");
        drawParams.activeNote = 4;
        break;
      case "6":
        audio.loadSoundFile("media/F.mp3");
        drawParams.activeNote = 5;
        break;
      case "7":
        audio.loadSoundFile("media/FSharp.mp3");
        drawParams.activeNote = 6;
        break;
      case "8":
        audio.loadSoundFile("media/G.mp3");
        drawParams.activeNote = 7;
        break;
      case "9":
        audio.loadSoundFile("media/GSharp.mp3");
        drawParams.activeNote = 8;
        break;
      case "0":
        audio.loadSoundFile("media/A.mp3");
        drawParams.activeNote = 9;
        break;
      case "-":
        audio.loadSoundFile("media/ASharp.mp3");
        drawParams.activeNote = 10;
        break;
      case "=":
        audio.loadSoundFile("media/B.mp3");
        drawParams.activeNote = 11;
        break;
      default:
        return; // Quit when this doesn't handle the key event.
    }
    audio.playCurrentSound();
    // Cancel the default action to avoid it being handled twice
    event.preventDefault();
  }, true);
}

function loop(){
  /* NOTE: This is temporary testing code that we will delete in Part II */
    requestAnimationFrame(loop);
    canvas.draw(drawParams);
    // 1) create a byte array (values of 0-255) to hold the audio data
    // normally, we do this once when the program starts up, NOT every frame
    let audioData = new Uint8Array(audio.analyserNode.fftSize/2);
    
    // 2) populate the array of audio data *by reference* (i.e. by its address)
    audio.analyserNode.getByteFrequencyData(audioData);
    
    // 3) log out the array and the average loudness (amplitude) of all of the frequency bins
      //console.log(audioData);
      
      //console.log("-----Audio Stats-----");
      let totalLoudness =  audioData.reduce((total,num) => total + num);
      let averageLoudness =  totalLoudness/(audio.analyserNode.fftSize/2);
      let minLoudness =  Math.min(...audioData); // ooh - the ES6 spread operator is handy!
      let maxLoudness =  Math.max(...audioData); // ditto!
      // Now look at loudness in a specific bin
      // 22050 kHz divided by 128 bins = 172.23 kHz per bin
      // the 12th element in array represents loudness at 2.067 kHz
      let loudnessAt2K = audioData[11]; 
      // console.log(`averageLoudness = ${averageLoudness}`);
      // console.log(`minLoudness = ${minLoudness}`);
      // console.log(`maxLoudness = ${maxLoudness}`);
      // console.log(`loudnessAt2K = ${loudnessAt2K}`);
      // console.log("---------------------");
  }

export {init};