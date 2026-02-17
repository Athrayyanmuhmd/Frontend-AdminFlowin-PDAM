'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Paper,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Edit,
  Delete,
  Add,
  Save,
  Close,
  Security,
  AdminPanelSettings,
  Engineering,
  Visibility,
} from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';

// Mock data untuk roles dan permissions
interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  userCount: number;
  permissions: string[];
  isSystem: boolean;
}

interface Permission {
  id: string;
  resource: string;
  actions: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
}

const mockRoles: Role[] = [
  {
    id: '1',
    name: 'super_admin',
    displayName: 'Super Admin',
    description: 'Full system access with all permissions',
    userCount: 2,
    permissions: ['all'],
    isSystem: true,
  },
  {
    id: '2',
    name: 'administrator',
    displayName: 'Administrator',
    description: 'Administrative access to manage customers, billing, and operations',
    userCount: 8,
    permissions: ['customers', 'billing', 'operations', 'reports'],
    isSystem: true,
  },
  {
    id: '3',
    name: 'operator',
    displayName: 'Operator',
    description: 'Operational access for monitoring and work orders',
    userCount: 15,
    permissions: ['operations', 'monitoring'],
    isSystem: false,
  },
  {
    id: '4',
    name: 'teknisi',
    displayName: 'Teknisi',
    description: 'Field technician access for work orders',
    userCount: 25,
    permissions: ['operations'],
    isSystem: true,
  },
  {
    id: '5',
    name: 'viewer',
    displayName: 'Viewer',
    description: 'Read-only access to dashboards and reports',
    userCount: 10,
    permissions: ['dashboard', 'reports'],
    isSystem: false,
  },
];

const resources = [
  { id: 'dashboard', name: 'Dashboard', icon: <AdminPanelSettings /> },
  { id: 'customers', name: 'Customers (SIP)', icon: <Security /> },
  { id: 'billing', name: 'Billing & Finance', icon: <Security /> },
  { id: 'operations', name: 'Operations', icon: <Engineering /> },
  { id: 'monitoring', name: 'SCADA Monitoring', icon: <Visibility /> },
  { id: 'reports', name: 'Reports & Analytics', icon: <Visibility /> },
  { id: 'system', name: 'System Settings', icon: <Security /> },
  { id: 'users', name: 'User Management', icon: <Security /> },
];

const mockPermissions: { [roleId: string]: Permission[] } = {
  '1': resources.map(r => ({
    id: r.id,
    resource: r.name,
    actions: { create: true, read: true, update: true, delete: true },
  })),
  '2': resources.map(r => ({
    id: r.id,
    resource: r.name,
    actions: {
      create: ['customers', 'billing', 'operations'].includes(r.id),
      read: !['system'].includes(r.id),
      update: ['customers', 'billing', 'operations'].includes(r.id),
      delete: ['customers', 'operations'].includes(r.id),
    },
  })),
  '3': resources.map(r => ({
    id: r.id,
    resource: r.name,
    actions: {
      create: ['operations'].includes(r.id),
      read: ['dashboard', 'operations', 'monitoring', 'reports'].includes(r.id),
      update: ['operations'].includes(r.id),
      delete: false,
    },
  })),
  '4': resources.map(r => ({
    id: r.id,
    resource: r.name,
    actions: {
      create: false,
      read: ['operations', 'monitoring'].includes(r.id),
      update: ['operations'].includes(r.id),
      delete: false,
    },
  })),
  '5': resources.map(r => ({
    id: r.id,
    resource: r.name,
    actions: {
      create: false,
      read: ['dashboard', 'reports'].includes(r.id),
      update: false,
      delete: false,
    },
  })),
};

