"use client"


import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Upload, Brain, TrendingUp, FileText } from "lucide-react";
import { DocumentService } from "../lib/service/chatApi";
import Link from "next/link";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";


export default function DashboardPage() {

const [totalDocuments, setTotalDocuments] = useState(0);
const [totalQuestions, setTotalQuestions] = useState(0);
const [recentDocuments, setRecentDocuments] = useState<any[]>([]);
const [data, setData] = useState([]);

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  useEffect(() => {
  const token = getToken();
  if (!token) return;

  DocumentService.getDocuments(token)
    .then((res) => {
      const docs = Array.isArray(res?.document)
        ? res.document.map((d: any) => ({
            id: d.id.toString(),
            title: d.filename || "",
            uploadedAt: d.uploaded_at || "",
          }))
        : [];
      setTotalDocuments(docs.length);
      // latest 5
      setRecentDocuments(
        docs
          .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
          .slice(0, 5)
      );
    })
    .catch(() => toast.error("Failed to load documents"));


fetch("http://localhost:5000/api/qa/history", {
  headers: { Authorization: `Bearer ${token}` },
})
  .then((r) => r.json())
  .then((d) => {
    const userQuestions = (d.history || []).filter(
      (m: any) => m.type === "user"
    ).length;
    setTotalQuestions(userQuestions);
  })
  .catch(() => toast.error("Failed to load questions"));
}, []);

useEffect(() => {
    const token = localStorage.getItem("access_token");
    fetch("http://localhost:5000/api/qa/model-stats", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);

      console.log("Data fetched for model stats:", data);
  }, []);


  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your research.</p>
        </div>
        <Link href="/dashboard/upload">
          <Button className="flex items-center space-x-2">
            <Upload className="h-4 w-4" />
            <span>Upload Paper</span>
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
     {/* Quick Stats */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Documents</CardTitle>
      <FileText className="h-4 w-4 text-blue-600" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{totalDocuments}</div>
      <p className="text-xs text-muted-foreground">Research papers uploaded</p>
    </CardContent>
  </Card>

  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Questions</CardTitle>
      <MessageSquare className="h-4 w-4 text-green-600" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{totalQuestions}</div>
      <p className="text-xs text-muted-foreground">AI conversations</p>
    </CardContent>
  </Card>

  {/* keep the other two cards as placeholders */}
  {/* <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Insights</CardTitle>
      <Brain className="h-4 w-4 text-purple-600" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">—</div>
      <p className="text-xs text-muted-foreground">Generated insights</p>
    </CardContent>
  </Card> */}

  {/* <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Activity</CardTitle>
      <TrendingUp className="h-4 w-4 text-orange-600" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">—</div>
      <p className="text-xs text-muted-foreground">Recent interactions</p>
    </CardContent>
  </Card> */}
</div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/dashboard/upload">
            <CardHeader className="text-center">
              <Upload className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <CardTitle>Upload Paper</CardTitle>
              <CardDescription>Upload a new research paper to start analyzing</CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/dashboard/chat">
            <CardHeader className="text-center">
              <MessageSquare className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <CardTitle>Ask Questions</CardTitle>
              <CardDescription>Chat with AI about your research papers</CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/dashboard/knowledge-graph">
            <CardHeader className="text-center">
              <Brain className="h-12 w-12 text-purple-600 mx-auto mb-2" />
              <CardTitle>Knowledge Graph</CardTitle>
              <CardDescription>Visualize relationships in your research</CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Recent Documents</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentDocuments.map((doc) => (
  <div
    key={doc.id}
    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
  >
    <div className="flex items-center space-x-3">
      <FileText className="h-4 w-4 text-blue-600" />
      <div>
        <p className="font-medium text-sm">{doc.title}</p>
        <p className="text-xs text-gray-500">
          {new Date(doc.uploadedAt).toLocaleDateString()}
        </p>
      </div>
    </div>
    <Link href={`/dashboard/chat?doc=${doc.id}`}>
      <Button variant="ghost" size="sm">
        Ask Questions
      </Button>
    </Link>
  </div>
))}
              <Link href="/dashboard/upload">
                <Button variant="outline" size="sm" className="w-full mt-2 bg-transparent">
                  Upload More Papers
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* LLM Model Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>LLM Model Usage</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
<ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <XAxis dataKey="name" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
