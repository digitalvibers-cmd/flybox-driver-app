import { useCallback, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { YStack, XStack, Text, Button, Spinner, Separator, useTheme } from 'tamagui';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTimes, faBoxOpen, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
import Badge from '../components/Badge';
import useFleetbase from '../hooks/use-fleetbase';
import { useAuth } from '../contexts/AuthContext';
import { useOrderManager } from '../contexts/OrderManagerContext';
import { toast } from '../utils/toast';
import { getCustomFieldValue, COD_AMOUNT_KEY, RECIPIENT_PHONE_KEY } from '../utils/custom-fields';

function formatDateTime(value) {
    if (!value) {
        return '—';
    }
    try {
        return format(new Date(value), 'dd.MM.yyyy HH:mm');
    } catch (e) {
        return String(value);
    }
}

const DetailRow = ({ label, value }) => (
    <XStack jc='space-between' ai='flex-start' py='$2' gap='$4'>
        <Text color='$textSecondary'>{label}</Text>
        <Text color='$textPrimary' flex={1} textAlign='right'>
            {value != null && value !== '' ? value : '—'}
        </Text>
    </XStack>
);

const SectionLabel = ({ children }) => (
    <Text color='$textSecondary' fontWeight='bold' fontSize={13} textTransform='uppercase' mb='$2'>
        {children}
    </Text>
);

// Lightweight place card (name + address). Intentionally no map thumbnail —
// PlaceCard's PlaceMapView overflows its slot on-device and isn't needed here.
const PlaceLine = ({ place }) => (
    <YStack bg='$surface' borderWidth={1} borderColor='$borderColorWithShadow' borderRadius='$4' px='$4' py='$3'>
        <Text fontSize={15} color='$textPrimary' fontWeight='bold' mb={2}>
            {place?.name}
        </Text>
        {place?.address ? <Text color='$textSecondary'>{place.address}</Text> : null}
    </YStack>
);

const PackageScanConfirmScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const theme = useTheme();
    const { adapter } = useFleetbase();
    const { driver } = useAuth();
    const { reloadActiveOrders } = useOrderManager();
    const [isAssigning, setIsAssigning] = useState(false);

    const params = route.params || {};
    const code = params.code;
    const order = params.order || {};
    const payload = order.payload || {};

    const assignedDriverId = order.driver_assigned?.id ?? null;
    const isAssignedToMe = !!assignedDriverId && !!driver?.id && assignedDriverId === driver.id;
    const isAssignedToOther = !!assignedDriverId && assignedDriverId !== driver?.id;

    const recipientPhone = getCustomFieldValue(order, RECIPIENT_PHONE_KEY);
    const codAmount = getCustomFieldValue(order, COD_AMOUNT_KEY);
    const trackingNumber = order.tracking_number?.tracking_number;

    const handleConfirm = useCallback(async () => {
        if (!adapter || isAssigning || isAssignedToOther) {
            return;
        }
        setIsAssigning(true);
        try {
            // Assign the scanned package to the current driver and dispatch it.
            await adapter.post('orders/scan-assign', { code });
            // Refresh the driver's order list so the new order shows immediately.
            await Promise.resolve(reloadActiveOrders?.()).catch(() => {});
            toast.success('Package assigned to you.');

            // Reset the scan flow and switch to the Orders tab where the order now appears.
            const parent = navigation.getParent();
            navigation.popToTop();
            if (parent) {
                parent.navigate('DriverTaskTab');
            }
            return;
        } catch (error) {
            const status = error?.response?.status ?? error?.status;
            const serverMsg = error?.response?.data?.error ?? error?.data?.error;
            if (status === 409) {
                toast.error('Package already assigned to another driver.');
            } else if (status === 404) {
                toast.error('Package not found.');
            } else if (status === 403) {
                toast.error('You cannot take this package.');
            } else {
                toast.error(serverMsg || 'Could not assign package. Please try again.');
            }
            setIsAssigning(false);
        }
    }, [adapter, code, isAssigning, isAssignedToOther, navigation, reloadActiveOrders]);

    const assignLabel = isAssignedToMe ? 'Confirm & open' : 'Assign package';

    return (
        <SafeAreaView style={[styles.flex, { backgroundColor: theme.background.val }]}>
            {/* Header */}
            <XStack ai='center' jc='space-between' px='$4' py='$3'>
                <Text color='$textPrimary' fontSize={20} fontWeight='bold'>
                    Package details
                </Text>
                <Button size='$3' circular icon={<FontAwesomeIcon icon={faTimes} color={theme.textPrimary.val} />} onPress={() => navigation.goBack()} />
            </XStack>
            <Separator />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <YStack px='$4' py='$4' gap='$4'>
                    {/* Status + tracking */}
                    <XStack ai='center' jc='space-between' flexWrap='wrap' gap='$2'>
                        {order.status ? <Badge status={order.status} /> : null}
                        {trackingNumber ? (
                            <Text color='$textSecondary' fontSize={13}>
                                {trackingNumber}
                            </Text>
                        ) : null}
                    </XStack>

                    {isAssignedToOther ? (
                        <XStack bg='$error' borderColor='$errorBorder' borderWidth={1} borderRadius='$4' px='$3' py='$3' ai='center' space='$2'>
                            <FontAwesomeIcon icon={faTriangleExclamation} color={theme.errorText.val} />
                            <Text color='$errorText' flex={1}>
                                This package is already assigned to another driver.
                            </Text>
                        </XStack>
                    ) : null}

                    {isAssignedToMe ? (
                        <XStack bg='$info' borderColor='$infoBorder' borderWidth={1} borderRadius='$4' px='$3' py='$3' ai='center' space='$2'>
                            <FontAwesomeIcon icon={faBoxOpen} color={theme.infoText.val} />
                            <Text color='$infoText' flex={1}>
                                This package is already assigned to you.
                            </Text>
                        </XStack>
                    ) : null}

                    {/* Pickup */}
                    {payload.pickup ? (
                        <YStack>
                            <SectionLabel>Pickup</SectionLabel>
                            <PlaceLine place={payload.pickup} />
                        </YStack>
                    ) : null}

                    {/* Dropoff */}
                    {payload.dropoff ? (
                        <YStack>
                            <SectionLabel>Dropoff</SectionLabel>
                            <PlaceLine place={payload.dropoff} />
                        </YStack>
                    ) : null}

                    {/* Details */}
                    <YStack bg='$surface' borderWidth={1} borderColor='$borderColorWithShadow' borderRadius='$4' px='$4' py='$2'>
                        <DetailRow label='Created' value={formatDateTime(order.created_at)} />
                        <Separator />
                        <DetailRow label='Scheduled' value={formatDateTime(order.scheduled_at)} />
                        <Separator />
                        <DetailRow label='Recipient phone' value={recipientPhone} />
                        <Separator />
                        <DetailRow label='Cash on delivery' value={codAmount ? `${codAmount} RSD` : '—'} />
                        {order.notes ? (
                            <>
                                <Separator />
                                <DetailRow label='Notes' value={order.notes} />
                            </>
                        ) : null}
                    </YStack>
                </YStack>
            </ScrollView>

            {/* Footer actions */}
            <Separator />
            <XStack px='$4' py='$3' gap='$3'>
                <Button flex={1} chromeless borderWidth={1} borderColor='$borderColorWithShadow' onPress={() => navigation.goBack()} disabled={isAssigning}>
                    <Text color='$textPrimary'>Cancel</Text>
                </Button>
                <Button flex={2} backgroundColor={isAssignedToOther ? '$gray-400' : theme.primary.val} disabled={isAssigning || isAssignedToOther} onPress={handleConfirm}>
                    <XStack ai='center' space='$2'>
                        {isAssigning ? <Spinner color='white' /> : null}
                        <Text color='white' fontWeight='bold'>
                            {assignLabel}
                        </Text>
                    </XStack>
                </Button>
            </XStack>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    flex: { flex: 1 },
    scrollContent: { paddingBottom: 12 },
});

export default PackageScanConfirmScreen;
