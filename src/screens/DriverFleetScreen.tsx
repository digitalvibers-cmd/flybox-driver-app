import { useNavigation } from '@react-navigation/native';
import { Text, YStack, useTheme } from 'tamagui';
import { useLanguage } from '../contexts/LanguageContext';

const DriverFleetScreen = () => {
    const theme = useTheme();
    const navigation = useNavigation();
    const { t } = useLanguage();

    return (
        <YStack flex='$1' bg='$background'>
            <YStack alignItems='center' justifyContent='center'>
                <Text>{t('DriverFleetScreen.driverfleetscreen')}</Text>
            </YStack>
        </YStack>
    );
};

export default DriverFleetScreen;