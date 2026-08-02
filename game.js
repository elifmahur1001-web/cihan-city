import {CONFIG} from "./config.js";
import {clamp,random,distance} from "./utils.js";
import {CityMap} from "./map.js";
import {Player,Car,NPC,Bullet} from "./entities.js";
import {MissionManager} from "./missions.js";
import {UI} from "./ui.js";

class Game {
  constructor(){
    this.canvas=document.getElementById("gameCanvas");
    this.ctx=this.canvas.getContext("2d");
    this.width=CONFIG.WORLD_WIDTH;
    this.height=CONFIG.WORLD_HEIGHT;
    this.keys={up:false,down:false,left:false,right:false,fire:false,use:false,run:false,phone:false};
    this.edge={};
    this.camera={x:0,y:0};
    this.city=new CityMap();
    this.player=new Player();
    this.missions=new MissionManager();
    this.cars=[];
    this.npcs=[];
    this.bullets=[];
    this.wanted=0;
    this.policeTimer=0;
    this.shotTimer=0;
    this.worldTime=8*60;
    this.started=false;
    this.lastTime=0;
    this.shopItems=[
      {name:"30 Mermi",price:300,action:()=>this.player.ammo+=30},
      {name:"Tam Zırh",price:700,action:()=>this.player.armor=100},
      {name:"Sağlık Paketi",price:450,action:()=>this.player.health=Math.min(100,this.player.health+50)},
      {name:"Sport Araç",price:4500,action:()=>this.buyVehicle()}
    ];
    this.populate();
    this.ui=new UI(this);
    this.bind();
    this.resize();
    window.callCar=id=>this.callCar(id);
    window.buyShopItem=index=>this.buyItem(index);
  }

  populate(){
    const colors=["#d94d4d","#318dd2","#e0b33e","#775acb","#3fa36b","#dadada","#ef7f38"];
    const models=["Sedan","SUV","Coupe","Pickup","Sport"];
    for(let i=0;i<32;i++){
      this.cars.push(new Car(i,random(200,this.width-200),random(200,this.height-200),colors[i%colors.length],models[i%models.length],i<2,i>7&&Math.random()<0.55));
    }
    for(let i=0;i<90;i++)this.npcs.push(new NPC(random(70,this.width-70),random(70,this.height-70)));
  }

  bind(){
    addEventListener("resize",()=>this.resize());

    const keyboardMap={
      ArrowUp:"up",KeyW:"up",ArrowDown:"down",KeyS:"down",
      ArrowLeft:"left",KeyA:"left",ArrowRight:"right",KeyD:"right",
      KeyF:"fire",KeyE:"use",ShiftLeft:"run",KeyP:"phone"
    };

    addEventListener("keydown",event=>{
      const key=keyboardMap[event.code];
      if(!key)return;
      this.keys[key]=true;
      if(!event.repeat)this.edge[key]=true;
      event.preventDefault();
    });

    addEventListener("keyup",event=>{
      const key=keyboardMap[event.code];
      if(key)this.keys[key]=false;
    });

    document.querySelectorAll("[data-key]").forEach(button=>{
      const key=button.dataset.key;
      const press=event=>{event.preventDefault();this.keys[key]=true;this.edge[key]=true};
      const release=event=>{event.preventDefault();this.keys[key]=false};
      button.addEventListener("touchstart",press,{passive:false});
      button.addEventListener("touchend",release,{passive:false});
      button.addEventListener("touchcancel",release,{passive:false});
      button.addEventListener("mousedown",press);
      button.addEventListener("mouseup",release);
      button.addEventListener("mouseleave",release);
    });

    document.getElementById("newGameButton").onclick=()=>this.start(true);
    document.getElementById("continueButton").onclick=()=>this.start(false);
  }

