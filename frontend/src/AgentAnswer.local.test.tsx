// @vitest-environment jsdom
import {test,expect}from'vitest';import {render,screen,cleanup}from'@testing-library/react';import AgentAnswer from'./AgentAnswer';
test('local report renders missing-data disclosure without pretending to be a platform fixed report',()=>{
 render(<AgentAnswer text="只确认公开版本资料。" result={{engine:'codebuddy',missing:['没有市场行情'],localHarness:true}}/>);
 expect(screen.getByText('没有市场行情')).toBeTruthy();expect(screen.getByText(/本地 AI Agent/)).toBeTruthy();cleanup();
 render(<AgentAnswer text="历史结论" result={{report:{localHarness:true,engine:'codex',missing:['日期待核验']}}}/>);
 expect(screen.getByText('日期待核验')).toBeTruthy();expect(screen.queryByText(/报告结构/)).toBeNull();cleanup();
});

test('a recovered native answer still discloses its runtime cleanup warning',()=>{
 render(<AgentAnswer text="已恢复回答" result={{engine:'codebuddy',missing:[],localHarness:true,runtimeWarnings:['临时工作区清理尚未确认；恢复正文没有重新调用模型。']}}/>);
 expect(screen.getByText(/临时工作区清理尚未确认/)).toBeTruthy();cleanup();
});

test('DeepSeek keeps the native answer and exposes separate provider billing and citation metadata',()=>{
 render(<AgentAnswer text="原生观点" result={{localHarness:true,engine:'deepseek',billingSource:'DeepSeek 本人 API 余额',citations:[{title:'公开证据',url:'https://example.com/evidence'}]}}/>);
 expect(screen.getByText(/DeepSeek.*本人 API/)).toBeTruthy();expect(screen.getByRole('link',{name:'公开证据'}).getAttribute('href')).toBe('https://example.com/evidence');expect(document.querySelector('.agent-answer-full-pre')?.textContent).toBe('原生观点');cleanup();
});

test('native Markdown renders tables, links, code and nested lists while preserving the complete source',()=>{
 const text='## 自主格式\n\n| 维度 | 观察 |\n|---|---|\n| 广度 | 待核验 |\n\n[原始来源](https://example.com/report)\n\n```json\n{"status":"待核验"}\n```\n\n- 观察\n  - 验证日期';
 render(<AgentAnswer text={text} result={{localHarness:true,engine:'codex'}}/>);
 expect(screen.getByRole('table')).toBeTruthy();expect(screen.getByRole('columnheader',{name:'维度'})).toBeTruthy();expect(screen.getByRole('link',{name:'原始来源'}).getAttribute('href')).toBe('https://example.com/report');
 expect(screen.getByText('{"status":"待核验"}',{exact:true}).closest('code')).toBeTruthy();expect(screen.getAllByRole('list')).toHaveLength(2);
 expect(document.querySelector('.agent-answer-full-pre')?.textContent).toBe(text);cleanup();
});

test('native Markdown cannot execute model HTML or javascript links, or silently load remote images',()=>{
 render(<AgentAnswer text={'<script>window.hacked=1</script>\n\n[恶意链接](javascript:alert(1))\n\n![远程图片](https://example.com/tracker.png)'} result={{localHarness:true,engine:'codex'}}/>);
 expect(document.querySelector('script')).toBeNull();expect(document.querySelector('a[href^="javascript:"]')).toBeNull();expect(document.querySelector('img')).toBeNull();expect(screen.getByRole('link',{name:/远程图片/}).getAttribute('href')).toBe('https://example.com/tracker.png');cleanup();
});
