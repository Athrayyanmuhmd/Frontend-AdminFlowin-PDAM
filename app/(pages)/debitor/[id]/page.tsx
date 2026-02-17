"use client";

import { useAuth } from "@/app/hooks/UseAuth";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { IsDesktop } from "@/app/hooks";
import { formatToIDR } from "@/app/utils/helper";
import { Table, TableBody, TableCell, TableRow } from "@mui/material";
import API from "@/app/utils/API";
import {
  Box,
  Typography,
  Paper,
  Grid,
  IconButton,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
} from "recharts";

const DebtorDetailPage: React.FC = () => {
  const auth = useAuth();
  const router = useRouter();
  const { id } = useParams();
  const isDesktop = IsDesktop();
  const [subscriber, setSubscriber] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [waterCredit, setWaterCredit] = useState<any>(null);
  const [history, setHistory] = useState<any>(null);

  const fetchData = async (url: string) => {
    try {
      const response = await API.get(url, {
        headers: { Authorization: auth.auth.token },
      });
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching data from ${url}:`, error);
      return null;
    }
  };

  const fetchSubscriberData = async () => {
    setLoading(true);
    const data = await fetchData(`/subscribe/getSubscribeById/${id}`);
    setSubscriber(data);
    setLoading(false);
  };

  const fetchWaterCreditData = async () => {
    if (subscriber?.waterCreditId) {
      const data = await fetchData(
        `/waterCredit/getWaterCreditById/${subscriber.waterCreditId}`
      );
      setWaterCredit(data);
    }
  };

  const fetchHistoryData = async () => {
    if (subscriber?.waterCreditId) {
      const data = await fetchData(
        `/history/getHistory/${subscriber.customerDetail.id}/${subscriber.waterCreditId}?filter=minggu`
      );
      setHistory(data);
    }
  };

  useEffect(() => {
    if (!auth.auth.isAuthenticated) {
      router.replace("/auth/login");
      return;
    }
    fetchSubscriberData();
  }, [auth.auth.isAuthenticated, router]);

  useEffect(() => {
    if (subscriber) {
      fetchWaterCreditData();
      fetchHistoryData();
    }
  }, [subscriber]);

  if (!isDesktop || loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const handleBack = () => {
    router.back();
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "1000px",
        mx: "auto",
        p: 3,
        fontFamily: '"Poppins", sans-serif',
        backgroundColor: "#f9f9f9",
        borderRadius: 2,
        boxShadow: 3,
      }}
    >
      <Box sx={{ mb: 2, textAlign: "center" }}>
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{ mb: 2, color: "#333" }}
        >
          Debitor
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "start",
          }}
        >
          <IconButton onClick={handleBack} size="small" sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            Kembali
          </Typography>
        </Box>
      </Box>

      <Paper
        elevation={2}
        sx={{ mb: 3, p: 3, borderRadius: 2, backgroundColor: "#fff" }}
      >
        <Table>
          <TableBody>
            {[
              { label: "ID user", value: subscriber?.customerDetail?.id },
              { label: "Nama", value: subscriber?.customerDetail?.fullName },
              { label: "Email", value: subscriber?.customerDetail?.email },
              {
                label: "Total pengeluaran",
                value: formatToIDR(
                  subscriber?.totalUsedWater *
                    (waterCredit?.cost / waterCredit?.perLiter) -
                    subscriber?.usedWaterInTempo *
                      (waterCredit?.cost / waterCredit?.perLiter)
                ),
              },
              {
                label: "Status",
                value: subscriber?.subscribeStatus ? "Aktif" : "Tidak Aktif",
              },
            ].map(({ label, value }, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {label}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: "bold", textAlign: "left" }}
                  >
                    : {value}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Paper
        elevation={2}
        sx={{ p: 3, borderRadius: 2, backgroundColor: "#fff" }}
      >
        <Box sx={{ height: 300, mb: 3 }}>
          {loading ? (
            <CircularProgress />
          ) : history ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart width={300} height={100} data={history}>
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#2983FF" stopOpacity={1} />
                    <stop offset="100%" stopColor="#6FC3FF" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <Line
                  type="monotone"
                  dataKey="totalUsedWater"
                  stroke="url(#gradient)"
                  strokeWidth={2}
                />
                <Tooltip labelFormatter={(value) => value} />
                <XAxis dataKey="_id.day" tick={{ fontSize: 10 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No history data available.
            </Typography>
          )}
        </Box>

        <Grid container spacing={2}>
          {[
            { label: "ID kredit air", value: waterCredit?._id || "N/A" },
            {
              label: "Total pengeluaran",
              value:
                formatToIDR(
                  subscriber?.totalUsedWater *
                    (waterCredit?.cost / waterCredit?.perLiter) -
                    subscriber?.usedWaterInTempo *
                      (waterCredit?.cost / waterCredit?.perLiter)
                ) || "N/A",
            },
            {
              label: "Total penggunaan air",
              value: subscriber?.totalUsedWater + " L" || "N/A",
            },
            {
              label: "Total penggunaan air Belum Lunas",
              value: subscriber?.usedWaterInTempo + " L" || "N/A",
            },
          ].map(({ label, value }, index) => (
            <Grid item xs={6} key={index}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ flex: 1 }}
                >
                  {label}
                </Typography>
                <Typography
                  variant="body2"
                  align="left"
                  sx={{ fontWeight: "bold", flex: 1, pl: 2 }}
                >
                  : {value}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
};

export default DebtorDetailPage;
