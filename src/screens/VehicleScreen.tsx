import { useNavigation } from '@react-navigation/native';
import { Text, YStack, useTheme } from 'tamagui';

const VehicleScreen = () => {
    const theme = useTheme();
    const navigation = useNavigation();

    return (
        <YStack flex='$1' bg='$background'>
            <YStack alignItems='center' justifyContent='center'>
                <Text>Vozilo</Text>
            </YStack>
        </YStack>
    );
};

export default VehicleScreen;
