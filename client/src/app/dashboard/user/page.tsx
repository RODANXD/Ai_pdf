"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function UserSettingsPage() {
  /* -------------------- state -------------------- */
  const [form, setForm] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    current_password: "",
    new_password: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  /* -------------------- fetch on mount -------------------- */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch("http://localhost:5000/api/auth/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.id) {
          setForm((f) => ({
            ...f,
            username: data.username || "",
            email: data.email || "",
            first_name: data.first_name || "",
            last_name: data.last_name || "",
          }));
        }
      } catch {
        setError("Failed to load user info.");
      }
    };
    fetchUser();
  }, []);

  /* -------------------- handlers -------------------- */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("http://localhost:5000/api/auth/user", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Profile updated successfully!");
        setForm((f) => ({ ...f, current_password: "", new_password: "" }));
      } else {
        setError(data.error || "Update failed.");
      }
    } catch {
      setError("Update failed.");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("http://localhost:5000/api/auth/user", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        localStorage.clear();
        window.location.href = "/"; // or router.push("/login")
      } else {
        const data = await res.json();
        setError(data.error || "Could not delete account.");
      }
    } catch {
      setError("Network error while deleting account.");
    }
    setDeleteModalOpen(false);
  };

  /* -------------------- render -------------------- */
  const pageVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  return (
    <motion.div
      className="max-w-lg mx-auto mt-10 bg-white rounded-lg shadow p-8"
      initial="hidden"
      animate="visible"
      variants={pageVariants}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-2xl font-bold mb-6 text-center">User Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Label>Username</Label>
        <Input name="username" value={form.username} onChange={handleChange} required />

        <Label>Email</Label>
        <Input type="email" name="email" value={form.email} onChange={handleChange} required />

        <div className="flex gap-4">
          <div className="flex-1 space-y-2">
            <Label>First Name</Label>
            <Input name="first_name" value={form.first_name} onChange={handleChange} required />
          </div>
          <div className="flex-1 space-y-2">
            <Label>Last Name</Label>
            <Input name="last_name" value={form.last_name} onChange={handleChange} required />
          </div>
        </div>

        <hr className="my-4" />

        <h2 className="font-semibold text-lg">Change Password</h2>
        <Label>Current Password</Label>
        <Input
          type="password"
          name="current_password"
          value={form.current_password}
          onChange={handleChange}
        />
        <Label>New Password</Label>
        <Input
          type="password"
          name="new_password"
          value={form.new_password}
          onChange={handleChange}
        />

        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-green-600 font-medium"
            >
              {success}
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-red-500 font-medium"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving…" : "Save Changes"}
        </Button>

        <Button
          type="button"
          variant="destructive"
          className="w-full mt-2"
          onClick={() => setDeleteModalOpen(true)}
        >
          Delete Account
        </Button>
      </form>

      {/* -------------------- delete modal -------------------- */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This action is irreversible. All your data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}