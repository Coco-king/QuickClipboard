import React, { useEffect } from 'react';
import { useSnapshot } from 'valtio';
import { dashboardStore } from '@shared/store/index.js'
import { applyThemeToBody, useTheme } from '@shared/hooks/useTheme';
import { useSettingsSync } from '@shared/hooks/useSettingsSync';
import { applyBackgroundImage, clearBackgroundImage } from '@shared/utils/backgroundManager';
import ToastContainer from '@shared/components/common/ToastContainer';
import Dashboard from './components/Dashboard.jsx';
import DashboardHeader from "./components/DashboardHeader.jsx";

function App() {
  const snap = useSnapshot(dashboardStore);
  const {theme, backgroundImagePath} = snap;
  const {effectiveTheme, isDark, isBackground} = useTheme();

  // 监听设置变更事件
  useSettingsSync();

  // 应用主题到body
  useEffect(() => {
    applyThemeToBody(theme, 'dashboard');
  }, [theme, effectiveTheme]);

  // 应用背景图片（仅在背景主题时）
  useEffect(() => {
    if (isBackground && backgroundImagePath) {
      applyBackgroundImage({
        containerSelector: '.dashboard-container',
        backgroundImagePath,
        windowName: 'dashboard'
      });
    } else {
      clearBackgroundImage('.dashboard-container');
    }
  }, [isBackground, backgroundImagePath]);

  const containerClasses = `
    dashboard-container 
    h-screen w-screen 
    flex flex-col 
    overflow-hidden 
    transition-colors duration-500 ease-in-out
    ${isDark ? 'dark bg-gray-900' : ''}
    ${!isDark ? 'bg-white' : ''}
    ${isBackground ? 'backdrop-blur-md bg-opacity-0' : ''}
  `.trim().replace(/\s+/g, ' ');

  return <div className={containerClasses}>
    <DashboardHeader/>
    <Dashboard/>
    <ToastContainer/>
  </div>;
}

export default App;