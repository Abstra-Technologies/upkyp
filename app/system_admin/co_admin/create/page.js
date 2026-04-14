"use client";

import { useState } from "react";
import { roles } from "../../../../constant/adminroles";
import useAuthStore from "../../../../zustand/authStore";
import { availablePermissions } from "../../../../constant/adminPermission";
import SideNavAdmin from "../../../../components/navigation/sidebar-admin";

const CreateCoAdmin = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "",
    first_name: "",
    last_name: "",
    permissions: [],
  });

  const { fetchSession, user, admin } = useAuthStore();
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSelectRole = (e) => {
    const selectedRole = e.target.value;
    setFormData({ ...formData, role: selectedRole });
  };

  const handlePermissionChange = (e) => {
    const { checked, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      permissions: checked
        ? [...prevData.permissions, value]
        : prevData.permissions.filter((perm) => perm !== value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/systemadmin/co_admin/addNewAdmin", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Admin registered successfully.");
        setFormData({
          username: "",
          email: "",
          password: "",
          role: "",
          first_name: "",
          last_name: "",
          permissions: [],
        });
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Something went wrong.");
    }
  };

  return (
    <div className="flex">
      <div className="flex-1 p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold text-blue-600 mb-6">Add New Co-Admin</h1>

        {message && (
          <div className="mb-6 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
                  required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                id="roles"
                name="role"
                value={formData.role}
                onChange={handleSelectRole}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
                required
              >
                <option value="" disabled>
                  Choose a role
                </option>
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-md">
                {availablePermissions.map((perm) => (
                  <div key={perm.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={perm.id}
                      value={perm.id}
                      checked={formData.permissions?.includes(perm.id)}
                      onChange={handlePermissionChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={perm.id} className="ml-2 text-sm text-gray-700">
                      {perm.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition w-full md:w-auto"
              >
                Create Co-Admin
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCoAdmin;