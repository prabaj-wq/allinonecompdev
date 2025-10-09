import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  message, 
  Card, 
  Space, 
  Tag,
  Popconfirm,
  Typography,
  Switch
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  CheckCircleOutlined,
  StopOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

interface Role {
  id: number;
  role_code: string;
  name: string;
  description: string;
  is_system_role: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Permission {
  id: number;
  permission_code: string;
  name: string;
  description: string;
  module: string;
  action: string;
  resource: string;
}

const RoleList: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form] = Form.useForm();
  const [rolePermissions, setRolePermissions] = useState<number[]>([]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/roles/');
      setRoles(response.data);
    } catch (error) {
      message.error('Failed to fetch roles');
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await axios.get('http://localhost:8000/roles/permissions');
      setPermissions(response.data);
    } catch (error) {
      message.error('Failed to fetch permissions');
      console.error('Error fetching permissions:', error);
    }
  };

  const fetchRolePermissions = async (roleId: number) => {
    try {
      const response = await axios.get(`http://localhost:8000/roles/${roleId}/permissions`);
      setRolePermissions(response.data.map((p: Permission) => p.id));
    } catch (error) {
      message.error('Failed to fetch role permissions');
      console.error('Error fetching role permissions:', error);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const handleAddRole = () => {
    setEditingRole(null);
    setRolePermissions([]);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditRole = async (role: Role) => {
    setEditingRole(role);
    form.setFieldsValue(role);
    await fetchRolePermissions(role.id);
    setIsModalVisible(true);
  };

  const handleDeleteRole = async (id: number) => {
    try {
      await axios.delete(`http://localhost:8000/roles/${id}`);
      message.success('Role deleted successfully');
      fetchRoles();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to delete role');
      console.error('Error deleting role:', error);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await axios.put(`http://localhost:8000/roles/${id}`, {
        is_active: !currentStatus
      });
      message.success('Role status updated successfully');
      fetchRoles();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to update role status');
      console.error('Error updating role status:', error);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingRole) {
        // Update existing role
        await axios.put(`http://localhost:8000/roles/${editingRole.id}`, {
          name: values.name,
          description: values.description,
          is_active: values.is_active
        });
        
        // Update role permissions if changed
        const currentRolePermissions = await axios.get(`http://localhost:8000/roles/${editingRole.id}/permissions`);
        const currentPermissionIds = currentRolePermissions.data.map((p: Permission) => p.id);
        
        // Add new permissions
        const permissionsToAdd = rolePermissions.filter(id => !currentPermissionIds.includes(id));
        if (permissionsToAdd.length > 0) {
          await axios.post(`http://localhost:8000/roles/${editingRole.id}/permissions`, {
            permission_ids: permissionsToAdd
          });
        }
        
        message.success('Role updated successfully');
      } else {
        // Create new role
        const response = await axios.post('http://localhost:8000/roles/', {
          role_code: values.role_code || values.name.toLowerCase().replace(/\s+/g, '_'),
          name: values.name,
          description: values.description,
          is_system_role: values.is_system_role || false
        });
        
        // Assign permissions to new role
        if (rolePermissions.length > 0) {
          await axios.post(`http://localhost:8000/roles/${response.data.id}/permissions`, {
            permission_ids: rolePermissions
          });
        }
        
        message.success('Role created successfully');
      }
      
      setIsModalVisible(false);
      fetchRoles();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Operation failed');
      console.error('Error saving role:', error);
    }
  };

  const handlePermissionChange = (permissionIds: number[]) => {
    setRolePermissions(permissionIds);
  };

  const columns: ColumnsType<Role> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Code',
      dataIndex: 'role_code',
      key: 'role_code',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Type',
      dataIndex: 'is_system_role',
      key: 'is_system_role',
      render: (isSystemRole: boolean) => (
        <Tag color={isSystemRole ? 'blue' : 'green'}>
          {isSystemRole ? 'System' : 'Custom'}
        </Tag>
      ),
      filters: [
        { text: 'System', value: true },
        { text: 'Custom', value: false },
      ],
      onFilter: (value, record) => record.is_system_role === value,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Tag icon={isActive ? <CheckCircleOutlined /> : <StopOutlined />} 
             color={isActive ? 'success' : 'default'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Role) => (
        <Space>
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={() => handleEditRole(record)}
          >
            View
          </Button>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEditRole(record)}
            disabled={record.is_system_role}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to change the status of this role?"
            onConfirm={() => handleToggleStatus(record.id, record.is_active)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link">
              {record.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </Popconfirm>
          {!record.is_system_role && (
            <Popconfirm
              title="Are you sure you want to delete this role?"
              onConfirm={() => handleDeleteRole(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button 
                type="link" 
                danger 
                icon={<DeleteOutlined />}
              >
                Delete
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card 
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3} style={{ margin: 0, color: '#24292f' }}>
              Role Management
            </Title>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRole}>
              Add Role
            </Button>
          </div>
        }
        style={{ 
          borderRadius: '6px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e1e4e8'
        }}
      >
        <Text type="secondary" style={{ marginBottom: '16px', display: 'block' }}>
          Manage user roles and permissions across the organization
        </Text>
        
        <Table 
          dataSource={roles} 
          columns={columns} 
          loading={loading}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ['5', '10', '20'],
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Modal
        title={editingRole ? "Edit Role" : "Add Role"}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        okText={editingRole ? "Update" : "Create"}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Role Name"
            rules={[{ required: true, message: 'Please enter role name' }]}
          >
            <Input placeholder="e.g. Administrator" />
          </Form.Item>
          
          {!editingRole && (
            <Form.Item
              name="role_code"
              label="Role Code"
              rules={[{ required: true, message: 'Please enter role code' }]}
            >
              <Input placeholder="e.g. admin_role" />
            </Form.Item>
          )}
          
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea placeholder="Describe the purpose of this role" rows={3} />
          </Form.Item>
          
          {!editingRole && (
            <Form.Item
              name="is_system_role"
              label="System Role"
              valuePropName="checked"
            >
              <Switch checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>
          )}
          
          <Form.Item
            label="Permissions"
          >
            <Select 
              mode="multiple" 
              placeholder="Select permissions"
              value={rolePermissions}
              onChange={handlePermissionChange}
              options={permissions.map(permission => ({
                label: `${permission.name} (${permission.permission_code})`,
                value: permission.id
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RoleList;