import * as utils from './utils.js';

let ctx,canvasWidth,canvasHeight,gradient,analyserNode,audioData,topSpacing;

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

function draw(params={}, note = [], pitchArray = [], activeNote = 0){
	analyserNode.getByteFrequencyData(audioData);
	
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
        let multiplier = 1.0; //Used to make bars shoot up high enough.
        topSpacing = 120;
        
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        for(let i = 0; i < params.numBars; i++){
            switch(Math.abs(params.activeNote - i)) //Apply multiplier.
            {
                case 0:
                    multiplier = 1.5;
                    if(i > 5 || i < 4)
                    {
                        multiplier *= 2.5;
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
            //Draw bar.
            ctx.fillRect(margin + i * (barWidth + barSpacing), topSpacing + 256 - (.6 * Math.min((audioData[40 + i * 3] * multiplier), 256)), barWidth, barHeight);
            ctx.strokeRect(margin + i * (barWidth + barSpacing), topSpacing + 256 - (.6 * Math.min((audioData[40 + i * 3] * multiplier), 256)), barWidth, barHeight);
            //Check note collisons.
            for(let a = 0; a < note.length; a++)
            {
                if(i == pitchArray[activeNote + a])
                {
                    note[a].checkCollision(topSpacing + 256 - (.6 * Math.min((audioData[40 + i * 3] * multiplier), 256)));
                }
            }
        }
        ctx.restore();
        //Draw note line
        ctx.save();
        ctx.moveTo(0, topSpacing + 256 * 2 / 5);
        ctx.lineTo(canvasWidth, topSpacing + 256 * 2 / 5);
        ctx.stroke();
        ctx.closePath();
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

function drawBezier(nextNotePitch, currentNotePitch) //Draws 'bouncy' bezier curves.
{
    let top = utils.getRandom(-200, 200);
    let middle = 5 + 62 * (currentNotePitch + 1) + (4 * currentNotePitch) - 31 +
        (((5 + 62 * (nextNotePitch + 1) + (4 * nextNotePitch) - 31) - (5 + 62 * (currentNotePitch + 1) + (4 * currentNotePitch) - 31)) / 2);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(5 + 62 * (currentNotePitch + 1) + (4 * currentNotePitch) - 31, topSpacing + (256 * 2 / 5));
    ctx.quadraticCurveTo(middle, top, (5 + 62 * (nextNotePitch + 1) + (4 * nextNotePitch) - 31), topSpacing + (256 * 2 / 5));
    ctx.closePath();
}

export {setupCanvas,draw, drawBezier};