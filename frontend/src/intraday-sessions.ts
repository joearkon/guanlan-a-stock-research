import type {ISeriesPrimitive,IPrimitivePaneRenderer,IPrimitivePaneView,SeriesAttachedParameter,Logical} from 'lightweight-charts';
import type {IntradaySession} from './intraday-data';

// Chart-native primitive: the time scale owns positions during pan/zoom/resize.
export class IntradaySessions implements ISeriesPrimitive {
 private attachedTo?:SeriesAttachedParameter;
 private sessions:IntradaySession[]=[];
 private color='#a1a1aa';
 private dividers:number[]=[];
 private labels:{text:string,x:number,width:number}[]=[];
 private readonly renderer:IPrimitivePaneRenderer={draw:target=>target.useMediaCoordinateSpace(({context:ctx,mediaSize})=>{
  ctx.save();ctx.strokeStyle=this.color;ctx.lineWidth=1;ctx.globalAlpha=0.45;ctx.setLineDash([3,4]);ctx.beginPath();
  for(const x of this.dividers)if(x>=0&&x<=mediaSize.width){const pixel=Math.floor(x)+0.5;ctx.moveTo(pixel,0);ctx.lineTo(pixel,mediaSize.height);}
  ctx.stroke();
  if(this.showLabels){ctx.globalAlpha=1;ctx.fillStyle=this.color;ctx.font='12px sans-serif';ctx.textAlign='center';ctx.textBaseline='top';for(const label of this.labels)if(label.x>=0&&label.x<=mediaSize.width&&label.width>=ctx.measureText(label.text).width+4)ctx.fillText(label.text,label.x,6);}
  ctx.restore();
 })};
 private readonly views:IPrimitivePaneView[]=[{zOrder:()=> 'bottom',renderer:()=>this.renderer}];
 constructor(private readonly showLabels:boolean){}
 attached(param:SeriesAttachedParameter){this.attachedTo=param;}
 detached(){this.attachedTo=undefined;this.dividers=[];this.labels=[];}
 setSessions(sessions:IntradaySession[],color:string){this.sessions=sessions.length>1?sessions:[];this.color=color;this.updateAllViews();this.attachedTo?.requestUpdate();}
 updateAllViews(){
  const scale=this.attachedTo?.chart.timeScale();if(!scale)return;
  // The installed engine accepts only integral indices despite the public Logical type.
  // Interpolate between adjacent bars to position a separator in the overnight gap.
  const x=(logical:number)=>{const floor=Math.floor(logical),a=scale.logicalToCoordinate(floor as Logical),b=scale.logicalToCoordinate((floor+1) as Logical);return a===null||b===null?null:a+(b-a)*(logical-floor);};
  this.dividers=this.sessions.slice(1).map(s=>x(s.from-0.5)).filter((v):v is NonNullable<typeof v>=>v!==null);
  this.labels=this.sessions.flatMap(s=>{const left=x(s.from-0.5),right=x(s.to+0.5);return left===null||right===null?[]:[{text:s.date.slice(5),x:(left+right)/2,width:right-left}];});
 }
 paneViews(){return this.views;}
}
