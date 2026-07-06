import { useCallback, useRef, useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { YStack, XStack, Text, View, Button, Spinner, useTheme } from 'tamagui';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTimes, faQrcode } from '@fortawesome/free-solid-svg-icons';
import QrCodeScanner from '../components/QrCodeScanner';
import useFleetbase from '../hooks/use-fleetbase';
import { toast } from '../utils/toast';

const PackageScanScreen = () => {
    const navigation = useNavigation();
    const theme = useTheme();
    const { adapter } = useFleetbase();
    const [isProcessing, setIsProcessing] = useState(false);
    // Guards against the scanner firing onScan again while a lookup is in flight.
    const lockRef = useRef(false);

    const handleScan = useCallback(
        async (scanned) => {
            const code = typeof scanned === 'string' ? scanned : scanned?.value;
            if (!code || lockRef.current || !adapter) {
                return;
            }

            lockRef.current = true;
            setIsProcessing(true);

            try {
                // Resolve the scanned QR (a uuid) to its order WITHOUT assigning yet.
                const order = await adapter.post('orders/scan-resolve', { code });
                navigation.navigate('PackageScanConfirm', { code, order });
            } catch (error) {
                const status = error?.response?.status ?? error?.status;
                if (status === 404) {
                    toast.error('Paket nije pronađen.');
                } else if (status === 403) {
                    toast.error('Ovaj paket pripada drugoj kompaniji.');
                } else {
                    toast.error('Nije moguće očitati paket. Pokušajte ponovo.');
                }
                // Allow another attempt after a failed lookup.
                lockRef.current = false;
            } finally {
                setIsProcessing(false);
            }
        },
        [adapter, navigation]
    );

    return (
        <SafeAreaView style={[styles.flex, { backgroundColor: theme.background.val }]}>
            <View flex={1}>
                <QrCodeScanner onScan={handleScan} width='100%' height='100%' />

                <View position='absolute' top='$3' right='$3'>
                    <Button size='$3' circular icon={<FontAwesomeIcon icon={faTimes} color={theme.textPrimary.val} />} onPress={() => navigation.goBack()} />
                </View>

                <View position='absolute' bottom='$8' left={0} right={0} alignItems='center' px='$4'>
                    <XStack bg='$surface' borderRadius='$4' px='$4' py='$3' alignItems='center' space='$2' borderWidth={1} borderColor='$borderColorWithShadow'>
                        <FontAwesomeIcon icon={faQrcode} color={theme.textPrimary.val} />
                        <Text color='$textPrimary'>Usmerite kameru ka QR kodu paketa</Text>
                    </XStack>
                </View>

                {isProcessing && (
                    <YStack position='absolute' top={0} bottom={0} left={0} right={0} alignItems='center' justifyContent='center' bg='rgba(0,0,0,0.55)' space='$3'>
                        <Spinner size='large' color={theme.primary.val} />
                        <Text color='white'>Loading package…</Text>
                    </YStack>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    flex: { flex: 1 },
});

export default PackageScanScreen;