export default function PermissionsPage() {
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<Partial<Role>>({});
  const [successMessage, setSuccessMessage] = useState<string>('');

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setPermissions(mockPermissions[role.id] || []);
  };

  const handlePermissionToggle = (resourceId: string, action: 'create' | 'read' | 'update' | 'delete') => {
    setPermissions(prev =>
      prev.map(p =>
        p.id === resourceId
          ? { ...p, actions: { ...p.actions, [action]: !p.actions[action] } }
          : p
      )
    );
  };

  const handleSavePermissions = () => {
    if (selectedRole) {
      setSuccessMessage(`Permissions updated successfully for ${selectedRole.displayName}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleOpenDialog = (mode: 'create' | 'edit', role?: Role) => {
    setEditMode(mode);
    if (mode === 'edit' && role) {
      setFormData(role);
    } else {
      setFormData({
        name: '',
        displayName: '',
        description: '',
        permissions: [],
        isSystem: false,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({});
  };

  const handleSaveRole = () => {
    if (editMode === 'create') {
      const newRole: Role = {
        id: (roles.length + 1).toString(),
        name: formData.name || '',
        displayName: formData.displayName || '',
        description: formData.description || '',
        userCount: 0,
        permissions: formData.permissions || [],
        isSystem: false,
      };
      setRoles([...roles, newRole]);
      setSuccessMessage(`Role "${newRole.displayName}" created successfully`);
    } else {
      setRoles(prev =>
        prev.map(r => (r.id === formData.id ? { ...r, ...formData } as Role : r))
      );
      setSuccessMessage(`Role "${formData.displayName}" updated successfully`);
    }
    handleCloseDialog();
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDeleteRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role && !role.isSystem) {
      setRoles(prev => prev.filter(r => r.id !== roleId));
      if (selectedRole?.id === roleId) {
        setSelectedRole(null);
        setPermissions([]);
      }
      setSuccessMessage(`Role "${role.displayName}" deleted successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'super_admin':
        return <Security color="error" />;
      case 'administrator':
        return <AdminPanelSettings color="primary" />;
      case 'operator':
        return <Engineering color="info" />;
      case 'teknisi':
        return <Engineering color="success" />;
      case 'viewer':
        return <Visibility color="action" />;
      default:
        return <Security />;
    }
  };

  return (
    <AdminLayout title="Role & Permission Management">
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Role & Permission Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog('create')}
          >
            Add New Role
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Manage user roles and their associated permissions across the system
        </Typography>
      </Box>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Roles List */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Roles ({roles.length})
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {roles.map((role) => (
                  <Paper
                    key={role.id}
                    elevation={selectedRole?.id === role.id ? 4 : 1}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      border: selectedRole?.id === role.id ? 2 : 1,
                      borderColor: selectedRole?.id === role.id ? 'primary.main' : 'divider',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'action.hover',
                      },
                    }}
                    onClick={() => handleRoleSelect(role)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getRoleIcon(role.name)}
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {role.displayName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {role.userCount} users
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {!role.isSystem && (
                          <>
                            <Tooltip title="Edit Role">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDialog('edit', role);
                                }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Role">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteRole(role.id);
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        {role.isSystem && (
                          <Chip label="System" size="small" color="default" />
                        )}
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {role.description}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Permission Matrix */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              {selectedRole ? (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Permissions for {selectedRole.displayName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedRole.description}
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<Save />}
                      onClick={handleSavePermissions}
                      disabled={selectedRole.isSystem}
                    >
                      Save Changes
                    </Button>
                  </Box>

                  {selectedRole.isSystem && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      This is a system role. Permissions cannot be modified.
                    </Alert>
                  )}

                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Resource</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>Create</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>Read</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>Update</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>Delete</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {permissions.map((permission) => (
                          <TableRow key={permission.id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {resources.find(r => r.id === permission.id)?.icon}
                                <Typography>{permission.resource}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Checkbox
                                checked={permission.actions.create}
                                onChange={() => handlePermissionToggle(permission.id, 'create')}
                                disabled={selectedRole.isSystem}
                                color="primary"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Checkbox
                                checked={permission.actions.read}
                                onChange={() => handlePermissionToggle(permission.id, 'read')}
                                disabled={selectedRole.isSystem}
                                color="primary"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Checkbox
                                checked={permission.actions.update}
                                onChange={() => handlePermissionToggle(permission.id, 'update')}
                                disabled={selectedRole.isSystem}
                                color="primary"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Checkbox
                                checked={permission.actions.delete}
                                onChange={() => handlePermissionToggle(permission.id, 'delete')}
                                disabled={selectedRole.isSystem}
                                color="error"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 400,
                    gap: 2,
                  }}
                >
                  <Security sx={{ fontSize: 80, color: 'text.disabled' }} />
                  <Typography variant="h6" color="text.secondary">
                    Select a role to view and manage permissions
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Create/Edit Role Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode === 'create' ? 'Create New Role' : 'Edit Role'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Role Name (Slug)"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              placeholder="e.g., operator"
              helperText="Lowercase, no spaces"
            />
            <TextField
              label="Display Name"
              value={formData.displayName || ''}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              fullWidth
              placeholder="e.g., Operator"
            />
            <TextField
              label="Description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              placeholder="Brief description of this role"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<Close />}>
            Cancel
          </Button>
          <Button onClick={handleSaveRole} variant="contained" startIcon={<Save />}>
            {editMode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
