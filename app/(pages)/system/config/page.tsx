'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Save,
  Restore,
  CloudUpload,
  CloudDownload,
  Refresh,
  Security,
  Email,
  Notifications,
  Settings,
  Business,
  Language,
  Schedule,
  Info,
} from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface GeneralSettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  timezone: string;
  dateFormat: string;
  language: string;
  currency: string;
  logoUrl: string;
}

interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpSecure: boolean;
  fromEmail: string;
  fromName: string;
}

interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  notifyOnNewCustomer: boolean;
  notifyOnPayment: boolean;
  notifyOnWorkOrderComplete: boolean;
  notifyOnSystemAlert: boolean;
}

export default function SystemConfigPage() {
  const [tabValue, setTabValue] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);

  // General Settings
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    companyName: 'PDAM Tirta Daroy Banda Aceh',
    companyAddress: 'Jl. T. Nyak Arief No. 290, Banda Aceh',
    companyPhone: '+62 651 12345',
    companyEmail: 'info@pdamtirtadaroy.co.id',
    timezone: 'Asia/Jakarta',
    dateFormat: 'DD/MM/YYYY',
    language: 'id-ID',
    currency: 'IDR',
    logoUrl: '/logo.png',
  });

  // Email Settings
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUsername: 'noreply@pdamtirtadaroy.co.id',
    smtpPassword: '',
    smtpSecure: true,
    fromEmail: 'noreply@pdamtirtadaroy.co.id',
    fromName: 'PDAM Tirta Daroy',
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailEnabled: true,
    smsEnabled: true,
    pushEnabled: false,
    notifyOnNewCustomer: true,
    notifyOnPayment: true,
    notifyOnWorkOrderComplete: true,
    notifyOnSystemAlert: true,
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSaveGeneral = () => {
    // In production, this would save to backend API
    setSuccessMessage('General settings saved successfully');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSaveEmail = () => {
    // In production, this would save to backend API
    setSuccessMessage('Email settings saved successfully');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSaveNotification = () => {
    // In production, this would save to backend API
    setSuccessMessage('Notification settings saved successfully');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleTestEmail = () => {
    // In production, this would send a test email
    setSuccessMessage('Test email sent successfully');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleBackup = () => {
    setBackupDialogOpen(true);
  };

  const handleCreateBackup = () => {
    // In production, this would create a database backup
    const backupData = {
      timestamp: new Date().toISOString(),
      settings: { generalSettings, emailSettings, notificationSettings },
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowin-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    setBackupDialogOpen(false);
    setSuccessMessage('Backup created successfully');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleRestore = () => {
    setRestoreDialogOpen(true);
  };

  const handleRestoreBackup = () => {
    // In production, this would restore from a backup file
    setRestoreDialogOpen(false);
    setSuccessMessage('System restored successfully');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const timezones = [
    'Asia/Jakarta',
    'Asia/Makassar',
    'Asia/Jayapura',
  ];

  const dateFormats = [
    'DD/MM/YYYY',
    'MM/DD/YYYY',
    'YYYY-MM-DD',
  ];

  const languages = [
    { value: 'id-ID', label: 'Bahasa Indonesia' },
    { value: 'en-US', label: 'English' },
  ];

  return (
    <AdminLayout title="System Configuration">
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            System Configuration
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<CloudDownload />}
              onClick={handleBackup}
            >
              Backup
            </Button>
            <Button
              variant="outlined"
              startIcon={<CloudUpload />}
              onClick={handleRestore}
            >
              Restore
            </Button>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Configure system-wide settings and preferences
        </Typography>
      </Box>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab icon={<Business />} label="General" iconPosition="start" />
              <Tab icon={<Email />} label="Email" iconPosition="start" />
              <Tab icon={<Notifications />} label="Notifications" iconPosition="start" />
              <Tab icon={<Security />} label="Security" iconPosition="start" />
            </Tabs>
          </Box>

          {/* General Settings Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Company Information
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={generalSettings.companyName}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, companyName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company Email"
                  type="email"
                  value={generalSettings.companyEmail}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, companyEmail: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company Phone"
                  value={generalSettings.companyPhone}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, companyPhone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company Address"
                  value={generalSettings.companyAddress}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, companyAddress: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Regional Settings
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    value={generalSettings.timezone}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                    label="Timezone"
                  >
                    {timezones.map((tz) => (
                      <MenuItem key={tz} value={tz}>
                        {tz}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Date Format</InputLabel>
                  <Select
                    value={generalSettings.dateFormat}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, dateFormat: e.target.value })}
                    label="Date Format"
                  >
                    {dateFormats.map((format) => (
                      <MenuItem key={format} value={format}>
                        {format}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={generalSettings.language}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, language: e.target.value })}
                    label="Language"
                  >
                    {languages.map((lang) => (
                      <MenuItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Currency"
                  value={generalSettings.currency}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
                  disabled
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button variant="outlined" startIcon={<Refresh />}>
                    Reset
                  </Button>
                  <Button variant="contained" startIcon={<Save />} onClick={handleSaveGeneral}>
                    Save Changes
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Email Settings Tab */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Alert severity="info" icon={<Info />}>
                  Configure SMTP settings to enable email notifications from the system
                </Alert>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SMTP Host"
                  value={emailSettings.smtpHost}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                  placeholder="smtp.gmail.com"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SMTP Port"
                  type="number"
                  value={emailSettings.smtpPort}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: parseInt(e.target.value) })}
                  placeholder="587"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SMTP Username"
                  value={emailSettings.smtpUsername}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpUsername: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SMTP Password"
                  type="password"
                  value={emailSettings.smtpPassword}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="From Email"
                  type="email"
                  value={emailSettings.fromEmail}
                  onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="From Name"
                  value={emailSettings.fromName}
                  onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={emailSettings.smtpSecure}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpSecure: e.target.checked })}
                    />
                  }
                  label="Use TLS/SSL Encryption"
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button variant="outlined" onClick={handleTestEmail}>
                    Send Test Email
                  </Button>
                  <Button variant="contained" startIcon={<Save />} onClick={handleSaveEmail}>
                    Save Changes
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Notification Settings Tab */}
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Notification Channels
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.emailEnabled}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, emailEnabled: e.target.checked })}
                      />
                    }
                    label="Email Notifications"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 5 }}>
                    Send notifications via email
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.smsEnabled}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, smsEnabled: e.target.checked })}
                      />
                    }
                    label="SMS Notifications"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 5 }}>
                    Send notifications via SMS
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.pushEnabled}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, pushEnabled: e.target.checked })}
                      />
                    }
                    label="Push Notifications"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 5 }}>
                    Send push notifications to mobile app
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Notification Events
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="New Customer Registration"
                      secondary="Notify when a new customer registers"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={notificationSettings.notifyOnNewCustomer}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, notifyOnNewCustomer: e.target.checked })}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>

                  <ListItem>
                    <ListItemText
                      primary="Payment Received"
                      secondary="Notify when a payment is received"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={notificationSettings.notifyOnPayment}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, notifyOnPayment: e.target.checked })}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>

                  <ListItem>
                    <ListItemText
                      primary="Work Order Completed"
                      secondary="Notify when a work order is completed"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={notificationSettings.notifyOnWorkOrderComplete}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, notifyOnWorkOrderComplete: e.target.checked })}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>

                  <ListItem>
                    <ListItemText
                      primary="System Alerts"
                      secondary="Notify on critical system alerts"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={notificationSettings.notifyOnSystemAlert}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, notifyOnSystemAlert: e.target.checked })}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button variant="outlined" startIcon={<Refresh />}>
                    Reset
                  </Button>
                  <Button variant="contained" startIcon={<Save />} onClick={handleSaveNotification}>
                    Save Changes
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Security Settings Tab */}
          <TabPanel value={tabValue} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Security & Authentication
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Alert severity="warning">
                  Security settings are managed at the system level. Contact system administrator for changes.
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    Session Settings
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Session Timeout"
                        secondary="30 minutes of inactivity"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Password Expiry"
                        secondary="90 days"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Multi-Factor Authentication"
                        secondary="Enabled for all admin users"
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    API Security
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="API Rate Limiting"
                        secondary="1000 requests per hour per IP"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="JWT Token Expiry"
                        secondary="24 hours"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="CORS Configuration"
                        secondary="Restricted to allowed origins"
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>
        </CardContent>
      </Card>

      {/* Backup Dialog */}
      <Dialog open={backupDialogOpen} onClose={() => setBackupDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create System Backup</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            This will create a backup of all system settings, configurations, and database.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            The backup will be downloaded as a JSON file. Store it securely for disaster recovery.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBackupDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateBackup} variant="contained" startIcon={<CloudDownload />}>
            Create Backup
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restore Dialog */}
      <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Restore System Backup</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Warning: This will replace all current settings with the backup. This action cannot be undone.
          </Alert>
          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{ mt: 2 }}
          >
            Select Backup File
            <input type="file" accept=".json" hidden />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRestoreBackup} variant="contained" color="warning" startIcon={<CloudUpload />}>
            Restore Backup
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
