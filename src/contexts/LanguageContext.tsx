import React, { createContext, useState, useContext, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { getLangNameFromCode } from 'language-name-map';
import { navigatorConfig } from '../utils';
import { getAvailableLocales } from '../utils/localize';
import localeEmoji from 'locale-emoji';
import useStorage from '../hooks/use-storage';
import I18n from 'react-native-i18n';

I18n.fallbacks = true;
I18n.translations = {
    ...getAvailableLocales(),
};

interface LanguageContextProps {
    locale: string;
    setLocale: (locale: string) => void;
    t: (key: string, options?: Record<string, any>) => string;
}

const LanguageContext = createContext<LanguageContextProps>({
    locale: 'en',
    setLocale: () => {},
    t: () => '',
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [locale, setLocaleState] = useStorage<string>('_locale', navigatorConfig('defaultLocale', 'en'));

    const languages = useMemo(() => {
        return Object.keys(I18n.translations).map((code) => {
            return { code, ...getLangNameFromCode(code), emoji: localeEmoji(code) };
        });
    }, []);

    const language = useMemo(() => {
        return { code: locale, ...getLangNameFromCode(locale), emoji: localeEmoji(locale) };
    }, [locale]);

    const setLocale = useCallback(
        (newLocale: string) => {
            I18n.locale = newLocale;
            setLocaleState(newLocale);
        },
        [setLocaleState]
    );

    useEffect(() => {
        I18n.locale = locale;
    }, []);

    const t = useCallback((key: string, options?: Record<string, any>) => I18n.t(key, options), []);

    const value = useMemo(() => ({ locale, setLocale, t, current: language, language, languages }), [locale, setLocale, t, language, languages]);

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
    return useContext(LanguageContext);
};
