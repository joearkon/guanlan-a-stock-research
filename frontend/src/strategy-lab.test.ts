import {test,expect} from 'vitest';
import {readStrategyDraft,screenStrategy,strategyPrompt,templates} from './strategy-lab';
const day='2026-11-23';
const model={schema:'high-board-v1',day,phase:'closed',version:'v1',total:4,rows:[
 {code:'600001',name:'高度样本',height:5,turnoverPct:12,amountYi:3,themes:[{name:'芯片'}]},
 {code:'600002',name:'次高样本',height:3,turnoverPct:null,amountYi:2,themes:[]},
 {code:'600003',name:'换手样本',height:2,turnoverPct:8,amountYi:1,themes:[{name:'芯片'}]},
]};
test('height is calculated before filters; bounded coverage is not a full market claim',()=>{
 const result=screenStrategy(model,day,{...templates[0].rule,theme:'芯片'});
 expect(result.matches.map(x=>x.code)).toEqual(['600001']);expect(result.truncated).toBe(true);
 expect(screenStrategy(model,day,{...templates[0].rule,theme:'不存在'}).matches).toHaveLength(0);
});
test('missing required metrics stay missing, not zero or failed; order stable',()=>{
 const result=screenStrategy(model,day,templates[1].rule);
 expect(result.missing.map(x=>x.code)).toEqual(['600002']);
 expect(result.matches.map(x=>x.code)).toEqual(['600001','600003']);
});
test('date mismatch, unresolved parameters and unavailable sequence templates cannot screen',()=>{
 expect(()=>screenStrategy(model,'2026-11-24',templates[0].rule)).toThrow(/日期/);
 expect(()=>screenStrategy(model,day,{...templates[0].rule,needs:['承接定义']})).toThrow(/待确认/);
 expect(()=>screenStrategy(model,day,templates[2].rule)).toThrow(/连续过程/);
});
test('strict imported rules reject unsupported expressions, coercions, invalid bounds and unknown keys',()=>{
 const rule=templates[1].rule;expect(readStrategyDraft(JSON.stringify(rule))).toEqual(rule);
 for(const input of [{...rule,minHeight:'2'},{...rule,minTurnover:-1},{...rule,minTurnover:80,maxTurnover:10},{...rule,expression:'eval(x)'},{...rule,needs:'none'},{...rule,scope:'all-market'}])expect(()=>readStrategyDraft(JSON.stringify(input))).toThrow();
});
test('AI prompt preserves original as data and fits existing explicit-send limit',()=>{
 const prompt=strategyPrompt('我想做超短情绪，不做纯一字。');expect(prompt).toContain('我想做超短情绪，不做纯一字。');expect(prompt).toContain('needs');expect(prompt.length).toBeLessThanOrEqual(500);
 expect(strategyPrompt('"'.repeat(160)).length).toBeLessThanOrEqual(500);
});
