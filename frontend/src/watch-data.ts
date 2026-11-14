import {useQuery} from '@tanstack/react-query';
import {publicQuery} from './api';
import {watchModel} from '../../web/v2/watch-model.mjs';
import {marketReadInterval,useMarketClock} from './market-polling';
export function watchInterval(live:any,calendar:any,now=new Date()):number|false{
 return marketReadInterval(60000,calendar,now);
}
export function useWatchData(view?:'monitor',includeRankings=true){
 const free=useQuery(publicQuery('/api/data/free'+(view?'?view=watch':''),300000)),now=useMarketClock();
 const live=useQuery({...publicQuery('/api/data/live'+(view?'?view=watch':''),60000),refetchInterval:q=>watchInterval(q.state.data,free.data?.trading_calendar,now)});
 const indices=useQuery({...publicQuery('/api/data/live?view=indices',60000),enabled:!!view,refetchInterval:q=>watchInterval(q.state.data,free.data?.trading_calendar,now)});
 const rankings=useQuery({...publicQuery('/api/data/live?view=rankings',60000),enabled:!!view&&includeRankings,refetchInterval:q=>watchInterval(q.state.data,free.data?.trading_calendar,now)});
 return {free,live,indices,rankings,model:watchModel(free.data||{},live.data||indices.data||{})};
}
