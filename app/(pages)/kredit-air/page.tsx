"use client";

import { useAuth } from "@/app/hooks/UseAuth";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IsDesktop } from "@/app/hooks";
import "leaflet/dist/leaflet.css";
import { formatToIDR } from "@/app/utils/helper";
import API from "@/app/utils/API";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Modal,
  TextField,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
interface Coordinates {
  lat: number;
  lng: number;
}

const MapComponent = dynamic(
  () => import("../../components/map/MapComponent"),
  { ssr: false }
);

const KreditAirPage: React.FC = () => {
  const auth = useAuth();
  const router = useRouter();
  const isDesktop = IsDesktop();
  const [kreditData, setKreditData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({
    owner: {
      id: auth.auth.user?.id,
      fullName: auth.auth.user?.fullName,
      phone: auth.auth.user?.phone,
      email: auth.auth.user?.email,
    },
    cost: 0,
    perLiter: 0,
    billingTime: "Perbulan",
    conservationToken: {
      rewardToken: 0,
      maxWaterUse: 0,
      tokenRewardTempo: "Perbulan",
    },
    waterQuality: "Bagus",
    income: 0,
    totalIncome: 0,
    withdrawl: 0,
    totalUser: 0,
    location: {
      address: "",
      coordinates: {
        long: 0,
        lat: 0,
      },
    },
  });

  const [position, setPosition] = useState<Coordinates>({
    lat: 0,
    lng: 0,
  });

  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        setPosition({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
        });
        setFormData({
          ...formData,
          location: {
            ...formData.location,
            coordinates: {
              long: e.latlng.lng,
              lat: e.latlng.lat,
            },
          },
        });
      },
    });
    return null;
  };

  // Fetch kredit air data
  const getKreditAir = async () => {
    if (!auth.auth.user?.id) return; // Early return if user ID is not available
    try {
      setLoading(true);
      const response = await API.get(
        `/waterCredit/getWaterCreditByOwnerId/${auth.auth.user?.id}`,
        {
          headers: {
            Authorization: auth.auth.token,
          },
        }
      );
      console.log(response.data.data);
      setKreditData(response.data.data);
    } catch (error) {
      console.error("Error fetching kredit air data:", error);
      setKreditData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!auth.auth.isAuthenticated) {
      router.replace("/auth/login");
      return;
    }

    getKreditAir(); // Fetch data when ready
  }, [auth.auth.isAuthenticated, auth.auth.user?.id]);

  if (!auth.auth.isAuthenticated) {
    return null; // Avoid rendering content during redirect
  }

  const handleCreateKredit = () => {
    setOpenModal(true); // Open modal when button is clicked
  };

  const handleCloseModal = () => {
    setOpenModal(false); // Close modal
  };

  const handleSave = async () => {
    // Implement save functionality here
    console.log("Save button clicked", formData);
    // Add API call to save the new Kredit Air data
    try {
      await API.post("/waterCredit/createWaterCredit", formData, {
        headers: {
          Authorization: auth.auth.token,
        },
      });
      setOpenModal(false);
      getKreditAir(); // Refresh the data after saving
    } catch (error) {
      console.error("Error saving kredit air data:", error);
    }
  };

  return !isDesktop ? null : (
    <Box
      sx={{
        width: "100%",
        height: "",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 5,
        position: "relative",
        zIndex: 0,
        boxShadow: "none",
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
          p: 3,
          bgcolor: "background.paper",
          borderRadius: 1,
          boxShadow: "none",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h5" component="h1" fontWeight="bold">
            Kredit Air
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateKredit}
            sx={{
              bgcolor: "#001F3F",
              "&:hover": { bgcolor: "#00346B" },
              borderRadius: "4px",
              textTransform: "none",
            }}
          >
            Buat Kredit Air
          </Button>
        </Box>

        {loading ? ( // Show loading spinner while fetching
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
          >
            <CircularProgress />
          </Box>
        ) : kreditData.length === 0 ? ( // Check if there are no kredit data
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
              style={{ marginBottom: "16px", color: "#f44336" }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="8" />
            </svg>
            <Typography
              variant="h6"
              sx={{ mt: 2, fontWeight: "bold", color: "#333" }}
            >
              Belum Ada Kredit Air
            </Typography>
            <Typography variant="body2" sx={{ color: "#666" }}>
              Silakan tambahkan kredit air baru untuk memulai.
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table sx={{ minWidth: 650 }} aria-label="kredit air table">
              <TableHead>
                <TableRow>
                  <TableCell>Id</TableCell>
                  <TableCell>Tarif</TableCell>
                  <TableCell>Income</TableCell>
                  <TableCell>Jumlah pelanggan</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow
                  key={kreditData[0]?._id}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {kreditData[0]?._id}
                  </TableCell>
                  <TableCell>
                    {formatToIDR(kreditData[0]?.cost)} /{" "}
                    {kreditData[0]?.perLiter} L
                  </TableCell>
                  <TableCell>{kreditData[0]?.income}</TableCell>
                  <TableCell>{kreditData[0]?.totalUser}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Modal for creating Kredit Air */}
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <Box
          sx={{
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 3,
            p: 4,
            maxWidth: 600,
            mx: "auto",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          <Typography id="modal-title" variant="h6" component="h2">
            Buat Kredit Air
          </Typography>
          <Box
            component="form"
            sx={{
              mt: 2,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 2,
            }}
          >
            <TextField
              fullWidth
              label="Tarif"
              variant="outlined"
              margin="normal"
              placeholder="Rp.xxx.xxx"
              type="number"
              onChange={(e) =>
                setFormData({ ...formData, cost: Number(e.target.value) })
              }
            />
            <TextField
              fullWidth
              label="Banyak liter"
              variant="outlined"
              margin="normal"
              placeholder="1000 L"
              type="number"
              onChange={(e) =>
                setFormData({ ...formData, perLiter: Number(e.target.value) })
              }
            />
            <TextField
              fullWidth
              label="Tempo tagihan"
              variant="outlined"
              margin="normal"
              select
              SelectProps={{
                native: true,
              }}
              onChange={(e) =>
                setFormData({ ...formData, billingTime: e.target.value })
              }
            >
              <option value="Perhari">Perhari</option>
              <option value="Perminggu">Perminggu</option>
              <option value="Perbulan">Perbulan</option>
              <option value="Pertahun">Pertahun</option>
            </TextField>
            <TextField
              fullWidth
              label="Token Konservasi"
              variant="outlined"
              margin="normal"
              type="number"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  conservationToken: {
                    ...formData.conservationToken,
                    rewardToken: Number(e.target.value),
                  },
                })
              }
            />
            <TextField
              fullWidth
              label="Maks pemakaian"
              variant="outlined"
              margin="normal"
              type="number"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  conservationToken: {
                    ...formData.conservationToken,
                    maxWaterUse: Number(e.target.value),
                  },
                })
              }
            />
            <TextField
              fullWidth
              label="Tempo"
              variant="outlined"
              margin="normal"
              select
              SelectProps={{
                native: true,
              }}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  conservationToken: {
                    ...formData.conservationToken,
                    tokenRewardTempo: e.target.value,
                  },
                })
              }
            >
              <option value="Perhari">Perhari</option>
              <option value="Perminggu">Perminggu</option>
              <option value="Perbulan">Perbulan</option>
              <option value="Pertahun">Pertahun</option>
            </TextField>
            <TextField
              fullWidth
              label="Kualitas air"
              variant="outlined"
              margin="normal"
              select
              SelectProps={{
                native: true,
              }}
              onChange={(e) =>
                setFormData({ ...formData, waterQuality: e.target.value })
              }
            >
              <option value="Kurang Bagus">Kurang Bagus</option>
              <option value="Bagus">Bagus</option>
              <option value="Sangat Bagus">Sangat Bagus</option>
            </TextField>
            <TextField
              fullWidth
              label="Alamat"
              variant="outlined"
              margin="normal"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  location: {
                    ...formData.location,
                    address: e.target.value,
                  },
                })
              }
            />
            <TextField
              fullWidth
              label="Longitude"
              variant="outlined"
              margin="normal"
              type="number"
              value={
                formData.location.coordinates.long === 0
                  ? ""
                  : formData.location.coordinates.long
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  location: {
                    ...formData.location,
                    coordinates: {
                      ...formData.location.coordinates,
                      long: Number(e.target.value),
                    },
                  },
                })
              }
            />
            <TextField
              fullWidth
              label="Latitude"
              variant="outlined"
              margin="normal"
              type="number"
              value={
                formData.location.coordinates.lat === 0
                  ? ""
                  : formData.location.coordinates.lat
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  location: {
                    ...formData.location,
                    coordinates: {
                      ...formData.location.coordinates,
                      lat: Number(e.target.value),
                    },
                  },
                })
              }
            />

            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 3, gridColumn: "span 2" }} // Span both columns
              onClick={handleSave}
            >
              Simpan
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default KreditAirPage;
