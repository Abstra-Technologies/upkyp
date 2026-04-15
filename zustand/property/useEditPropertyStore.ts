import { create } from "zustand";
import { persist } from "zustand/middleware";

/* =========================
   INITIAL STATE
========================= */
const initialEditPropertyState = {
    propertyName: "",
    propertyType: "",
    amenities: [] as string[],
    street: "",
    brgyDistrict: "",
    city: "",
    zipCode: "",
    province: "",
    description: "",
    floorArea: 0,
    water_billing_type: "",
    electricity_billing_type: "",
    minStay: 0,
    flexiPayEnabled: 0,
    paymentMethodsAccepted: [] as string[],
    propertyPreferences: [] as string[],
    lat: null as number | null,
    lng: null as number | null,
};

/* =========================
   TYPES
========================= */
interface EditPropertyState {
    property: typeof initialEditPropertyState;
    photos: any[];
    loading: boolean;
    error: any;

    setProperty: (propertyDetails: Partial<typeof initialEditPropertyState>) => void;
    setFullProperty: (propertyDetails: any) => void;
    toggleAmenity: (amenity: string) => void;
    setPhotos: (photos: any[]) => void;
    removePhoto: (photoId: string) => void;
    reset: () => void;
}

/* =========================
   HELPERS
========================= */

// ✅ safe JSON parser
const safeParse = (value: any) => {
    if (!value) return [];

    if (Array.isArray(value)) return value;

    try {
        return JSON.parse(value);
    } catch {
        if (typeof value === "string") {
            return value.split(",").map((v) => v.trim());
        }
        return [];
    }
};

const normalizeProperty = (data: any) => ({
    propertyName: data.propertyName ?? data.property_name ?? "",
    propertyType: data.propertyType ?? data.property_type ?? "",

    amenities: safeParse(data.amenities), // 🔥 FIXED

    street: data.street ?? "",
    brgyDistrict: data.brgyDistrict ?? data.brgy_district ?? "",
    city: data.city ?? "",
    zipCode: data.zipCode ?? data.zip_code ?? "",
    province: data.province ?? "",

    description: data.description ?? "",
    floorArea: Number(data.floorArea ?? data.floor_area ?? 0),

    water_billing_type: data.water_billing_type ?? "",
    electricity_billing_type: data.electricity_billing_type ?? "",

    minStay: Number(data.minStay ?? data.min_stay ?? 0),
    flexiPayEnabled: Number(data.flexiPayEnabled ?? data.flexipay_enabled ?? 0),

    paymentMethodsAccepted: safeParse(
        data.paymentMethodsAccepted ?? data.accepted_payment_methods
    ),

    propertyPreferences: safeParse(
        data.propertyPreferences ?? data.property_preferences
    ),

    lat: data.lat ?? data.latitude ?? null,
    lng: data.lng ?? data.longitude ?? null,
});


/* =========================
   STORE
========================= */
const useEditPropertyStore = create<EditPropertyState>()(
    persist(
        (set) => ({
            property: { ...initialEditPropertyState },
            photos: [],
            loading: false,
            error: null,

            /* =======================
               PARTIAL UPDATE
            ======================= */
            setProperty: (propertyDetails) =>
                set((state) => ({
                    property: {
                        ...state.property,
                        ...propertyDetails,
                    },
                })),

            /* =======================
               FULL SET (API LOAD)
            ======================= */
            setFullProperty: (data) =>
                set({
                    property: normalizeProperty(data),
                }),

            /* =======================
               AMENITIES
            ======================= */
            toggleAmenity: (amenity) =>
                set((state) => {
                    const list = state.property.amenities || [];

                    return {
                        property: {
                            ...state.property,
                            amenities: list.includes(amenity)
                                ? list.filter((a) => a !== amenity)
                                : [...list, amenity],
                        },
                    };
                }),

            /* =======================
               PHOTOS
            ======================= */
            setPhotos: (photos) =>
                set({
                    photos: Array.isArray(photos) ? photos : [],
                }),

            removePhoto: (photoId) =>
                set((state) => ({
                    photos: state.photos.filter(
                        (photo) => photo.photo_id !== photoId
                    ),
                })),

            /* =======================
               RESET
            ======================= */
            reset: () =>
                set({
                    property: { ...initialEditPropertyState },
                    photos: [],
                    loading: false,
                    error: null,
                }),
        }),
        {
            name: "edit-property-store",

            /* 🔥 IMPORTANT FIX */
            partialize: (state) => ({
                photos: state.photos,
            }),

            /* 🔥 PREVENT HYDRATION BUGS */
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.photos = state.photos || [];
                }
            },
        }
    )
);

export default useEditPropertyStore;