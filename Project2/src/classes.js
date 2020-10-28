class Note{
    constructor(beginX, beginY, targetY, time, radius, color){
        this.positionX = beginX;
        this.positionY = beginY;
        this.targetY = targetY; //Where the note should be at the time it should be played.
        this.time = time; //How long in frames the note has to get to it's target position.
        this.radius = radius;
        this.color = color;

        //Calculate distance downward moved per frame.
        this.distance = this.positionY - this.targetY;
        this.velocity = this.distance / this.time;

        //Note 'destroyer' check
        this.noteHit = false;
        //console.log("Note created");
    }

    updatePos(){ //Changes the object's position
        this.positionY -= this.velocity;
    }

    draw(canvasElement){
        //this.updatePos();
        let ctx = canvasElement.getContext("2d");
        ctx.save();
        ctx.fillSyle = this.color;
        ctx.beginPath()
        ctx.arc(this.positionX, this.positionY, this.radius, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }

    checkCollision(barHeight){ //Checks to see if note should be 'destroyed'.
        if(barHeight < this.positionY + this.radius)
        {
            this.noteHit = true;
        }
    }

    noteHit(){
        return this.noteHit;
    }
}

export{Note};