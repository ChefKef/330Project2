/*
	The purpose of this file is to take in the analyser node and a <canvas> element: 
	  - the module will create a drawing context that points at the <canvas> 
	  - it will store the reference to the analyser node
	  - in draw(), it will loop through the data in the analyser node
	  - and then draw something representative on the canvas
	  - maybe a better name for this file/module would be *visualizer.js* ?
*/

import * as utils from './utils.js';

let ctx,canvasWidth,canvasHeight,gradient,analyserNode,audioData;

function setupCanvas(canvasElement,analyserNodeRef){
	// create drawing context
	ctx = canvasElement.getContext("2d");
	canvasWidth = canvasElement.width;
	canvasHeight = canvasElement.height;
	// create a gradient that runs top to bottom
	gradient = utils.getLinearGradient(ctx,0,0,0,canvasHeight,[{percent:0,color:"blue"},{percent:1,color:"magenta"}]);
	// keep a reference to the analyser node
	analyserNode = analyserNodeRef;
	// this is the array where the analyser data will be stored
	audioData = new Uint8Array(analyserNode.fftSize/2);
}

function draw(params={}){
  // 1 - populate the audioData array with the frequency data from the analyserNode
	// notice these arrays are passed "by reference" 
	analyserNode.getByteFrequencyData(audioData);
	// OR
	//analyserNode.getByteTimeDomainData(audioData); // waveform data
	
	// 2 - draw background
    ctx.save();
    ctx.fillStyle = "black";
    ctx.globalAlpha = .1;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
	ctx.restore();
	// 3 - draw gradient
	if(params.showGradient){
        ctx.save();
        ctx.fillStyle = gradient;
        ctx.globalAlpha = .3;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.restore();
    }
	// 4 - draw bars
	if(params.showBars){
        let barSpacing = 4;
        let margin = 5;
        let screenWidthForBars = canvasWidth - (params.numBars * barSpacing) - margin * 2;
        let barWidth = screenWidthForBars / params.numBars;
        let barHeight = 300;
        let topSpacing = 120;

        /*
        //Math params
        let targetFreq = 261.63; //Frequency of middle C
        let halfStepMultiplier = Math.pow(2, 1/12); //How much you multiple C by to get the frequency of C#, C# to get D, etc. Multiply by it twice to get full steps (E to F).
        let rate = 44100.0; //Sampling rate
        let sampleRange = rate / audioData.length; //How many Hz one sample uses.
        */

        let multiplier = 1.0;

        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        for(let i = 0; i < params.numBars; i++){
            /*
            ctx.fillRect(margin + i * (barWidth + barSpacing), topSpacing + 256 - audioData[Math.floor(targetFreq / sampleRange) + 8], barWidth, barHeight);
            ctx.strokeRect(margin + i * (barWidth + barSpacing), topSpacing + 256 - audioData[Math.floor(targetFreq / sampleRange) + 8], barWidth, barHeight);
            targetFreq *= halfStepMultiplier; //Step up a half step.
            if(i == 4) //Catch the case of E to F, since there is no E sharp.
            {
                targetFreq *= halfStepMultiplier;
            }
            */
            switch(Math.abs(params.activeNote - i))
            {
                case 0:
                    multiplier = 1.25;
                    if(i > 6 || i < 2)
                    {
                        multiplier *= 2;
                    }
                    break;
                case 1:
                    multiplier = 0.5;
                    break;
                case 2:
                    multiplier = 0.1;
                    break;
                default:
                    multiplier = 0.0;
                    break;
            }
            ctx.fillRect(margin + i * (barWidth + barSpacing), topSpacing + 256 - (.6 * Math.min((audioData[40 + i * 3] * multiplier), 256)), barWidth, barHeight);
            ctx.strokeRect(margin + i * (barWidth + barSpacing), topSpacing + 256 - (.6 * Math.min((audioData[40 + i * 3] * multiplier), 256)), barWidth, barHeight);
        }
        ctx.restore();
    }
	// 5 - draw circles
	if(params.showCircles){
        let maxRadius = canvasHeight / 4;
        ctx.save();
        ctx.globalAlpha = .05;
        for(let i = 0; i < audioData.length; i++)
        {
            let percent = audioData[i] / 255;

            let circleRadius = percent * maxRadius;
            ctx.beginPath();
            ctx.fillStyle = utils.makeColor(255, 111, 111, .34 - percent / 3.0);
            ctx.arc(canvasWidth / 2, canvasHeight / 2, circleRadius, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.closePath();

            ctx.beginPath();
            ctx.fillStyle = utils.makeColor(0, 0, 255, .10 - percent / 10.0);
            ctx.arc(canvasWidth / 2, canvasHeight / 2, circleRadius * 1.5, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.closePath();

            ctx.save();
            ctx.beginPath();
            ctx.fillStyle = utils.makeColor(200, 200, 0, .5 - percent / 5.0);
            ctx.arc(canvasWidth / 2, canvasHeight / 2, circleRadius * .5, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.closePath();
            ctx.restore();
        }
        ctx.restore();
    }
    // 6 - bitmap manipulation
	// TODO: right now. we are looping though every pixel of the canvas (320,000 of them!), 
	// regardless of whether or not we are applying a pixel effect
	// At some point, refactor this code so that we are looping though the image data only if
	// it is necessary

	// A) grab all of the pixels on the canvas and put them in the `data` array
	// `imageData.data` is a `Uint8ClampedArray()` typed array that has 1.28 million elements!
	// the variable `data` below is a reference to that array 
    let imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    let data = imageData.data;
    let length = data.length;
    let width = imageData.width;
	// B) Iterate through each pixel, stepping 4 elements at a time (which is the RGBA for 1 pixel)
    for(let a = 0; a < length; a += 4)
    {
		// C) randomly change every 20th pixel to red
        if(params.showNoise && Math.random() < .05){
			// data[i] is the red channel
			// data[i+1] is the green channel
			// data[i+2] is the blue channel
			// data[i+3] is the alpha channel
			data[a] = data[a + 1] = data[a + 2] = 0;// zero out the red and green and blue channels
			data [a + 2] = 255;// make the blue channel 100% blue
        } // end if
        if(params.invertColors){
            let red = data[a], green = data[a + 1], blue = data[a + 2];
            data[a] = 255 - red;
            data[a + 1] = 255 - green;
            data[a + 2] = 255 - blue;
		} // end if
    } // end for
    //note we are stepping through *each* sub-pixel
    if(params.showEmboss){
        for(let a = 0; a < length; a++)
        {
            if(a % 4 == 3) continue;
            data[a] = 127 + 2*data[a] - data[a + 4] - data[a + width * 4];
        }
    }
    
    // D) copy image data back to canvas
    ctx.putImageData(imageData, 0, 0);
}

export {setupCanvas,draw};