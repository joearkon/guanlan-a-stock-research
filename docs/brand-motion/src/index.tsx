import React from 'react';
import {AbsoluteFill, Composition, Easing, Img, Interactive, interpolate, registerRoot, staticFile, useCurrentFrame} from 'remotion';

const orange = '#ff7a1a';
const stages = [
  {title: '看盘', detail: '情绪 · 题材 · 异动'},
  {title: '复盘', detail: '市场 · 条件 · 资金'},
  {title: '研究', detail: '产业 · 公司 · 证据'},
];

// Eight-second loop. All identity and copy remain visible, including frame zero.
// The travelling accent is decorative: it is not a quote, chart or market signal.
export const GuanlanBrand = () => {
  const frame = useCurrentFrame();
  const travel = interpolate(frame, [12, 192, 228, 240], [0, 1, 1, 0], {
    easing: Easing.bezier(0.4, 0, 0.2, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const breathing = (1 - Math.cos(frame / 240 * Math.PI * 2)) / 2;
  return (
    <AbsoluteFill style={{backgroundColor: '#111315', color: '#f5f3ef', fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif', padding: '34px 60px 28px', overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, height: 4, width: '100%', backgroundColor: '#272a2d'}} />
      <Interactive.Div name="品牌节奏线" style={{position: 'absolute', left: 0, top: 0, height: 4, width: interpolate(frame, [12, 192, 228, 240], [216, 984, 984, 216], {easing: Easing.bezier(0.4, 0, 0.2, 1), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}), backgroundColor: '#ff7a1a'}} />
      <div style={{display: 'flex', alignItems: 'center', height: 76, gap: 18}}>
        <div style={{width: 122, height: 76, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Img name="观澜原版 Logo" src={staticFile('logo.png')} style={{width: 154, maxWidth: 'none', flexShrink: 0}} />
        </div>
        <Interactive.Div name="观澜品牌名" style={{fontSize: 58, fontWeight: 700, letterSpacing: 4, lineHeight: 1}}>观澜</Interactive.Div>
        <Interactive.Div name="本地版标识" style={{marginLeft: 'auto', color: '#a6aaaf', fontFamily: 'Consolas, monospace', fontSize: 20, letterSpacing: 3}}>LOCAL HARNESS</Interactive.Div>
      </div>
      <Interactive.Div name="品牌主张" style={{fontSize: 48, fontWeight: 700, letterSpacing: 1, lineHeight: 1.35, marginTop: 24}}>把看盘、复盘与研究串起来。</Interactive.Div>
      <div style={{display: 'flex', marginTop: 40, gap: 42}}>
        {stages.map((stage, i) => {
          const distance = Math.abs(travel * 2 - i);
          const focus = interpolate(distance, [0, 0.65], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (
            <div key={stage.title} style={{flex: 1, borderTop: '1px solid #393b3e', paddingTop: 14, position: 'relative'}}>
              <div style={{position: 'absolute', top: -2, left: 0, height: 3, width: `${28 + focus * 72}%`, backgroundColor: orange, opacity: 0.2 + focus * 0.8}} />
              <div style={{display: 'flex', alignItems: 'baseline', gap: 12}}>
                <span style={{fontFamily: 'Consolas, monospace', fontSize: 19, color: '#92979d'}}>0{i + 1}</span>
                <span style={{fontSize: 30, fontWeight: 700, color: focus > 0.35 ? orange : '#e8e6e2'}}>{stage.title}</span>
              </div>
              <div style={{fontSize: 21, color: '#b0b3b7', marginTop: 8}}>{stage.detail}</div>
            </div>
          );
        })}
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto', fontSize: 20, color: '#a6aaaf'}}>
        <span style={{display: 'block', width: 6, height: 6, borderRadius: '50%', backgroundColor: orange, opacity: 0.6 + breathing * 0.4}} />
        自己的 AI Agent · 自己的研究工作台
      </div>
    </AbsoluteFill>
  );
};

const Root = () => <Composition id="GuanlanBrand" component={GuanlanBrand} durationInFrames={240} fps={30} width={1200} height={420} defaultProps={{}} />;
registerRoot(Root);
