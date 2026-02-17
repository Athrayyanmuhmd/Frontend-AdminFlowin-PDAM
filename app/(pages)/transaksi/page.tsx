// pages/transaksi.js
"use client";

import API from "@/app/utils/API";
import { useAuth } from "@/app/hooks/UseAuth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Link from "next/link";
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  CircularProgress,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";

export default function Transaksi() {
  const auth = useAuth();
  const navigation = useRouter();
  const [transaksiData, setTransaksiData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.auth.isAuthenticated) {
      navigation.replace("/auth/login");
      return;
    }

    const getTransactions = async () => {
      if (!auth.auth.user?.id) return; // Early return if user ID is not available
      try {
        const response = await API.get(
          `/transactions/getTransactionByRecieverID/${auth.auth.user.id}`,
          {
            headers: {
              Authorization: auth.auth.token,
            },
          }
        );
        setTransaksiData(response.data.data); // Set the fetched transaction data
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    getTransactions(); // Fetch transactions when component mounts
  }, [auth.auth.isAuthenticated, navigation]);

  if (!auth.auth.isAuthenticated) {
    return null; // Hindari rendering konten saat redirect atau loading
  }

  return (
    <>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        align="center"
        sx={{ mb: 4 }}
      >
        Transaksi
      </Typography>

      {loading ? ( // Show loading indicator while fetching
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="100%"
        >
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={2}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell>Id</TableCell>
                <TableCell>Nama</TableCell>
                <TableCell>Kredit</TableCell>
                <TableCell>Nominal</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transaksiData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body1" color="textSecondary">
                      Tidak ada data transaksi.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                transaksiData.map((row) => (
                  <TableRow
                    key={row.id}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {row.id}
                    </TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.amount}</TableCell>
                    <TableCell>{row.category}</TableCell>
                    <TableCell align="center">
                      <Link href={`/detail/${row.id}`} passHref>
                        <Button
                          variant="text"
                          size="small"
                          color="primary"
                          startIcon={<InfoIcon />}
                        >
                          detail
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
}
