import {CONFIG} from "./config.js";
import {clamp,random,angleTo,distance} from "./utils.js";

export class Player {
  constructor(){
    this.x=720;this.y=720;this.angle=0;
    this.health=100;this.armor=0;this.money=1200;this.ammo=45;
    this.car=null;
  }

  update(keys){
    if(this.car){
      this.x=this.car.x;this.y=this.car.y;this.angle=this.car.angle;
      return;
    }

    const dx=(keys.right?1:0)-(keys.left?1:0);
    const dy=(keys.down?1:0)-(keys.up?1:0);

    if(dx||dy){
      const length=Math.hypot(dx,dy);
      const speed=keys.run?CONFIG.PLAYER_RUN_SPEED:CONFIG.PLAYER_SPEED;
      this.x+=dx/length*speed;
      this.y+=dy/length*speed;
      this.angle=Math.atan2(dy,dx);
    }

    this.x=clamp(this.x,15,CONFIG.WORLD_WIDTH-15);
    this.y=clamp(this.y,15,CONFIG.WORLD_HEIGHT-15);
  }

  draw(ctx){
    if(this.car)return;
    ctx.save();
    ctx.translate(this.x,this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle="#1b2948";
    ctx.fillRect(-9,2,18,25);
    ctx.fillStyle="#e4b78e";
    ctx.beginPath();ctx.arc(0,-6,10,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#252a32";
    ctx.fillRect(6,-2,18,4);
    ctx.restore();
  }
}

export class Car {
  constructor(id,x,y,color,model,owned=false,ai=false){
    this.id=id;this.x=x;this.y=y;this.angle=random(0,Math.PI*2);
    this.speed=0;this.color=color;this.model=model;this.owned=owned;
    this.ai=ai;this.nitro=100;this.health=100;
  }

  update(keys,active){
    if(active){
      if(keys.up)this.speed+=0.19;
      if(keys.down)this.speed-=0.15;

      const boosting=keys.run&&this.nitro>0;
      const maxSpeed=boosting?CONFIG.CAR_NITRO_SPEED:CONFIG.CAR_MAX_SPEED;
      if(boosting)this.nitro=Math.max(0,this.nitro-0.55);
      else this.nitro=Math.min(100,this.nitro+0.07);

      this.speed=clamp(this.speed,-3.3,maxSpeed);
      this.speed*=0.986;

      const steer=0.037*(Math.abs(this.speed)/CONFIG.CAR_MAX_SPEED+0.22);
      if(keys.left)this.angle-=steer*Math.sign(this.speed||1);
      if(keys.right)this.angle+=steer*Math.sign(this.speed||1);
    }else if(this.ai){
      this.speed=2.3;
      if(this.x<50||this.x>CONFIG.WORLD_WIDTH-50||this.y<50||this.y>CONFIG.WORLD_HEIGHT-50)this.angle+=Math.PI;
    }else{
      this.speed*=0.96;
    }

    this.x=clamp(this.x+Math.cos(this.angle)*this.speed,20,CONFIG.WORLD_WIDTH-20);
    this.y=clamp(this.y+Math.
  }
}
