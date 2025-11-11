import { YStack, Text } from 'tamagui';
import { useLanguage } from '../contexts/LanguageContext';

const TestScreen = () => {
    const { t } = useLanguage();

    return (
        <YStack flex={1} alignItems='center' justifyContent='center' bg='$background' width='100%' height='100%'>
            <Text color='$textPrimary' fontSize={20} fontWeight='bold'>
                {t('TestScreen.helloWorld')}
            </Text>
        </YStack>
    );
};

export default TestScreen;