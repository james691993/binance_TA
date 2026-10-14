export function preferredCoin(coins){try{const value=localStorage.getItem('trend-hub-symbol');return coins.includes(value)?value:coins[0]}catch{return coins[0]}}
export function rememberCoin(symbol){try{localStorage.setItem('trend-hub-symbol',symbol)}catch{}}
