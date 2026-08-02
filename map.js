import {CONFIG} from "./config.js";
import {random,intersects} from "./utils.js";

export class CityMap {
  constructor(){
    this.roads=[];
    this.buildings=[];
    this.parks=[];
    this.water=[{x:4300,y:0,w:1050,h:900}];
    this.locations={
      hospital:{x:5200,y:1300,name:"Sağlık Merkezi",color:"#e85b66"},
      shop:{x:1250,y:1200,name:"Ekipman Mağazası",color:"#8d68d5"},
      garage:{x:760,y:730,name:"Merkez Garaj",color:"#e7b444"},
      garage2:{x:4050,y:2860,name:"Sanayi Garajı",color:"#e7b444"}
    };
    this.generate();
  }

  generate(){
    [400,1100,1900,2800,3700,4700,5600].forEach(x=>this.roads.push({x,y:0,w:180,h:CONFIG.WORLD_HEIGHT,direction:"v"}));
    [350,1050,1800,2550,3300,3950].forEach(y=>this.roads.push({x:0,y,w:CONFIG.WORLD_WIDTH,h:170,direction:"h"}));

    for(let gx=35;gx<CONFIG.WORLD_WIDTH-280;gx+=350){
      for(let gy=35;gy<CONFIG.WORLD_HEIGHT-230;gy+=310){
        const block={x:gx,y:gy,w:220+random(0,80),h:170+random(0,60),type:Math.floor(random(0,5))};
        const blocked=[...this.roads,...this.water].some(item=>intersects(block,item));
        if(!blocked)(Math.random()<0.14?this.parks:this.buildings).push(block);
      }
    }
  }

  draw(ctx,time){
    ctx.fillStyle="#3f7549";
    ctx.fillRect(0,0,CONFIG.WORLD_WIDTH,CONFIG.WORLD_HEIGHT);

    this.water.forEach(area=>{
      ctx.fillStyle="#225e84";
      ctx.fillRect(area.x,area.y,area.w,area.h);
      ctx.strokeStyle="rgba(255,255,255,.15)";
      for(let y=area.y+20;y<area.y+area.h;y+=35){
        ctx.beginPath();ctx.moveTo(area.x,y);ctx.lineTo(area.x+area.w,y);ctx.stroke();
      }
    });

    this.parks.forEach(park=>{
      ctx.fillStyle="#467e3d";
      ctx.fillRect(park.x,park.y,park.w,park.h);
      for(let i=0;i<8;i++){
        ctx.fillStyle="#244d2b";
        ctx.beginPath();
        ctx.arc(park.x+(i*61)%park.w,park.y+(i*97)%park.h,12,0,Math.PI*2);
        ctx.fill();
      }
    });

    this.roads.forEach(road=>{
      ctx.fillStyle="#3a3f47";
      ctx.fillRect(road.x,road.y,road.w,road.h);
      ctx.strokeStyle="#e4cd63";
      ctx.lineWidth=4;
      ctx.setLineDash([30,24]);
      ctx.beginPath();
      if(road.direction==="h"){
        ctx.moveTo(road.x,road.y+road.h/2);
        ctx.lineTo(road.x+road.w,road.y+road.h/2);
      }else{
        ctx.moveTo(road.x+road.w/2,road.y);
        ctx.lineTo(road.x+road.w/2,road.y+road.h);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    });

    const colors=["#786c65","#667a8b","#897e68","#6f647a","#867157"];
    this.buildings.forEach(building=>{
      ctx.fillStyle="rgba(0,0,0,.28)";
      ctx.fillRect(building.x+12,building.y+12,building.w,building.h);
      ctx.fillStyle=colors[building.type];
      ctx.fillRect(building.x,building.y,building.w,building.h);
      ctx.fillStyle="rgba(255,226,150,.55)";
      for(let x=building.x+20;x<building.x+building.w-15;x+=40){
        for(let y=building.y+25;y<building.y+building.h-15;y+=35){
          ctx.fillRect(x,y,18,13);
        }
      }
    });

    Object.values(this.locations).forEach(location=>{
      ctx.fillStyle=location.color;
      ctx.beginPath();
      ctx.arc(location.x,location.y,18+Math.sin(time/220)*3,0,Math.PI*2);
      ctx.fill();
    });
  }
}
