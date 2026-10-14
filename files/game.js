const cv=document.getElementById('c'),ctx=cv.getContext('2d');
let width,height;
function fit(){width=cv.width=innerWidth;height=cv.height=innerHeight;}
fit();addEventListener('resize',fit);

// ---- assets (filenames match the Processing sketch; missing files fall back to colored boxes) ----
const files={"Dave": "assets/dashSprite.png", "superBob": "assets/superSprite.png", "dirtBlock": "assets/dirtBlock.png", "Verity": "assets/verity.png", "space": "assets/space2.png", "falsity": "assets/angryEmoji.png", "angry": "assets/falsity.png", "obesity": "assets/obesity.png", "moggity": "assets/moggity.png"};
const fb={Dave:'#ffb000',superBob:'#e33',dirtBlock:'#ff3246',Verity:'#6cf',falsity:'#f80',angry:'#f44',obesity:'#c6c',moggity:'#9c6'};
const IMG={};
for(const k in files){const i=new Image();i.src=files[k];IMG[k]=i;}
const ok=i=>i&&i.complete&&i.naturalWidth>0;

const sfiles={"pew": "assets/laser.wav", "boom": "assets/boom.mp3", "over": "assets/retroGameOver.wav", "bg": "assets/bossFight.mp3", "wow": "assets/anime_wow.mp3"};
const SND={};for(const k in sfiles){const a=new Audio(sfiles[k]);a.preload='auto';SND[k]=a;}
let audioOn=false,master=0.5,volShow=0;
function play(k,v=1){if(!audioOn)return;try{const a=SND[k].cloneNode();a.volume=Math.min(1,v*master);a.play().catch(()=>{});}catch(e){}}
function startAudio(){if(audioOn)return;audioOn=true;try{SND.bg.loop=true;SND.bg.volume=master;SND.bg.play().catch(()=>{});}catch(e){}}

function setVol(d){master=Math.round(Math.max(0,Math.min(1,master+d))*10)/10;SND.bg.volume=master;volShow=120;}
// ---- Rectangle ----
class Rect{
  constructor(x,y,w,h,hp,s,img){this.x=x;this.y=y;this.w=w;this.h=h;this.health=hp;this.speed=s||0;this.img=img;this.proj=[];}
  display(){
    const im=this.img&&IMG[this.img];
    if(ok(im))ctx.drawImage(im,this.x,this.y,this.w,this.h);
    else{ctx.fillStyle=(this.img&&fb[this.img])||'#f00';ctx.fillRect(this.x,this.y,this.w,this.h);}
  }
  collides(o){return this.x<o.x+o.w&&this.x+this.w>o.x&&this.y<o.y+o.h&&this.y+this.h>o.y;}
  shoot(img){this.proj.push(new Rect(this.x+Math.floor(this.w/2)-5,this.y,32,20,100,-30,img));}
  enemyShoot(img){this.proj.push(new Rect(this.x+Math.floor(this.w/2)-3,this.y+this.h,25,25,100,5,img));}
}

// ---- game state ----
let player,enemies=[],gameState=0,frameCount=0;
let moveUP=false,moveDown=false,moveLeft=false,moveRight=false,isShooting=false;
let lastShotTime=0,fireRate=500,maxEnemies=3,score=0,highScore=0,enemyShootSpeed=90,spawnSpeed=60,enemyDamage=10;
let overdrive=0,pointIncrease=1,overIncrease=4,countE=0,numBullets=15,numBulletDecrease=1;
let overdriveActive=false,gameOver=false,stateOfVerity='Verity',playerBulletImg=null,chosenAvatar='Verity';
try{highScore=parseInt(localStorage.getItem('highscore'))||0;}catch(e){}

const CH={Verity:{x:2/5,s:200,bullet:'obesity'},Dave:{x:3/5,s:200,bullet:'Dave'},superBob:{x:4/5,s:300,bullet:null}};

function bg(){
  ctx.fillStyle='#000';ctx.fillRect(0,0,width,height);
  if(ok(IMG.space))ctx.drawImage(IMG.space,0,0,width,height);
}
const txt=(s,c)=>{ctx.font=s+'px sans-serif';ctx.textAlign='center';if(c)ctx.fillStyle=c;};
function bar(x,y,w,h){ctx.fillStyle='#323232';ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.fillRect(x,y,w,h);ctx.strokeRect(x,y,w,h);}

function characterSelect(){
  bg();txt(48,'#fff305');
  ctx.fillText('CHOOSE YOUR PLAYER',width/2,100);
  for(const k in CH){const c=CH[k];const cx=c.x*width;
    const im=IMG[k];
    if(ok(im))ctx.drawImage(im,cx-c.s/2,height/2-c.s/2,c.s,c.s);
    else{ctx.fillStyle=fb[k];ctx.fillRect(cx-c.s/2,height/2-c.s/2,c.s,c.s);}
  }
}

