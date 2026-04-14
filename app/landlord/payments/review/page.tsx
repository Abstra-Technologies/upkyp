'use client';

import useAuthStore from '@/zustand/authStore';
import { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Button,
} from '@mui/material';

type Payment = {
    payment_id: number;
    tenant_name: string;
    amount_paid: number;
    payment_date: string;
    proof_of_payment: string;
    payment_status: 'pending' | 'confirmed' | 'failed' ;
};

export default function PaymentReviewPageWidget() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const { user } = useAuthStore();

    useEffect(() => {
        if (!user?.landlord_id) return;

        fetch(`/api/landlord/payments/getListofPaymentforReview?landlord_id=${user.landlord_id}`)
            .then((res) => res.json())
            .then((data) => {
                console.log('Fetched payments:', data);
                setPayments(data);
            })
            .catch((err) => console.error('Failed to fetch payments', err));
    }, [user?.landlord_id]);

    const handleAction = async (id: number, action: 'approve' | 'reject') => {
        try {
            await fetch(`/api/landlord/payments/${id}/${action}`, {
                method: 'POST',
            });

            setPayments((prev) =>
                prev.map((p) =>
                    p.payment_id === id
                        ? { ...p, payment_status: action === 'approve' ? 'confirmed' : 'failed' }
                        : p
                )
            );
        } catch (err) {
            console.error('Action failed:', err);
        }
    };

    // @ts-ignore
    return (

        <div className="p-6">
            <Typography variant="h5" gutterBottom>
                Payment Proofs for Review
            </Typography>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#f3f4f6' }}>
                        <TableRow>
                            <TableCell>Tenant</TableCell>
                            <TableCell>Property</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Date Paid</TableCell>
                            <TableCell>Proof</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {payments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    No pending payments found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            payments.map((payment) => (
                                <TableRow key={payment.payment_id}>
                                    <TableCell>{payment.tenant_name || 'Unknown'}</TableCell>
                                    <TableCell>{payment.property_name || 'Unknown'}</TableCell>

                                    <TableCell>₱{payment.amount_paid}</TableCell>
                                    <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <a
                                            href={payment.proof_of_payment}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <img
                                                src={payment.proof_of_payment}
                                                alt="Proof"
                                                className="h-16 w-16 object-cover rounded hover:scale-105 transition"
                                            />
                                        </a>
                                    </TableCell>
                                    <TableCell>
                                        {payment.payment_status === 'pending' && (
                                            <span className="text-yellow-500 font-medium">Pending</span>
                                        )}
                                        {payment.payment_status === 'APPROVED' && (
                                            <span className="text-green-600 font-medium">Approved</span>
                                        )}
                                        {payment.payment_status === 'REJECTED' && (
                                            <span className="text-red-600 font-medium">Rejected</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="contained"
                                            color="success"
                                            size="small"
                                            sx={{ mr: 1 }}
                                            onClick={() => handleAction(payment.payment_id, 'approve')}
                                            disabled={payment.payment_status !== 'pending'}
                                        >
                                            Approve
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="error"
                                            size="small"
                                            onClick={() => handleAction(payment.payment_id, 'reject')}
                                            disabled={payment.payment_status !== 'pending'}
                                        >
                                            Reject
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>

    );
}
