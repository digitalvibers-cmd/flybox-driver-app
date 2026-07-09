import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import useAppTheme from '../hooks/use-app-theme';

type ThemeContextType = {
    appTheme: string;
    changeScheme: (newScheme: string) => void;
    schemes: string[];
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const { appTheme, changeScheme, schemes } = useAppTheme();
    const value = useMemo(() => ({ appTheme, changeScheme, schemes }), [appTheme, changeScheme, schemes]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeContext = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useThemeContext must be used within a ThemeProvider');
    }
    return context;
};
