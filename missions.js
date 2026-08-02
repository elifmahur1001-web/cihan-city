import {distance} from "./utils.js";

export class MissionManager {
  constructor(){
    this.index=0;
    this.active=false;
    this.pointIndex=0;
    this.elapsed=0;
    this.missions=[
      {name:"İlk Teslimat",desc:"Merkez garajdan bir araç al ve limana git.",reward:800,start:{x:760,y:730},target:{x:4800,y:620},type:"car"},
      {name:"Şehir Turu",desc:"Üç kontrol noktasından geç.",reward:1400,start:{x:4800,y:620},points:[{x:850,y:1700},{x:3000,y:2950},{x:5350,y:3600}],type:"points"},
      {name:"Sıcak Takip",desc:"Aranma kazan ve polisten kurtul.",reward:2200,start:{x:5350,y:3600},type:"escape"},
      {name:"Son Buluşma",desc:"Sanayi garajına ulaş.",reward:3000,start:{x:5350,y:3600},target:{x:4050,y:2860},type:"reach"}
    ];
  }

  get current(){return this.missions[this.index]}

  get target(){
    const mission=this.current;
    if(!mission)return null;
    if(!this.active)return mission.start;
    if(mission.type==="points")return mission.points[this.pointIndex];
    return mission.target||null;
  }

  canStart(player){
    return this.current&&!this.active&&distance(player,this.current.start)<90;
  }

  start(){
    if(!this.current)return false;
    this.active=true;this.pointIndex=0;this.elapsed=0;
    return true;
  }

  update(game){
    if(!this.active||!this.current)return;
    this.elapsed++;
    const mission=this.current;
    const player=game.player;

    if(mission.type==="car"&&player.car&&distance(player,mission.target)<80)this.complete(game);
    else if(mission.type==="points"){
      const target=mission.points[this.pointIndex];
      if(distance(player,target)<80){
        this.pointIndex++;
        game.ui.say("Kontrol noktası tamamlandı");
        if(this.pointIndex>=mission.points.length)this.complete(game);
      }
    }else if(mission.type==="escape"&&this.elapsed>200&&game.wanted===0)this.complete(game);
    else if(mission.type==="reach"&&distance(player,mission.target)<80)this.complete(game);
  }

  complete(game){
    game.player.money+=this.current.reward;
    game.ui.say(`Görev tamamlandı: +₺${this.current.reward}`);
    this.index++;this.active=false;this.pointIndex=0;
    game.save();
  }

  text(){
    if(!this.current)return "Tüm ana görevler tamamlandı.";
    return this.active?`${this.current.name}: ${this.current.desc}`:`Yeni görev: ${this.current.name} başlangıç noktasına git.`;
  }
}
