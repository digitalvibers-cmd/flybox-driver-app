import { mergeConfigs, config, toBoolean } from '../src/utils/config';
import { toArray } from '../src/utils';

export const DefaultConfig = {
    theme: config('APP_THEME', 'blue'),
    driverNavigator: {
        tabs: toArray(config('DRIVER_NAVIGATOR_TABS', 'DriverDashboardTab,DriverTaskTab,DriverReportTab,DriverChatTab,DriverAccountTab')),
        defaultTab: toArray(config('DRIVER_NAVIGATOR_DEFAULT_TAB', 'DriverDashboardTab')),
    },
    defaultLocale: config('DEFAULT_LOCALE', 'sr'),
    // Only Serbian is advertised in the language picker: most UI labels are
    // currently hardcoded Serbian (not routed through I18n), so offering English
    // would yield a half-translated UI. Re-enable via AVAILABLE_LOCALES=sr,en
    // once the hardcoded strings are migrated to translations/*.json.
    availableLocales: toArray(config('AVAILABLE_LOCALES', 'sr')),
    colors: {
        loginBackground: config('LOGIN_BG_COLOR', '#111827'),
    },
};

export function createNavigatorConfig(userConfig = {}) {
    return mergeConfigs(DefaultConfig, userConfig);
}
