"use client";

import { Box, Button, Typography } from "@mui/material";
import { useRouter } from "next/navigation";

export default function AlreadyAppliedCard() {
    const router = useRouter();

    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="70vh"
            px={2}
        >
            <Box
                maxWidth="sm"
                width="100%"
                textAlign="center"
                p={4}
                borderRadius={3}
                boxShadow={3}
                bgcolor="background.paper"
            >
                {/* Icon */}
                <Box mb={2} display="flex" justifyContent="center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="56"
                        height="56"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        style={{ color: "#1976d2" }}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </Box>

                {/* Title */}
                <Typography variant="h6" fontWeight={600} gutterBottom>
                    Application Already Submitted
                </Typography>

                {/* Description */}
                <Typography variant="body2" color="text.secondary" mb={3}>
                    You've already applied for this property. You can view your current
                    units or browse other available listings.
                </Typography>

                {/* Actions */}
                <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => router.push("/tenant/my-unit")}
                    >
                        View My Units
                    </Button>

                    <Button
                        variant="outlined"
                        onClick={() => router.push("/find-rent")}
                    >
                        Find Another
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}