function startGame(){
  enemies=[];
  const pw=Math.floor(width*0.07);
  player=new Rect(Math.floor(width/2),height-200,pw,pw,100,0,chosenAvatar);
  score=0;overdrive=0;gameOver=false;
  moveUP=moveDown=moveLeft=moveRight=isShooting=false;
  stateOfVerity='Verity';lastShotTime=0;fireRate=500;maxEnemies=3;
  enemyShootSpeed=90;spawnSpeed=60;enemyDamage=10;pointIncrease=1;overIncrease=4;
  countE=0;overdriveActive=false;numBullets=15;numBulletDecrease=1;
  gameState=1;
}

function pick(e){
  startAudio();
  if(gameState!==0)return;
  const mx=e.clientX,my=e.clientY;
  chosenAvatar='Verity';playerBulletImg='obesity'; // clicking empty space = Verity, as in the original
  for(const k in CH){const c=CH[k],cx=c.x*width,h=c.s/2;
    if(mx<cx+h&&mx>cx-h&&my<height/2+h&&my>height/2-h){chosenAvatar=k;playerBulletImg=c.bullet;break;}
  }
  startGame();
}
cv.addEventListener('pointerdown',pick);

function levelUp(){
  if(score==10){maxEnemies+=2;spawnSpeed=50;enemyDamage+=2;}
  if(score==20){maxEnemies+=3;enemyDamage+=3;enemyShootSpeed=60;}
  if(score==30){maxEnemies+=2;spawnSpeed=40;enemyDamage+=5;stateOfVerity='angry';}
  if(score==40){maxEnemies+=2;spawnSpeed=30;enemyDamage+=10;}
  if(score==50){maxEnemies+=1;spawnSpeed=10;enemyShootSpeed=30;}
  if(score==60){enemyDamage+=20;stateOfVerity='falsity';}
  if(score==67){enemyDamage=67;enemyShootSpeed=25;}
  if(score>=130&&score<160)stateOfVerity='moggity';
  if(score>160)stateOfVerity='obesity';
  if(score>170){if(score%2==0)stateOfVerity='moggity';if(score%2==1)stateOfVerity='obesity';}
}

function gameControls(){
  if(gameOver)return;
  const sp=7;
  if(moveRight&&player.x<width-175)player.x+=sp;
  if(moveLeft&&player.x>125)player.x-=sp;
  if(moveUP&&player.y+player.w>height-175)player.y-=sp;
  if(moveDown&&player.y+player.h<height-80)player.y+=sp;
  if(isShooting&&performance.now()-lastShotTime>fireRate){
    player.shoot(playerBulletImg);play('pew',0.5);lastShotTime=performance.now();
  }
}

function genEnemies(){
  const x=Math.floor(Math.random()*(width-1))+1,sz=Math.floor(width*0.06);
  enemies.push(new Rect(x,150,sz,sz,100,Math.random()<0.5?-3:3,stateOfVerity));
}

function overdriveMode(){
  if(frameCount%60==0)overdrive-=10;
  numBulletDecrease=0;enemyDamage=2;pointIncrease=2;enemyShootSpeed=120;spawnSpeed=30;overIncrease=0;fireRate=100;
  if(overdrive<=0){
    if(score>=20&&score<30){enemyDamage=15;enemyShootSpeed=60;spawnSpeed=60;}
    if(score>=30&&score<40){spawnSpeed=40;enemyShootSpeed=60;enemyDamage=20;stateOfVerity='angry';}
    if(score>=40&&score<50){enemyDamage=30;spawnSpeed=30;enemyShootSpeed=30;}
    if(score>=50&&score<60){enemyDamage=12;spawnSpeed=10;enemyShootSpeed=30;}
    if(score>=60&&score<70){enemyDamage=15;spawnSpeed=25;enemyShootSpeed=30;stateOfVerity='falsity';}
    if(score==67){enemyDamage=67;enemyShootSpeed=25;spawnSpeed=10;}
    if(score>=70&&score<100){enemyDamage=25;enemyShootSpeed=25;spawnSpeed=10;stateOfVerity='moggity';}
    if(score>=100){enemyDamage=50;enemyShootSpeed=25;spawnSpeed=5;stateOfVerity='obesity';}
    overdrive=0;overdriveActive=false;pointIncrease=1;overIncrease=4;player.health=100;fireRate=250;numBulletDecrease=1;
  }
}

