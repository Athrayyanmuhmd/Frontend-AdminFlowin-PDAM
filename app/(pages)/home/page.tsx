"use client";

import { useAuth } from "@/app/hooks/UseAuth";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IsDesktop } from "@/app/hooks";
import API from "@/app/utils/API";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";

const HomePage: React.FC = () => {
  const auth = useAuth();
  const navigation = useRouter();
  const isDesktop = IsDesktop();
  const [subsribers, setSubsribers] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(true); // State to manage loading

  const getSubscribers = async () => {
    if (!auth.auth.user?.id) return; // Early return if user ID is not available
    setLoading(true); // Set loading to true before fetching
    try {
      const response = await API.get(
        `/subscribe/getSubscribeByOwnerId/${auth.auth.user?.id}`,
        {
          headers: {
            Authorization: auth.auth.token,
          },
        }
      );
      setSubsribers(response.data.data.subscriptions);
    } catch (error) {
      console.error("Error fetching subscribers:", error); // Improved error logging
    } finally {
      setLoading(false); // Set loading to false after fetching
    }
  };

  useEffect(() => {
    if (!auth.auth.isAuthenticated) {
      navigation.replace("/auth/login");
      return;
    }
    getSubscribers();
  }, [auth.auth.isAuthenticated, navigation]);

  if (!auth.auth.isAuthenticated) {
    return null; // Hindari rendering konten saat redirect
  }

  return !isDesktop ? null : (
    <Box
      sx={{
        width: "100%", // Set width to full viewport width
        height: "", // Set height to full viewport height
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 5,
        position: "relative",
        zIndex: 0,
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "100%", // Set height to fill the parent Box
          p: 3,
          bgcolor: "background.paper",
          borderRadius: 1,
          boxShadow: 1,
        }}
      >
        <Typography
          variant="h5"
          component="h1"
          align="center"
          fontWeight="bold"
          sx={{ mb: 3 }}
        >
          Debitor
        </Typography>

        {loading ? ( // Show loading spinner while fetching
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
          >
            <CircularProgress />
          </Box>
        ) : subsribers.length === 0 ? ( // Check if there are no subscribers
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            height="100%"
            sx={{
              textAlign: "center",
              bgcolor: "background.default",
              p: 3,
              borderRadius: 2,
              boxShadow: 3,
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="120"
              height="120"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="feather feather-alert-circle"
              style={{ marginBottom: "16px", color: "#f44336" }} // Changed color to a more vibrant red
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="8" />
            </svg>
            <Typography
              variant="h6"
              sx={{ mt: 2, fontWeight: "bold", color: "#333" }}
            >
              Belum Ada Pelanggan
            </Typography>
            <Typography variant="body2" sx={{ color: "#666" }}>
              Silakan tambahkan pelanggan baru untuk memulai.
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table sx={{ minWidth: 650 }} aria-label="debitor table">
              <TableHead>
                <TableRow>
                  <TableCell>Id</TableCell>
                  <TableCell>Nama</TableCell>
                  <TableCell>Id Kredit</TableCell>
                  <TableCell>Total penggunaan</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subsribers.map((subscriber: any, index: number) => (
                  <TableRow
                    key={index}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {subscriber._id}
                    </TableCell>
                    <TableCell>{subscriber.customerDetail.fullName}</TableCell>
                    <TableCell>{subscriber.waterCredit.id}</TableCell>
                    <TableCell>
                      {subscriber.subscriptionStats.totalUsedWater} L
                    </TableCell>
                    <TableCell>
                      <Link
                        className="underline text-blue-500"
                        href={`/debitor/${subscriber._id}`}
                      >
                        detail
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
};

export default HomePage;
