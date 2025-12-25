import '@tabler/icons-webfont/dist/tabler-icons.min.css';
import { useTranslation } from 'react-i18next';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { hideDashboardWindow, openSettingsWindow } from "@shared/api/index.js";

function DashboardHeader({onNavigate}) {
  const {
    t
  } = useTranslation();
  const currentWindow = getCurrentWindow();

  const handleMinimize = async () => {
    await currentWindow.minimize();
  };
  const handleMaximize = async () => {
    await currentWindow.toggleMaximize();
  };
  const handleClose = async () => {
    // await currentWindow.close();
    await hideDashboardWindow();
  };
  const handleOpenSettings = async () => {
    await openSettingsWindow()
  }

  return <header data-tauri-drag-region className="settings-header flex-shrink-0 h-9 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
    <div className="flex items-center gap-3 p-3">
      <h1 className="text-base font-semibold text-gray-900 dark:text-white">
        {t('dashboard.title')}
      </h1>
    </div>

    <div className="flex items-center gap-3">
      <div className="flex items-center gap-0.5">
        <button onClick={handleOpenSettings} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title={t('common.settings')}>
          <i
            className="ti ti-settings text-gray-600 dark:text-gray-400" style={{
            fontSize: 16
          }}
          ></i>
        </button>

        {/*<button onClick={handleMinimize} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title={t('common.minimize')}>
          <i
            className="ti ti-minus text-gray-600 dark:text-gray-400" style={{
            fontSize: 16
          }}
          ></i>
        </button>*/}

        {/*<button onClick={handleMaximize} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title={t('common.maximize')}>
          <i
            className="ti ti-square text-gray-600 dark:text-gray-400" style={{
            fontSize: 16
          }}
          ></i>
        </button>*/}

        <button onClick={handleClose} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors" title={t('common.close')}>
          <i
            className="ti ti-x text-gray-600 dark:text-gray-400 hover:text-red-600" style={{
            fontSize: 16
          }}
          ></i>
        </button>
      </div>
    </div>
  </header>;
}

export default DashboardHeader;