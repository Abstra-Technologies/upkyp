"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

/* ===============================
   TYPES
================================ */

export interface PropertyData {
    propertyName: string;
    propertyType: string;
    amenities: string[];

    street: string;
    brgyDistrict: string;
    city: string;
    zipCode: number | string;
    province: string;

    propDesc: string;
    floorArea: number;

    waterBillingType: string;
    electricityBillingType: string;

    rentIncreasePercent: number;
    propertyPreferences: string[];

    latitude: number | null;
    longitude: number | null;
}

interface PhotoPreview {
    file: File;
    preview: string;
}

interface PropertyStore {
    /* CREATE PROPERTY */
    property: PropertyData;

    /* PHOTOS (RUNTIME ONLY) */
    photos: PhotoPreview[];

    /* LISTING */
    properties: any[];
    selectedProperty: any;
    loading: boolean;
    error: string | null;

    /* VERIFICATION DOCS (RUNTIME ONLY) */
    docType: string;
    submittedDoc: File | null;
    govID: File | null;
    indoorPhoto: File | null;
    outdoorPhoto: File | null;

    /* ACTIONS */
    setProperty: (data: Partial<PropertyData>) => void;
    toggleAmenity: (amenity: string) => void;

    setPhotos: (photos: PhotoPreview[]) => void;
    removePhoto: (index: number) => void;

    setSubmittedDoc: (file: File | null) => void;
    setGovID: (file: File | null) => void;
    setIndoorPhoto: (file: File | null) => void;
    setOutdoorPhoto: (file: File | null) => void;
    setDocType: (type: string) => void;

    fetchAllProperties: (landlordId: string | number) => Promise<void>;
    updateProperty: (id: string | number, updatedData: any) => void;
    setSelectedProperty: (property: any) => void;
    clearProperties: () => void;

    reset: () => void;
}

/* ===============================
   INITIAL STATE
================================ */

const initialPropertyState: PropertyData = {
    propertyName: "",
    propertyType: "",
    amenities: [],

    street: "",
    brgyDistrict: "",
    city: "",
    zipCode: "",
    province: "",

    propDesc: "",
    floorArea: 0,

    waterBillingType: "",
    electricityBillingType: "",

    rentIncreasePercent: 0,
    propertyPreferences: [],

    latitude: null,
    longitude: null,
};

/* ===============================
   STORE
================================ */

const usePropertyStore = create<PropertyStore>()(
    persist(
        (set, get) => ({
            /* CREATE PROPERTY */
            property: { ...initialPropertyState },

            /* PHOTOS (NOT PERSISTED) */
            photos: [],

            /* LISTING */
            properties: [],
            selectedProperty: null,
            loading: false,
            error: null,

            /* VERIFICATION DOCS */
            submittedDoc: null,
            govID: null,
            indoorPhoto: null,
            outdoorPhoto: null,
            docType: "business_permit",

            /* ================= ACTIONS ================= */

            setProperty: (data) =>
                set((state) => ({
                    property: { ...state.property, ...data },
                })),

            toggleAmenity: (amenity) =>
                set((state) => {
                    const exists = state.property.amenities.includes(amenity);
                    return {
                        property: {
                            ...state.property,
                            amenities: exists
                                ? state.property.amenities.filter((a) => a !== amenity)
                                : [...state.property.amenities, amenity],
                        },
                    };
                }),

            /* PHOTOS */
            setPhotos: (photos) => set({ photos }),

            removePhoto: (index) =>
                set((state) => {
                    const photo = state.photos[index];
                    if (photo?.preview) {
                        URL.revokeObjectURL(photo.preview);
                    }

                    return {
                        photos: state.photos.filter((_, i) => i !== index),
                    };
                }),

            /* DOCS */
            setSubmittedDoc: (file) => set({ submittedDoc: file }),
            setGovID: (file) => set({ govID: file }),
            setIndoorPhoto: (file) => set({ indoorPhoto: file }),
            setOutdoorPhoto: (file) => set({ outdoorPhoto: file }),
            setDocType: (type) => set({ docType: type }),

            /* ================= API ================= */

            fetchAllProperties: async (landlordId) => {
                set({ loading: true, error: null, properties: [] });

                try {
                    const [propertiesRes, photosRes] = await Promise.all([
                        axios.get(
                            `/api/propertyListing/getAllpropertyListing?landlord_id=${landlordId}`
                        ),
                        axios.get(`/api/propertyListing/propertyPhotos`),
                    ]);

                    const properties = propertiesRes.data || [];
                    const photos = photosRes.data || [];

                    const combined = properties.map((p: any) => {
                        const propId = String(p.property_id);
                        const matchedPhotos = photos.filter(
                            (photo: any) => String(photo.property_id) === propId
                        );
                        return { ...p, photos: matchedPhotos };
                    });

                    set({ properties: combined, loading: false });
                } catch (err: any) {
                    set({
                        error: err?.message || "Failed to fetch properties",
                        loading: false,
                    });
                }
            },

            updateProperty: (id, updatedData) =>
                set((state) => ({
                    properties: state.properties.map((p: any) =>
                        p.property_id === id ? { ...p, ...updatedData } : p
                    ),
                })),

            setSelectedProperty: (property) => set({ selectedProperty: property }),

            clearProperties: () => set({ properties: [] }),

            /* ================= RESET ================= */

            reset: () => {
                const { photos } = get();
                photos.forEach((p) => p.preview && URL.revokeObjectURL(p.preview));

                set({
                    property: { ...initialPropertyState },
                    photos: [],
                    submittedDoc: null,
                    govID: null,
                    indoorPhoto: null,
                    outdoorPhoto: null,
                    docType: "business_permit",
                });
            },
        }),
        {
            name: "property-store",

            /* ONLY PERSIST SAFE DATA */
            partialize: (state) => ({
                property: state.property,
                properties: state.properties,
                selectedProperty: state.selectedProperty,
            }),
        }
    )
);

export default usePropertyStore;