function mainGame(){
  bg();
  txt(42,'#fff');
  ctx.fillText('Score: '+score,75,50);
  ctx.fillText('High Score: '+highScore,width/2,50);
  ctx.fillText('Bullets left: '+(overdriveActive?'\u221E':numBullets),width/2,100);
  ctx.fillText('HEALTH',width/4-175,height-30);
  ctx.fillText(overdrive,width*3/4+138,height-30);

  const bw=200,bh=30;
  bar(width*3/4-100,height-55,bw,bh);
  ctx.fillStyle=(overdrive==100&&!overdriveActive)?(frameCount%20<10?'#fff305':'#ffaa00'):overdriveActive?'#f00':'#00beff';
  ctx.fillRect(width*3/4-2-bw/2+4.5,height-53,Math.max(0,overdrive/100*bw-4),bh-2);
  bar(width/4-bw/2,height-55,bw,bh);
  ctx.fillStyle='#90ee90';
  ctx.fillRect(width/4+2-bw/2,height-52.5,Math.max(0,player.health/100*bw-4),bh-4);

  gameControls();
  if(numBullets<=0)gameOver=true;

  for(let i=0;i<player.proj.length;i++){
    const b=player.proj[i];b.y+=b.speed;b.display();
    if(b.y<-50){player.proj.splice(i,1);numBullets-=numBulletDecrease;i--;continue;}
    for(let x=0;x<enemies.length;x++){
      if(b.collides(enemies[x])){
        play('boom');enemies.splice(x,1);player.proj.splice(i,1);
        score+=pointIncrease;
        if(overdrive<100)overdrive+=overIncrease;
        if(!overdriveActive){if(score>highScore)highScore=score;levelUp();}
        i--;break;
      }
    }
  }

  for(let i=0;i<enemies.length;i++){
    const e=enemies[i];e.x+=e.speed;e.display();
    if(frameCount%enemyShootSpeed==0)e.enemyShoot('dirtBlock');
    for(let z=0;z<e.proj.length;z++){
      const ez=e.proj[z];ez.y+=ez.speed;ez.display();
      if(ez.y>height+50){e.proj.splice(z,1);z--;continue;}
      if(ez.collides(player)){
        player.health-=enemyDamage;e.proj.splice(z,1);z--;
        if(player.health<=0){player.health=0;gameOver=true;}
      }
    }
    if(e.x+e.w>width-50||e.x<50){
      e.speed=-e.speed;
      e.x=e.x<50?50:width-e.w-50;
    }
    for(let j=i+1;j<enemies.length;j++){
      const e2=enemies[j];
      if(e.collides(e2)){
        e.speed*=-1;e2.speed*=-1;
        if(e.x<e2.x){e.x-=2;e2.x+=2;}else{e.x+=2;e2.x-=2;}
      }
    }
  }

  player.display();
  if(frameCount%spawnSpeed==0&&enemies.length<maxEnemies)genEnemies();

  if(overdrive==100&&!overdriveActive){txt(32,'#fff305');ctx.fillText('Press G for OVERDRIVE',width/3,height-50);}
  if(overdriveActive)overdriveMode();

  if(gameOver){
    if(countE==0)play('over');
    player.health=0;
    txt(64,'#f00');ctx.fillText('GAME OVER',width/2,height/2);
    try{localStorage.setItem('highscore',String(highScore));}catch(e){}
    countE++;
    if(countE>5)gameState=2;
  }
}

function gameOverScreen(){
  txt(64,'#f00');ctx.fillText('GAME OVER',width/2,height/2);
  txt(32,'#fff');ctx.fillText('R = play again',width/2,height/2+60);
}

// ---- input ----
const isShoot=e=>e.key==='Enter'||e.key===' '||e.key==='f'||e.key==='F';
addEventListener('keydown',e=>{
  startAudio();
  if(e.key==='-'||e.key==='_')setVol(-0.1);
  if(e.key==='+'||e.key==='=')setVol(0.1);
  if([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault();
  const k=e.key;
  if((k==='g'||k==='G')&&overdrive==100&&gameState==1&&!overdriveActive){overdriveActive=true;play('wow');}
  if(k==='d'||k==='D'||k==='ArrowRight')moveRight=true;
  if(k==='s'||k==='S'||k==='ArrowDown')moveDown=true;
  if(k==='w'||k==='W'||k==='ArrowUp')moveUP=true;
  if(k==='a'||k==='A'||k==='ArrowLeft')moveLeft=true;
  if(isShoot(e))isShooting=true;
  if(gameState==2&&(k==='r'||k==='R'))gameState=0;
});
addEventListener('keyup',e=>{
  const k=e.key;
  if(k==='d'||k==='D'||k==='ArrowRight')moveRight=false;
  if(k==='s'||k==='S'||k==='ArrowDown')moveDown=false;
  if(k==='w'||k==='W'||k==='ArrowUp')moveUP=false;
  if(k==='a'||k==='A'||k==='ArrowLeft')moveLeft=false;
  if(isShoot(e))isShooting=false;
});

// ---- fixed 60 fps loop so speeds match Processing ----
let acc=0,last=performance.now();
function loop(t){
  acc+=Math.min(t-last,100);last=t;
  while(acc>=1000/60){
    acc-=1000/60;frameCount++;
    if(gameState==0)characterSelect();else if(gameState==1)mainGame();else gameOverScreen();
    if(volShow>0){volShow--;ctx.fillStyle='#000';ctx.fillRect(width-270,15,250,45);txt(28,'#fff');ctx.textAlign='right';ctx.fillText('Volume: '+Math.round(master*100)+'%',width-30,48);if(volShow==0&&gameState==2){bg();gameOverScreen();}}
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
