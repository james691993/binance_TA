import{preferredCoin,rememberCoin}from'../../shared-state.mjs';
import{frames,buildRows}from'./chart-data.mjs';
import{api,history}from'./market.mjs';
const $=id=>document.getElementById(id),L=window.LightweightCharts;
const fmt=v=>v==null?'—':Math.abs(v)>0&&Math.abs(v)<.000001?Number(v).toPrecision(4):Number(v).toLocaleString('en-US',{maximumFractionDigits:8});
const day=t=>new Date(t*1000).toISOString().slice(0,10);
const defaultCoins=['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','LINKUSDT','AVAXUSDT','STRKUSDT','ARBUSDT','OPUSDT','TIAUSDT'];
let coins;try{coins=JSON.parse(localStorage.getItem('trend-hub-coins')||'null')}catch{}
if(!Array.isArray(coins))coins=defaultCoins;
coins=[...new Set(coins.filter(s=>typeof s==='string'&&/^[A-Z0-9]{2,20}USDT$/.test(s)))].slice(0,30);
if(!coins.length)coins=['BTCUSDT'];
let timeframe='W';try{const saved=localStorage.getItem('trend-chart-frame');if(Object.hasOwn(frames,saved))timeframe=saved}catch{}
let selected=preferredCoin(coins),loaded=null,request=0,rendering=false,rangeSync=false,crossSync=false,cache=new Map();
const charts={},series={},maConfig={sma10:{name:'SMA10',color:'#60c5f7',width:1},sma20:{name:'SMA20',color:'#e7ca6d',width:1},ema50:{name:'EMA50',color:'#f6a66e',width:3},ema100:{name:'EMA100',color:'#c9a0ff',width:3}};
let rows=[],byTime=new Map();
function makeChart(id){return L.createChart($(id),{autoSize:true,layout:{background:{type:'solid',color:'#131923'},textColor:'#8795aa',fontSize:10,attributionLogo:true},grid:{vertLines:{color:'#202938'},horzLines:{color:'#202938'}},rightPriceScale:{borderColor:'#303b4b',minimumWidth:88,scaleMargins:{top:.12,bottom:.1}},timeScale:{borderColor:'#303b4b',timeVisible:false,rightOffset:3,minBarSpacing:3},crosshair:{mode:L.CrosshairMode.Normal,vertLine:{color:'#65768c',labelBackgroundColor:'#354559'},horzLine:{color:'#65768c',labelBackgroundColor:'#354559'}},localization:{locale:'en-GB',timeFormatter:t=>typeof t==='number'?day(t):typeof t==='string'?t:`${t.year}-${String(t.month).padStart(2,'0')}-${String(t.day).padStart(2,'0')}`}})}
const priceFormat={type:'custom',formatter:fmt,minMove:.00000001};
function setup(){
  charts.price=makeChart('price-chart');charts.indicator=makeChart('macd-chart');
  series.candles=charts.price.addSeries(L.CandlestickSeries,{upColor:'#36b898',downColor:'#ed6677',borderVisible:false,wickUpColor:'#36b898',wickDownColor:'#ed6677',priceFormat});
  for(const[key,c]of Object.entries(maConfig))series[key]=charts.price.addSeries(L.LineSeries,{color:c.color,lineWidth:c.width,lastValueVisible:false,priceLineVisible:false,priceFormat,crosshairMarkerVisible:true});
  series.indicator={hist:charts.indicator.addSeries(L.HistogramSeries,{priceFormat,lastValueVisible:false,priceLineVisible:false}),macd:charts.indicator.addSeries(L.LineSeries,{color:'#67aeff',lineWidth:2,lastValueVisible:false,priceLineVisible:false,priceFormat}),signal:charts.indicator.addSeries(L.LineSeries,{color:'#efc876',lineWidth:1,lastValueVisible:false,priceLineVisible:false,priceFormat})};
  series.indicator.hist.createPriceLine({price:0,color:'#4b596b',lineWidth:1,lineStyle:L.LineStyle.Dashed,axisLabelVisible:false});
  for(const[from,to]of [['price','indicator'],['indicator','price']])charts[from].timeScale().subscribeVisibleLogicalRangeChange(range=>{if(!range||rangeSync||rendering||!rows.length)return;rangeSync=true;try{charts[to].timeScale().setVisibleLogicalRange(range)}finally{rangeSync=false}});
  charts.price.subscribeCrosshairMove(p=>moveCrosshair(p,'price'));
  charts.indicator.subscribeCrosshairMove(p=>moveCrosshair(p,'indicator'));
}
function moveCrosshair(p,from){
  if(crossSync||rendering||!rows.length||!$('loading').hidden)return;
  const row=byTime.get(p.time)||rows.at(-1);updatePrice(row);updateMacd(row);
  const to=from==='price'?'indicator':'price';crossSync=true;
  try{if(p.time&&byTime.has(p.time)){charts[to].setCrosshairPosition(to==='price'?row.close:row.macd,p.time,to==='price'?series.candles:series.indicator.macd)}else{charts[to].clearCrosshairPosition()}}finally{crossSync=false}
}
function updatePrice(row){$('price-date').textContent=day(row.time)+' UTC · '+(row.closed?'Đã đóng':'Đang chạy');$('ohlc').innerHTML=[['O',row.open],['H',row.high],['L',row.low],['C',row.close]].map(([key,value])=>`<span>${key} <b class="${row.close>=row.open?'green':'red'}">${fmt(value)}</b></span>`).join('');for(const key of Object.keys(maConfig))$('v-'+key).textContent=fmt(row[key])}
function updateMacd(row){$('macd-date').textContent=day(row.time)+' UTC';$('macd-values').innerHTML=`<span class="macd-blue">MACD <b>${fmt(row.macd)}</b></span><span class="macd-gold">Signal <b>${fmt(row.signal)}</b></span><span class="${row.hist>=0?'green':'red'}">Histogram <b>${fmt(row.hist)}</b></span>`}
function setMacd(){const s=series.indicator;s.macd.setData(rows.map(r=>({time:r.time,value:r.macd})));s.signal.setData(rows.map(r=>({time:r.time,value:r.signal})));s.hist.setData(rows.map((r,i)=>({time:r.time,value:r.hist,color:r.hist>=0?(r.hist>=(rows[i-1]?.hist??r.hist)?'#26a69a':'#94cfc0'):(r.hist<(rows[i-1]?.hist??r.hist)?'#ef5350':'#e7a3aa')})))}
function reset(){if(!rows.length)return;const range={from:Math.max(0,rows.length-frames[timeframe].bars),to:rows.length+3};charts.price.timeScale().setVisibleLogicalRange(range);charts.indicator.timeScale().setVisibleLogicalRange(range)}
function drawTimeframes(){for(const button of document.querySelectorAll('[data-timeframe]'))button.setAttribute('aria-pressed',String(button.dataset.timeframe===timeframe))}
function render(){if(!loaded||loaded.symbol!==selected||loaded.frame!==timeframe)return;rendering=true;try{
  rows=buildRows(loaded.candles,$('mode').value==='closed');
  if(rows.length<2)throw Error('Chưa đủ nến để phân tích. Thử chọn nến đang chạy hoặc một coin khác.');
  byTime=new Map(rows.map(r=>[r.time,r]));
  series.candles.setData(rows.map(r=>({time:r.time,open:r.open,high:r.high,low:r.low,close:r.close})));
  for(const key of Object.keys(maConfig))series[key].setData(rows.filter(r=>r[key]!=null).map(r=>({time:r.time,value:r[key]})));
  setMacd();reset();updatePrice(rows.at(-1));updateMacd(rows.at(-1));
  const f=frames[timeframe];
  $('title').innerHTML=selected.slice(0,-4)+' / USDT <span>'+timeframe+'</span>';
  $('subtitle').textContent=`Binance Spot · Nến ${f.unit} · Giá theo USDT`;
  $('price-heading').textContent='GIÁ · '+timeframe;
  $('macd-heading').innerHTML='MACD · '+timeframe+' <small>12 / 26 / 9 · EMA</small>';
  $('price-pane').setAttribute('aria-label','Biểu đồ nến '+f.unit);
  $('macd-pane').setAttribute('aria-label','MACD '+f.unit);
  $('price-chart').setAttribute('aria-label',`Nến ${f.unit}, SMA10, SMA20, EMA50 và EMA100`);
  $('macd-chart').setAttribute('aria-label','MACD và Histogram '+f.unit);
  $('tv').href=`https://www.tradingview.com/chart/?symbol=BINANCE%3A${selected}&interval=${f.tv}`;
  $('status').textContent=`${rows.length} nến ${f.unit} · Cập nhật ${new Date(loaded.updated).toLocaleTimeString('vi-VN')}${rows.length<100?' · Lịch sử dưới 100 nến':''}`;
  $('loading').hidden=true;
}catch(e){$('loading').textContent=e.message;$('loading').hidden=false}finally{rendering=false}}
async function load(symbol,force=false){const token=++request,frame=timeframe,key=symbol+':'+frame;selected=symbol;rememberCoin(symbol);drawWatchlist();drawTimeframes();$('loading').hidden=false;$('loading').textContent='Đang tải '+symbol+' · '+frame+'…';$('status').textContent='Đang lấy lịch sử Binance…';$('refresh').disabled=true;try{
  let result=cache.get(key);
  if(force||!result){const candles=await history(symbol,frames[frame].interval);result={symbol,frame,candles,updated:Date.now()};cache.set(key,result)}
  if(token!==request)return;loaded=result;render();
}catch(e){if(token!==request)return;$('loading').textContent='Không tải được dữ liệu: '+e.message+'. Bấm Cập nhật để thử lại.';$('status').textContent='Kết nối Binance chưa thành công.'}finally{if(token===request)$('refresh').disabled=false}}
function save(){try{localStorage.setItem('trend-hub-coins',JSON.stringify(coins))}catch{$('watch-error').textContent='Không lưu được danh sách trong trình duyệt này.'}}
function drawWatchlist(){$('count').textContent=coins.length;$('watchlist').innerHTML=coins.map(s=>`<div class="watch-item ${s===selected?'selected':''}"><button class="watch-select" data-select="${s}" aria-label="Xem ${s}"><b>${s.slice(0,-4)}</b><small>USDT</small></button><button class="watch-remove" data-remove="${s}" aria-label="Xóa ${s}">×</button></div>`).join('')}
$('watchlist').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.select)load(b.dataset.select);if(b.dataset.remove){if(coins.length===1){$('watch-error').textContent='Giữ ít nhất một coin trong danh sách.';return}coins=coins.filter(s=>s!==b.dataset.remove);save();drawWatchlist();if(selected===b.dataset.remove)load(coins[0])}};
$('add').onsubmit=async e=>{e.preventDefault();$('watch-error').textContent='';let s=$('symbol-input').value.trim().toUpperCase();if(!s.endsWith('USDT'))s+='USDT';if(!/^[A-Z0-9]{2,20}USDT$/.test(s)){ $('watch-error').textContent='Mã coin không hợp lệ.';return}if(coins.includes(s)){load(s);return}if(coins.length>=30){$('watch-error').textContent='Danh sách tối đa 30 coin.';return}const button=e.target.querySelector('button');button.disabled=true;try{const info=await api('exchangeInfo?symbol='+s);if(info.symbols?.[0]?.status!=='TRADING')throw Error('Cặp này chưa giao dịch.');if(!coins.includes(s))coins.push(s);save();$('symbol-input').value='';load(s)}catch(error){$('watch-error').textContent=error.message}finally{button.disabled=false}};
$('timeframes').onclick=e=>{const button=e.target.closest('[data-timeframe]');if(!button||button.dataset.timeframe===timeframe)return;timeframe=button.dataset.timeframe;try{localStorage.setItem('trend-chart-frame',timeframe)}catch{}load(selected)};
$('refresh').onclick=()=>load(selected,true);$('mode').onchange=render;$('reset').onclick=reset;
for(const input of document.querySelectorAll('[data-ma]'))input.onchange=()=>series[input.dataset.ma]?.applyOptions({visible:input.checked});
if(!L){$('loading').textContent='Không tải được thư viện biểu đồ. Hãy mở bằng file .command trong thư mục dự án.'}else{setup();load(selected)}
