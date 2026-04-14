"use client";

import { useMemo } from "react";
import useSWR from "swr";
import axios from "axios";
import { MaterialReactTable } from "material-react-table";
import { Chip, Switch, Stack, Typography } from "@mui/material";

const fetcher = (url: string) =>
    axios.get(url).then((res) => res.data);

export default function PayoutChannelsTable() {
    const { data, isLoading, mutate } = useSWR(
        "/api/systemadmin/payouts/paymentChannels",
        fetcher
    );

    // TEMP: optimistic toggle (wire to PUT API later)
    const handleToggle = async (row: any) => {
        // example when you add PUT:
        await axios.put("/api/systemadmin/payouts/paymentChannels", {
          channel_code: row.code,
          is_available: !row.is_available,
        });

        mutate();
    };

    const columns = useMemo(
        () => [
            {
                accessorKey: "name",
                header: "Bank / Wallet",
                size: 220,
                Cell: ({ cell }: any) => (
                    <Typography fontWeight={600}>
                        {cell.getValue()}
                    </Typography>
                ),
            },
            {
                accessorKey: "code",
                header: "Channel Code",
                size: 160,
                Cell: ({ cell }: any) => (
                    <Chip
                        label={cell.getValue()}
                        size="small"
                        color="info"
                        variant="outlined"
                    />
                ),
            },
            {
                accessorKey: "channel_type",
                header: "Type",
                size: 140,
                Cell: ({ cell }: any) => {
                    const type = cell.getValue();
                    return (
                        <Chip
                            size="small"
                            label={type}
                            color={type === "wallet" ? "success" : "secondary"}
                        />
                    );
                },
            },
            {
                accessorKey: "is_available",
                header: "Available",
                size: 100,
                Cell: ({ row }: any) => (
                    <Switch
                        checked={Boolean(row.original.is_available)}
                        onChange={() => handleToggle(row.original)}
                        color="success"
                    />
                ),
            },
        ],
        []
    );

    return (
        <MaterialReactTable
            columns={columns}
            data={data || []}
            state={{ isLoading }}
            enableColumnActions={false}
            enableDensityToggle={false}
            enableFullScreenToggle={false}
            enableSorting
            muiTablePaperProps={{
                elevation: 0,
                sx: {
                    borderRadius: 2,
                    border: "1px solid #e5e7eb",
                },
            }}
            renderTopToolbarCustomActions={() => (
                <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="h6" fontWeight={700}>
                        Payout Channels
                    </Typography>
                    <Chip
                        size="small"
                        label="System Config"
                        color="warning"
                        variant="outlined"
                    />
                </Stack>
            )}
        />
    );
}
