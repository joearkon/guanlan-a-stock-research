// @vitest-environment jsdom
import {test,expect,afterEach}from'vitest';import{render,screen,cleanup}from'@testing-library/react';
import OnboardingProvider from'./Onboarding';import HelpCenter from'./HelpCenter';
afterEach(()=>{cleanup();localStorage.clear();});
test('Harness help offers its configuration entry without exposing platform AI as the local engine',()=>{
 render(<OnboardingProvider account="guest" ready={false} edition="harness"><HelpCenter/></OnboardingProvider>);
 expect(screen.getByRole('link',{name:'配置自己的 AI Agent'}).getAttribute('href')).toBe('/next/local-ai');
});
test('SaaS help must not route users to a nonexistent local Agent configuration',()=>{
 render(<OnboardingProvider account="guest" ready={false}><HelpCenter/></OnboardingProvider>);
 expect(screen.queryByRole('link',{name:'配置自己的 AI Agent'})).toBeNull();
});
