export class UI {
  constructor(game){
    this.game=game;
    this.stats=document.getElementById("stats");
    this.missionText=document.getElementById("missionText");
    this.wanted=document.getElementById("wanted");
    this.clock=document.getElementById("clock");
    this.speed=document.getElementById("speed");
    this.message=document.getElementById("message");
    this.hint=document.getElementById("hint");
    this.map=document.getElementById("miniMap");
    this.mapContext=this.map.getContext("2d");
    this.messageTimer=0;
    this.bind();
  }

  bind(){
    document.querySelectorAll("[data-close]").forEach(button=>{
      button.onclick=()=>document.getElementById(button.dataset.close).classList.add("hidden");
    });

    document.getElementById("saveButton").onclick=()=>this.game.save();
    document.getElementById("helpButton").onclick=()=>document.getElementById("helpPanel").classList.remove("hidden");
    document.getElementById("missionsButton").onclick=()=>this.showMissions();
    document.getElementById("garageButton").onclick=()=>this.showGarage();
    document.getElementById("shopButton").onclick=()=>this.showShop();
  }

  say(text){
    this.message.textContent=text;
    this.message.style.opacity=1;
    this.messageTimer=150;
  }

  tick(){
    if(this.messageTimer>0){
      this.messageTimer--;
      if(this.messageTimer===0)this.message.style.opacity=0;
    }
  }

  togglePhone(){
    document.getElementById("phonePanel").classList.toggle("hidden");
  }

  showList(title,html){
    document.getElementById("listTitle").textContent=title;
    document.getElementById("listContent").innerHTML=html;
    document.getElementById("listPanel").classList.remove("hidden");
  }

  showMissions(){
    const html=this.game.missions.missions.map((mission,index)=>`
      <div class="card">
        <h3>${index<this.game.missions.index?"✓ ":""}${mission.name}</h3>
        <p>${mission.desc}</p>
        <p class="price">Ödül: ₺${mission.reward}</p>
      </div>`).join("");
    this.showList("GÖREVLER",html);
  }

  showGarage(){
    const owned=this.game.cars.filter(car=>car.owned);
    const html=owned.length?owned.map(car=>`
      <div class="card">
        <h3>${car.model}</h3>
        <p>Sağlık: ${Math.round(car.health)}%</p>
        <p>Nitro: ${Math.round(car.nitro)}%</p>
        <button onclick="window.callCar(${car.id})">Aracı Çağır</button>
      </div>`).join(""):`<div class="card"><p>Garajında araç yok.</p></div>`;
    this.showList("GARAJ",html);
  }

  showShop(){
    const items=this.game.shopItems;
    const html=items.map((item,index)=>`
      <div class="card">
        <h3>${item.name}</h3>
        <p class="price">₺${item.price}</p>
        <button onclick="window.buyShopItem(${index})">Satın Al</button>
      </div>`).join("");
    this.showList("MAĞAZA",html);
  }

  update(){
    const player=this.game.player;
    this.stats.innerHTML=`Can <b>${Math.round(player.health)}</b> • Zırh <b>${Math.round(player.armor)}</b> • Para <b>₺${player.money}</b> • Mermi <b>${player.ammo}</b>`;
    this.missionText.textContent=this.game.missions.text();
    this.wanted.textContent="★".repeat(this.game.wanted)+"☆".repeat(5-this.game.wanted);

    const hour=Math.floor(this.game.worldTime/60).toString().padStart(2,"0");
    const minute=Math.floor(this.game.worldTime%60).toString().padStart(2,"0");
    this.clock.textContent=`${hour}:${minute}`;

    this.speed.textContent=player.car?`${Math.round(Math.abs(player.car.speed)*18)} km/s\n${player.car.model}`:"";
    this.hint.textContent=this.game.interactionHint();
    this.drawMiniMap();
  }

  drawMiniMap(){
    const ctx=this.mapContext,w=this.map.width,h=this.map.height;
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle="#17321d";ctx.fillRect(0,0,w,h);
    ctx.fillStyle="#50555d";
    this.game.city.roads.forEach(road=>{
      ctx.fillRect(
        road.x/this.game.width*w,
        road.y/this.game.height*h,
        road.w/this.game.width*w,
        road.h/this.game.height*h
      );
    });

    ctx.fillStyle="#44b9ff";
    ctx.fillRect(this.game.player.x/this.game.width*w-3,this.game.player.y/this.game.height*h-3,6,6);

    const target=this.game.missions.target;
    if(target){
      ctx.fillStyle="#ffe23f";
      ctx.beginPath();
      ctx.arc(target.x/this.game.width*w,target.y/this.game.height*h,4,0,Math.PI*2);
      ctx.fill();
    }
  }
}
