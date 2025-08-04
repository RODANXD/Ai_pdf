"use client"
import React from "react";
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DocumentService } from "@/app/lib/service/chatApi";
import { toast } from "sonner"
import {
  FileText,
  Search,
  Filter,
  MoreHorizontal,
  Download,
  Eye,
  MessageSquare,
  Trash2,
  Upload,
  Calendar,
  User,
  Tag,
} from "lucide-react"
import Link from "next/link"
import jsPDF from "jspdf";
import Router from "next/router";

interface Document {
  id: string
  title: string
  filename: string
  authors: string[]
  uploadedAt: string
  status: "processing" | "completed" | "error"
  size: string
  pages: number
  tags: string[]
  summary?: string
  questions: number
}

export default function DocumentsPage({ text }: { text: string }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("uploadedAt")
  const [documents, setDocuments] = useState<Document[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);



  const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null)
  useEffect(() => {
    const fetchDocuments = async () => {
      const token = getToken()
      if (!token) return
      try {
        // DocumentService.getDocuments should return { document: [...] }
        const res = await DocumentService.getDocuments(token)
        console.log("res", res);
        const docs = res && Array.isArray(res.document) ? res.document.map((doc: any) => ({
          id: doc.id?.toString() ?? "",
          title: doc.filename ?? "",
          filename: doc.filename ?? "",
          authors: doc.authors ?? [], // or [] if not available
          uploadedAt: doc.uploaded_at ?? "",
          status: doc.status ?? "completed", // or another default
          size: doc.pdf_size ?? "",
          pages: doc.pages ?? 0,
          tags: doc.tags ?? [],
          summary: doc.summary ?? "",
          questions: doc.questions ?? 0,
        })) : [];
        console.log("doc", docs);
        setDocuments(docs);
      } catch (e) {
        toast("Failed to load documents")
        setDocuments([])
      }
    }
    fetchDocuments()
  }, [])

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:5000/api/qa/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      console.log("history",data);
      setTotalQuestions(data.history.length);
    };
    fetchHistory();
  }, []);

  



  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.authors.some((author) => author.toLowerCase().includes(searchQuery.toLowerCase())) ||
      doc.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = statusFilter === "all" || doc.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: Document["status"]) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "processing":
        return <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600 mt-1">Manage and analyze your research papers</p>
        </div>
        <Link href="/dashboard/upload">
          <Button className="flex items-center space-x-2"  >
            <Upload className="h-4 w-4" />
            <span>Upload New</span>
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{documents.length}</p>
                <p className="text-sm text-gray-600">Total Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-green-500 rounded"></div>
              <div>
                <p className="text-2xl font-bold">{documents.filter((d) => d.status === "completed").length}</p>
                <p className="text-sm text-gray-600">Processed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{totalQuestions}</p>
                <p className="text-sm text-gray-600">Total Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">
                  {
                    documents.filter((d) => new Date(d.uploadedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
                      .length
                  }
                </p>
                <p className="text-sm text-gray-600">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents, authors, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Document Library</CardTitle>
          <CardDescription>
            {filteredDocuments.length} of {documents.length} documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                {/* <TableHead>Authors</TableHead> */}
                <TableHead>Status</TableHead>
                <TableHead>Size</TableHead>
                {/* <TableHead>Questions</TableHead> */}
                <TableHead>Uploaded</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{doc.title}</p>
                      <p className="text-sm text-gray-500">{doc.filename}</p>
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                  {/* <TableCell>
                    <div className="space-y-1">
                      {doc.authors.map((author) => (
                        <div key={author} className="flex items-center text-sm">
                          <User className="h-3 w-3 mr-1" />
                          {author}
                        </div>
                      ))}
                    </div>
                  </TableCell> */}
                  <TableCell>{getStatusBadge(doc.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{doc.size}</p>
                     
                    </div>
                  </TableCell>
                  {/* <TableCell>
                    <Badge variant="secondary">{doc.questions}</Badge>
                  </TableCell> */}
                  <TableCell className="text-sm text-gray-500">
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {/* <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem> */}
                        <DropdownMenuItem>
                          <Link href={`/dashboard/chat?doc=${doc.id}`} className="flex items-center">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Ask Questions
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
  onClick={async (e) => {
    e.stopPropagation();
    const token = getToken();
    try {
      const response = await fetch(
        `http://localhost:5000/api/pdf/download/${Number(doc.id)}`,   // ← add /pdf
        {
          // method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.filename || "document.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast("Failed to download file");
    }
  }}
>
  <Download className="h-4 w-4 mr-2" />
  Download
</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={async (e) => {
  e.stopPropagation();
  const token = getToken();
  try {
    const response = await fetch(`http://localhost:5000/api/pdf/delete/${doc.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Delete failed');
    }
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    toast('PDF deleted successfully');
  } catch (err) {
    toast('Failed to delete PDF');
  }
}}>
  <Trash2 className="h-4 w-4 mr-2" />
  Delete
</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
