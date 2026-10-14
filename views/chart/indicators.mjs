export function ema(values,length){const alpha=2/(length+1);let previous;return values.map(value=>previous=previous===undefined?value:alpha*value+(1-alpha)*previous)}
export function macd(values){const fast=ema(values,12),slow=ema(values,26),line=fast.map((v,i)=>v-slow[i]),signal=ema(line,9);return line.map((v,i)=>({macd:v,signal:signal[i],hist:v-signal[i]}))}
export function classify(w,m){return w.hist>0&&m.hist>0?'up':w.hist<0&&m.hist<0?'down':'mixed'}
export function selectedIndex(candles,closed,now){let i=candles.length-1;if(closed&&candles[i]?.[6]>=now)i--;return i}
export function sma(values,length){let sum=0;return values.map((value,i)=>{sum+=value;if(i>=length)sum-=values[i-length];return i+1>=length?sum/length:null})}
