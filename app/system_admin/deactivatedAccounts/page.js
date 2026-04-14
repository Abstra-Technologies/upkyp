'use client'
import { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    Button
} from '@mui/material';
import SideNavAdmin from "../../../../components/navigation/sidebar-admin";

export default function DeactivatedAccounts() {
    const [accounts, setAccounts] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetch('/api/systemadmin/users/getAllDeActivatedAccounts')
            .then((res) => res.json())
            .then((data) => setAccounts(data))
            .catch((err) => console.error('Error:', err));
    }, []);

    const filteredAccounts = accounts.filter(account =>
        account.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.userType.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleReactivate = (user_id, userType) => {
        fetch(`/api/systemadmin/users/reActivateAccounts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id, userType })
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setAccounts(accounts.filter(account => account.user_id !== user_id));
                    alert('Account reactivated successfully!');
                } else {
                    alert('Failed to reactivate account.');
                }
            })
            .catch((err) => console.error('Error:', err));
    };

    return (
        <div className="flex">
            <SideNavAdmin />
            <div className="w-full p-6">
                <h1 className="text-2xl font-semibold text-blue-600 mb-6">Deactivated Accounts</h1>

                <TextField
                    label="Search"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

                <TableContainer component={Paper} style={{ maxHeight: 400, overflow: 'auto' }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>First Name</strong></TableCell>
                                <TableCell><strong>Last Name</strong></TableCell>
                                <TableCell><strong>Email</strong></TableCell>
                                <TableCell><strong>User Type</strong></TableCell>
                                <TableCell><strong>Date Deleted</strong></TableCell>
                                <TableCell><strong>Action</strong></TableCell>

                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredAccounts.length > 0 ? (
                                filteredAccounts.map((account) => (
                                    <TableRow key={account?.user_id}>
                                        <TableCell>{account?.firstName}</TableCell>
                                        <TableCell>{account?.lastName}</TableCell>
                                        <TableCell>{account?.email}</TableCell>
                                        <TableCell>{account?.userType}</TableCell>
                                        <TableCell>{account?.updatedAt}</TableCell>

                                        <TableCell>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                onClick={() => handleReactivate(account?.user_id, account?.userType)}
                                            >
                                                Re-Activate
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">No deactivated accounts found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
        </div>
    );
}
