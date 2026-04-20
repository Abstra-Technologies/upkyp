"use client";

import { useEffect, useState } from "react";
import UnitCardMobile from "./UnitCardMobile";
import UnitCardDesktop from "./UnitCardDesktop";

export default function UnitCard(props: any) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const { onRefresh, ...restProps } = props;

  return isMobile ? (
    <UnitCardMobile {...restProps} onRefresh={onRefresh} />
  ) : (
    <UnitCardDesktop {...restProps} onRefresh={onRefresh} />
  );
}
