import{ema,sma,macd,selectedIndex}from'./indicators.mjs';
export const frames={D1:{interval:'1d',name:'Ngày',unit:'ngày',tv:'D',bars:180},W:{interval:'1w',name:'Tuần',unit:'tuần',tv:'W',bars:104},MN:{interval:'1M',name:'Tháng',unit:'tháng',tv:'M',bars:60}};
export const maPeriods={sma10:10,sma20:20,ema50:50,ema100:100};
export function buildRows(candles,closed,now=Date.now()){
  const closes=candles.map(c=>Number(c[4])),values=macd(closes),ma={};
  for(const[key,length]of Object.entries(maPeriods))ma[key]=(key.startsWith('sma')?sma:ema)(closes,length);
  const end=selectedIndex(candles,closed,now);
  return candles.slice(0,end+1).map((c,i)=>({time:Math.floor(c[0]/1000),open:Number(c[1]),high:Number(c[2]),low:Number(c[3]),close:Number(c[4]),closed:c[6]<now,...values[i],...Object.fromEntries(Object.entries(ma).map(([key,v])=>[key,v[i]]))}));
}
