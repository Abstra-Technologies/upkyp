"use client";

import dynamic from "next/dynamic";

const PropertyDetails = dynamic(
    () => import("@/components/find-rent/PropertyDetails"),
    { ssr: false }
);

export default function PropertyDetailsWrapper({ id }: { id: string }) {
    // @ts-ignore
    return <PropertyDetails id={id} />;
}
