// Fleetbase custom_fields.name is a dasherized slug auto-generated from the
// admin UI's Field Label (e.g. label "Cena otkupa" -> name "cena-otkupa").
// These constants must match exactly what an admin types as the Label in the
// FleetVibe console Order Config Manager -> Custom Fields screen. Kept in sync
// with the customer-portal copy (Fleet Vibe/customer-portal/lib/custom-fields.ts).
export const COD_AMOUNT_KEY = 'cena-otkupa';
export const RECIPIENT_PHONE_KEY = 'broj-primaoca';

type CustomFieldValue = {
    value?: unknown;
    custom_field_uuid?: string;
    custom_field?: { uuid?: string; name?: string; label?: string };
};

type OrderLike = {
    custom_field_values?: CustomFieldValue[] | null;
    [key: string]: unknown;
};

/**
 * Returns a custom field value from an order by its name slug (e.g. "cena-otkupa").
 *
 * The public /v1/ Order resource flattens custom fields to TOP-LEVEL keys with
 * hyphens replaced by underscores (e.g. order.cena_otkupa), and only lists the
 * names in `custom_fields`. As a fallback we also read the internal-API shape
 * (`custom_field_values[]` with a nested `custom_field.name`). Returns null when
 * missing/empty.
 */
export function getCustomFieldValue(order: OrderLike | undefined | null, key: string): string | null {
    if (!order) return null;

    // Primary: flattened top-level key (public /v1/ shape), hyphens -> underscores.
    const underscored = key.replace(/-/g, '_');
    for (const k of [underscored, key]) {
        const v = order[k];
        if (v != null && String(v).trim() !== '') return String(v);
    }

    // Fallback: internal-API shape (array of values with nested custom_field.name).
    const cfvs = order.custom_field_values;
    if (Array.isArray(cfvs)) {
        for (const cfv of cfvs) {
            if (cfv?.custom_field?.name === key) {
                const v = cfv.value;
                if (v != null && String(v).trim() !== '') return String(v);
            }
        }
    }

    return null;
}
