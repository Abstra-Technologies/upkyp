import * as React from "react";

interface Props {
    firstName: string;
    otp: string;
    expiresAt: string;
    timezone: string;
}

export default function PasswordResetOtpTemplate({
                                                     firstName,
                                                     otp,
                                                     expiresAt,
                                                     timezone,
                                                 }: Props) {
    return (
        <div
            style={{
                fontFamily: "Arial, sans-serif",
                backgroundColor: "#f9fafb",
                padding: "24px",
            }}
        >
            <div
                style={{
                    maxWidth: "480px",
                    margin: "0 auto",
                    backgroundColor: "#ffffff",
                    padding: "24px",
                    borderRadius: "8px",
                }}
            >
                <h1 style={{ fontSize: "22px", marginBottom: "16px" }}>
                    Reset Your Upkyp Password
                </h1>

                <p>Hi {firstName},</p>

                <p>
                    Use the verification code below to reset your account password.
                </p>

                <div
                    style={{
                        backgroundColor: "#f3f4f6",
                        padding: "16px",
                        textAlign: "center",
                        borderRadius: "6px",
                        fontSize: "28px",
                        fontWeight: "bold",
                        letterSpacing: "6px",
                        margin: "16px 0",
                    }}
                >
                    {otp}
                </div>

                <p style={{ fontSize: "14px" }}>
                    This code expires at <strong>{expiresAt}</strong>{" "}
                    ({timezone})
                </p>

                <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "24px" }}>
                    If you did not request this, you can safely ignore this email.
                </p>

                <p style={{ fontSize: "12px", color: "#9ca3af" }}>
                    © {new Date().getFullYear()} Upkyp
                </p>
            </div>
        </div>
    );
}
