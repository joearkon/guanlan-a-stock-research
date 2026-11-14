import {test,expect}from'vitest';import * as market from './market-polling';
const calendar={from:'2026-11-13',through:'2026-11-16',open_days:['2026-11-13','2026-11-16']};
test.each([
 ['2026-11-14T02:00:00Z','closed','休市'],['2026-11-16T01:14:59Z','pre','盘前'],['2026-11-16T01:15:00Z','auction','集合竞价'],['2026-11-16T01:30:00Z','morning','盘中'],['2026-11-16T03:29:59Z','morning','盘中'],['2026-11-16T03:30:00Z','lunch','午间休市'],['2026-11-16T05:00:00Z','afternoon','盘中'],['2026-11-16T06:56:59Z','afternoon','盘中'],['2026-11-16T06:57:00Z','closing_auction','收盘竞价'],['2026-11-16T07:00:00Z','after','已收盘']
])('market session at %s follows the shared calendar and Shanghai clock', (time,kind,label)=>{
 const classify=(market as any).marketSession;expect(typeof classify).toBe('function');const value=classify(calendar,new Date(time));expect(value.kind).toBe(kind);expect(value.label).toBe(label);
});
test('an absent or uncovered calendar never claims trading or closure from the weekday',()=>{
 const classify=(market as any).marketSession;expect(typeof classify).toBe('function');for(const c of [null,{open_days:[]},calendar])expect(classify(c,new Date('2026-11-21T02:00:00Z')).kind).toBe('unknown');
});
test.each([['2026-11-16T01:14:59Z','2026-11-16T01:15:00.000Z'],['2026-11-16T01:29:59Z','2026-11-16T01:30:00.000Z'],['2026-11-16T03:29:59Z','2026-11-16T03:30:00.000Z'],['2026-11-16T06:56:59Z','2026-11-16T06:57:00.000Z'],['2026-11-16T06:59:59Z','2026-11-16T07:00:00.000Z']])('the presentation clock wakes for %s without polling market data',(from,to)=>{expect(new Date(market.nextMarketBoundary(new Date(from))).toISOString()).toBe(to);});