  resize(){
    const dpr=devicePixelRatio||1;
    this.screenWidth=innerWidth;
    this.screenHeight=innerHeight;
    this.canvas.width=this.screenWidth*dpr;
    this.canvas.height=this.screenHeight*dpr;
    this.ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  start(fresh){
    if(fresh)localStorage.removeItem(CONFIG.SAVE_KEY);
    else this.load();
    document.getElementById("startScreen").classList.add("hidden");
    this.started=true;
    this.lastTime=performance.now();
    requestAnimationFrame(time=>this.loop(time));
  }

  nearestCar(){
    let best=null,bestDistance=Infinity;
    this.cars.forEach(car=>{
      const d=distance(this.player,car);
      if(d<bestDistance){best=car;bestDistance=d}
    });
    return bestDistance<80?best:null;
  }

  nearLocation(location,radius=85){return distance(this.player,location)<radius}

  interact(){
    if(this.player.car){
      this.player.car.ai=false;
      this.player.car=null;
      this.player.x+=55;this.player.y+=20;
      return;
    }

    const car=this.nearestCar();
    if(car){
      this.player.car=car;car.ai=false;
      if(!car.owned){
        this.wanted=Math.max(1,this.wanted);
        this.ui.say("Araç çalındı! Polis seni arıyor.");
      }
      return;
    }

    if(this.missions.canStart(this.player)){
      this.missions.start();
      this.ui.say(`Görev başladı: ${this.missions.current.name}`);
      return;
    }

    const locations=this.city.locations;
    if(this.nearLocation(locations.shop)||this.nearLocation(locations.hospital))this.ui.showShop();
    else if(this.nearLocation(locations.garage)||this.nearLocation(locations.garage2))this.ui.showGarage();
  }

  interactionHint(){
    if(this.player.car)return "ARAÇ: araçtan in • NİTRO: hızlan";
    if(this.nearestCar())return "ARAÇ: yakındaki araca bin";
    if(this.missions.canStart(this.player))return "ARAÇ: görevi başlat";

    const locations=this.city.locations;
    if(this.nearLocation(locations.shop)||this.nearLocation(locations.hospital))return "ARAÇ: mağazayı aç";
    if(this.nearLocation(locations.garage)||this.nearLocation(locations.garage2))return "ARAÇ: garajı aç";
    return "";
  }

  shoot(time){
    if(this.player.car||this.player.ammo<=0||time-this.shotTimer<210)return;
    this.shotTimer=time;
    this.player.ammo--;
    this.wanted=Math.max(1,this.wanted);
    this.bullets.push(new Bullet(
      this.player.x+Math.cos(this.player.angle)*20,
      this.player.y+Math.sin(this.player.angle)*20,
      this.player.angle,
      true
    ));
  }

  spawnPolice(){
    for(let i=0;i<this.wanted;i++){
      this.npcs.push(new NPC(
        clamp(this.player.x+random(-420,420),20,this.width-20),
        clamp(this.player.y+random(-420,420),20,this.height-20),
        true
      ));
    }
  }

  handleCombat(){
    this.bullets.forEach(bullet=>{
      if(bullet.fromPlayer){
        this.npcs.forEach(npc=>{
          if(npc.health>0&&Math.hypot(bullet.x-npc.x,bullet.y-npc.y)<16){
            npc.health-=35;
            bullet.life=0;
            if(npc.police)this.wanted=Math.min(5,this.wanted+1);
          }
        });
      }else if(Math.hypot(bullet.x-this.player.x,bullet.y-this.player.y)<18){
        let damage=12;
        if(this.player.armor>0){
          const blocked=Math.min(damage,this.player.armor);
          this.player.armor-=blocked;damage-=blocked;
        }
        this.player.health-=damage;
        bullet.life=0;
      }
    });

    this.bullets=this.bullets.filter(bullet=>bullet.life>0);
    this.npcs=this.npcs.filter(npc=>npc.health>0);
  if (this.player.health <= 0) {
  const hospital = this.city.locations.hospital;

  this.player.health = 100;
  this.player.armor = 50;
  this.player.money = Math.max(0, this.player.money - 500);

  this.player.x = hospital.x;
  this.player.y = hospital.y;
  this.player.car = null;
  this.wanted = 0;

  // Hastanede tekrar vurulmayı engelle
  this.bullets = [];
  this.npcs = this.npcs.filter(npc => !npc.police);
  this.policeTimer = 0;

  this.ui.say("Sağlık merkezinde uyandın. ₺500 kesildi.");
}
  }

  buyVehicle(){
    const car=this.cars.find(item=>!item.owned);
    if(!car)return;
    car.owned=true;car.model="Sport";car.color="#f05a37";
    car.x=this.player.x+100;car.y=this.player.y;
  }

  buyItem(index){
    const item=this.shopItems[index];
    if(!item)return;
    if(this.player.money<item.price){
      this.ui.say("Yeterli paran yok.");
      return;
    }
    this.player.money-=item.price;
    item.action();
    this.ui.say(`${item.name} satın alındı.`);
  }

  callCar(id){
    const car=this.cars.find(item=>item.id===id&&item.owned);
    if(!car)return;
    car.x=this.player.x+90;car.y=this.player.y;car.angle=0;car.ai=false;
    this.ui.say(`${car.model} yanına getirildi.`);
    document.getElementById("listPanel").classList.add("hidden");
  }

  save(){
    const data={
      player:{x:this.player.x,y:this.player.y,money:this.player.money,ammo:this.player.ammo,armor:this.player.armor,health:this.player.health},
      wanted:this.wanted,
      mission:{index:this.missions.index,active:this.missions.active,pointIndex:this.missions.pointIndex},
      owned:this.cars.map(car=>car.owned)
    };
    localStorage.setItem(CONFIG.SAVE_KEY,JSON.stringify(data));
    this.ui.say("Oyun kaydedildi.");
  }

  load(){
    try{
      const data=JSON.parse(localStorage.getItem(CONFIG.SAVE_KEY));
      if(!data)return;
      Object.assign(this.player,data.player||{});
      this.wanted=data.wanted||0;
      if(data.mission){
        this.missions.index=data.mission.index||0;
        this.missions.active=!!data.mission.active;
        this.missions.pointIndex=data.mission.pointIndex||0;
      }
      (data.owned||[]).forEach((owned,index)=>{if(this.cars[index])this.cars[index].owned=owned});
    }catch(error){console.warn("Kayıt okunamadı",error)}
  }

  update(delta,time){
    this.worldTime=(this.worldTime+delta*0.006)%1440;

    if(this.edge.phone)this.ui.togglePhone();
    if(this.edge.use)this.interact();
    if(this.keys.fire)this.shoot(time);

    this.player.update(this.keys);
    this.cars.forEach(car=>car.update(this.keys,this.player.car===car));
    this.npcs.forEach(npc=>npc.update(this.player,this.bullets));
    this.bullets.forEach(bullet=>bullet.update());

    this.policeTimer++;
    if(this.wanted>0&&this.policeTimer>260){
      this.policeTimer=0;
      this.spawnPolice();
    }
    if(this.wanted>0&&Math.random()<0.00045)this.wanted--;

    this.handleCombat();
    this.missions.update(this);

    this.camera.x=clamp(this.player.x-this.screenWidth/2,0,Math.max(0,this.width-this.screenWidth));
    this.camera.y=clamp(this.player.y-this.screenHeight/2,0,Math.max(0,this.height-this.screenHeight));

    this.ui.update();
    this.ui.tick();
    this.edge={};
  }

  draw(time){
    const ctx=this.ctx;
    ctx.clearRect(0,0,this.screenWidth,this.screenHeight);
    ctx.save();
    ctx.translate(-this.camera.x,-this.camera.y);

    this.city.draw(ctx,time);

    const target=this.missions.target;
    if(target){
      ctx.strokeStyle="#ffe34f";
      ctx.lineWidth=6;
      ctx.beginPath();
      ctx.arc(target.x,target.y,35+Math.sin(time/160)*5,0,Math.PI*2);
      ctx.stroke();
    }

    this.cars.forEach(car=>car.draw(ctx));
    this.npcs.forEach(npc=>npc.draw(ctx));
    this.bullets.forEach(bullet=>bullet.draw(ctx));
    this.player.draw(ctx);
    ctx.restore();

    const hour=this.worldTime/60;
    const darkness=hour<6?0.48:hour<8?(8-hour)*0.24:hour>18?Math.min(0.48,(hour-18)*0.12):0;
    if(darkness>0){
      ctx.fillStyle=`rgba(7,18,40,${darkness})`;
      ctx.fillRect(0,0,this.screenWidth,this.screenHeight);
    }

    if(this.player.health<35){
      ctx.fillStyle="rgba(150,0,0,.13)";
      ctx.fillRect(0,0,this.screenWidth,this.screenHeight);
    }
  }

  loop(time){
    if(!this.started)return;
    const delta=Math.min(40,time-this.lastTime);
    this.lastTime=time;
    this.update(delta,time);
    this.draw(time);
    requestAnimationFrame(next=>this.loop(next));
  }
}

new Game();
