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
    this.y=clamp(this.y+Math.sin(this.angle)*this.speed,20,CONFIG.WORLD_HEIGHT-20);
  }

  draw(ctx){
    ctx.save();
    ctx.translate(this.x,this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle="rgba(0,0,0,.28)";
    ctx.fillRect(-25,-10,58,30);
    ctx.fillStyle=this.color;
    ctx.fillRect(-29,-15,58,30);
    ctx.fillStyle="#a7d4e7";
    ctx.fillRect(-8,-12,23,24);
    ctx.fillStyle="#111";
    [-21,12].forEach(x=>{
      ctx.fillRect(x,-19,13,6);
      ctx.fillRect(x,13,13,6);
    });
    ctx.restore();
  }
}

export class NPC {
  constructor(x,y,police=false){
    this.x=x;this.y=y;this.angle=random(0,Math.PI*2);
    this.police=police;this.health=police?90:50;
    this.speed=random(0.35,0.85);this.cooldown=0;
  }

  update(player,bullets){
    if(this.police){
      this.angle=angleTo(this,player);
      this.x+=Math.cos(this.angle)*1.3;
      this.y+=Math.sin(this.angle)*1.3;
      this.cooldown--;

      if(distance(this,player)<230&&this.cooldown<=0){
        bullets.push(new Bullet(this.x,this.y,this.angle,false));
        this.cooldown=95;
      }
    }else{
      if(Math.random()<0.008)this.angle+=random(-1.1,1.1);
      this.x+=Math.cos(this.angle)*this.speed;
      this.y+=Math.sin(this.angle)*this.speed;
    }

    this.x=clamp(this.x,15,CONFIG.WORLD_WIDTH-15);
    this.y=clamp(this.y,15,CONFIG.WORLD_HEIGHT-15);
  }

  draw(ctx){
    ctx.fillStyle=this.police?"#2451a0":"#d7ad88";
    ctx.beginPath();ctx.arc(this.x,this.y,10,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=this.police?"#163369":"#5a4c74";
    ctx.fillRect(this.x-7,this.y+7,14,18);
  }
}

export class Bullet {
  constructor(x,y,angle,fromPlayer){
    this.x=x;this.y=y;
    this.vx=Math.cos(angle)*(fromPlayer?11:7);
    this.vy=Math.sin(angle)*(fromPlayer?11:7);
    this.life=fromPlayer?80:90;
    this.fromPlayer=fromPlayer;
  }

  update(){this.x+=this.vx;this.y+=this.vy;this.life--}

  draw(ctx){
    ctx.fillStyle=this.fromPlayer?"#ffe36d":"#ff6e6e";
    ctx.beginPath();ctx.arc(this.x,this.y,3,0,Math.PI*2);ctx.fill();
  }
}
