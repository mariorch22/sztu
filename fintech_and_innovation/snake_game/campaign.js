"use strict";
// Wall rectangles use board coordinates: column, row, width, height.
const stages = [
  {name:"Obstgarten", goal:3, color:"#628857", walls:[[9,3,4,2],[19,3,4,2],[9,11,4,2],[19,11,4,2]]},
  {name:"Schleusen", goal:4, color:"#5389a3", walls:[[10,0,2,9],[18,7,2,9],[25,0,2,6]]},
  {name:"Kupfermine", goal:4, color:"#bd7854", walls:[[5,3,9,1],[13,4,1,5],[19,3,9,1],[19,4,1,4],[7,12,9,1],[22,10,1,4]]},
  {name:"Schlangentempel", goal:5, color:"#9978ad", walls:[[7,3,18,1],[7,4,1,3],[24,4,1,5],[7,10,1,3],[8,12,17,1],[24,11,1,1],[12,7,7,1],[18,8,1,2]]},
  {name:"Eisfjord", goal:5, color:"#80adbf", walls:[[6,2,4,2],[10,4,3,2],[13,6,2,2],[18,9,2,2],[20,11,3,2],[23,13,4,2],[23,3,3,2],[7,12,3,2]]},
  {name:"Pilzwald", goal:5, color:"#ab6382", walls:[[5,3,3,1],[6,4,1,2],[13,9,5,1],[15,10,1,3],[21,3,5,1],[23,4,1,3],[24,12,3,1],[25,13,1,2]]},
  {name:"Neonhafen", goal:6, color:"#447a97", walls:[[3,3,10,1],[12,4,1,3],[8,10,1,4],[9,13,8,1],[18,2,1,7],[19,8,5,1],[26,4,4,1],[23,11,1,4]]},
  {name:"Vulkankrater", goal:6, color:"#97594a", walls:[[8,3,6,1],[17,3,6,1],[6,5,2,2],[24,5,2,2],[6,10,2,2],[24,10,2,2],[8,13,6,1],[17,13,6,1],[13,7,5,2]]},
];

// Each wall is an eight-pixel tile. Light and dark pixels describe its material.
const themes = [
  {floor:"#122119", grid:"#1d3023", light:"#91bb6a", dark:"#446441", motif:["...++...","..++.+..",".++.--..","..-.-++.","...++.+.","..++.-..","...--...","........"]},
  {floor:"#10212b", grid:"#1a303b", light:"#92c2c8", dark:"#365869", motif:["........",".+....+.","........","--------","++++++++","........",".-....-.","........"]},
  {floor:"#271c1b", grid:"#382827", light:"#f4ad72", dark:"#815442", motif:["...--...","..--....","..+...+.","..++..++","...++.-.","....++..","....-++.",".....-.."]},
  {floor:"#201a29", grid:"#302638", light:"#c8abd3", dark:"#674e75", motif:["........",".++++++.","..----+.","..++.-+.","..+..-+.","..+++++.","........","--------"]},
  {floor:"#112736", grid:"#1c3544", light:"#cef2ef", dark:"#5991a6", motif:["++++++..","+++..+..","++..+...","+..+....","..+...-.",".....--.","....--..","..----.."]},
  {floor:"#241927", grid:"#352539", light:"#f6cbd2", dark:"#814563", motif:["........","..++....","..++..+.","......+.","....--..",".+...--.",".....-..","--------"]},
  {floor:"#111a30", grid:"#202943", light:"#61d6d5", dark:"#334d70", motif:["...++...","...++...","...++...","...+++++","---....-","..-.++..","..-.++..","..-....."]},
  {floor:"#291918", grid:"#3c2421", light:"#ffad51", dark:"#623d38", motif:["--..+..-",".--.++..",".....+..","..++++..",".++..--.",".+....--","++...-..","....--.."]},
];
const exitCell = {x:28, y:8};
let stageIndex = 0, checkpoint = 0;

function wallAt({x,y}) {
  return stages[stageIndex].walls.some(([left,top,width,height]) =>
    x >= left && x < left + width && y >= top && y < top + height);
}

function drawStage() {
  const stage = stages[stageIndex];
  ctx.fillStyle = stage.color;
  for (const [x,y,w,h] of stage.walls) {
    for (let row=y; row<y+h; row++) {
      for (let col=x; col<x+w; col++) {
        ctx.fillStyle = stage.color;
        ctx.fillRect(col*tile+1,row*tile+1,tile-2,tile-2);
        const theme = themes[stageIndex];
        theme.motif.forEach((line, dy) => {
          for (let dx=0; dx<line.length; dx++) {
            if (line[dx] === ".") continue;
            ctx.fillStyle = line[dx] === "+" ? theme.light : theme.dark;
            ctx.fillRect(col*tile+3+dx*3, row*tile+3+dy*3, 3, 3);
          }
        });
      }
    }
  }
  const open = foodsEaten >= stage.goal;
  const x = exitCell.x*tile, y = exitCell.y*tile;
  ctx.strokeStyle = open ? "#74f4db" : "#676b69";
  ctx.lineWidth = 3;
  ctx.strokeRect(x+3,y+3,tile-6,tile-6);
  ctx.fillStyle = ctx.strokeStyle;
  if (open) {
    ctx.fillRect(x+8,y+13,13,4);
    ctx.fillRect(x+15,y+9,4,12);
  } else {
    ctx.fillRect(x+10,y+13,10,8);
    ctx.strokeRect(x+12,y+9,6,7);
  }
  el("stageName").textContent = (stageIndex+1) + "/" + stages.length + " · " + stage.name;
  el("objective").textContent = open ? "Ausgang offen →" : foodsEaten + "/" + stage.goal + " Äpfel";
}
