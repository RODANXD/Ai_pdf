"use client"

import React, { useState, useEffect, useRef } from "react"
import { chatService, ChatMessage, DocumentService, TranscribeService, SummaryService } from '../../lib/service/chatApi'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Send, FileText, Brain } from "lucide-react"
// import KnowledgeGraphPage from "../Knowledge/page"
import { toast } from "sonner"
import dynamic from 'next/dynamic';
import jsPDF from "jspdf";
import { Loader2 } from "lucide-react";

// Define a TypeScript interface for document objects
interface Document {
  id: string
  title: string
  filename: string
}

const CytoscapeComponent = dynamic(() => import('react-cytoscapejs'), { ssr: false });


export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [documents, setDocuments] = useState<Document[]>([]) 
  const [selectedDocument, setSelectedDocument] = useState<string>("all")
  // Update default llmModel to a free model
  const [llmModel, setLlmModel] = useState("openai/gpt-3.5-turbo");
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [recordSecs, setRecordSecs] = useState(0)
const [summaryModal, setSummaryModal] = useState<{open: boolean, summary: string | null, pdfId?: string | number}>({open: false, summary: null});
  const [graphModal, setGraphModal] = useState<{open: boolean, graph: any | null}>({open: false, graph: null});
  const [promptStyle, setPromptStyle] = useState("concise");

useEffect(() => {
  let t: NodeJS.Timeout
  if (isRecording) {
    setRecordSecs(0)
    t = setInterval(() => setRecordSecs((s) => s + 1), 1000)
  }
  return () => clearInterval(t)
}, [isRecording])


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Get token from localStorage
  const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null)
  
  // Load chat history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      const token = getToken()
      if (!token) return
      try {
        const history = await chatService.getHistory(token)
        setMessages(history.map(m => ({
          ...m,
          timestamp: m.timestamp ? new Date(m.timestamp).toISOString() : new Date().toISOString()
        })))
      } catch (e) {
        // ignore
      }
    }
    fetchHistory()
  }, [])

  // Load documents on mount
  useEffect(() => {
    const fetchDocuments = async () => {
      const token = getToken()
      if (!token) return
      try {
        // DocumentService.getDocuments should return { document: [...] }
        const res = await DocumentService.getDocuments(token)
        const docs = res && Array.isArray(res.document) ? res.document.map((doc: any) => ({
          id: doc.id.toString(),
          title: doc.filename,
          filename: doc.filename,
        })) : []
        setDocuments(docs)
      } catch (e) {
        toast.error("Failed to load documents")
        setDocuments([])
      }
    }
    fetchDocuments()
  }, [])

  // Save chat history on change
  useEffect(() => {
    const token = getToken()
    if (!token) return
    if (messages.length > 0) {
      chatService.saveHistory(messages, token).catch(() => {})
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date().toISOString(),
      model: llmModel,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const pdf_id = selectedDocument !== 'all' ? selectedDocument : undefined
      const token = getToken()
      if (!token || !pdf_id) throw new Error('No document selected or not logged in')
        // console.log("[DEBUG] Sending question:", input, "for PDF ID:", pdf_id, "with model:", llmModel, "and prompt style:", promptStyle)
      const res = await chatService.askQuestion(input, pdf_id, token, llmModel, promptStyle)
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: res.answer,
        timestamp: new Date().toISOString(),
        model: llmModel,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err: any) {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 2).toString(),
        type: "assistant",
        content: err.message || 'Failed to get answer',
        timestamp: new Date().toISOString(),
      }])
    }
    setIsLoading(false)
  }

  const startRecording = async () => {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      toast.warning("Your browser does not support audio recording.")
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new window.MediaRecorder(stream)
      let localAudioChunks: Blob[] = []
      setMediaRecorder(recorder)
      setAudioChunks([]) // Clear at start
      console.log("[DEBUG] Recording started")

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          localAudioChunks.push(e.data)
          console.log("[DEBUG] ondataavailable: chunk size", e.data.size)
        } else {
          console.log("[DEBUG] ondataavailable: empty chunk")
        }
        
      }

      recorder.onstop = async () => {
        console.log("[DEBUG] Recording stopped. Chunks count:", localAudioChunks.length);
        if (localAudioChunks.length === 0) {
          toast.error("No audio recorded. Please try again.");
          console.log("[DEBUG] No audio chunks recorded.");
          return;
        }
        const audioBlob = new Blob(localAudioChunks, { type: 'audio/webm' });
        console.log("[DEBUG] audioBlob size:", audioBlob.size);
        const audioFile = new File([audioBlob], 'voice.webm', { type: 'audio/webm' });
        setAudioChunks([]);
      
        const token = getToken();
        if (!token) {
          toast.error("Not logged in");
          return;
        }
        console.log("[DEBUG] Audio file to be sent for transcription:", audioFile);
        try {
          toast("Transcribing audio...");
          setIsTranscribing(true);
          const text = await TranscribeService.transcribeAudio(audioFile, token);
          setInput(text);
          setIsTranscribing(false);
          console.log("[DEBUG] Transcription:", text);
          toast.success("Speech converted to text successfully");
        } catch (err: any) {
          toast.error("Transcription failed");
          console.log("[DEBUG] Transcription error:", err);
        }
      };

      recorder.start()
      setIsRecording(true)
      toast("Recording... Click again to stop.")
    } catch (error) {
      toast.warning("Could not access microphone")
      console.log("[DEBUG] Error accessing microphone:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
      setMediaRecorder(null)
      // Do not clear audioChunks here
      console.log("[DEBUG] stopRecording called")
    }
  }

  const quickActions = [
    "Summarize the main findings",
    "What are the key contributions?",
    "What methodology was used?",
    "Compare the results across papers",
  ]

  // Helper function to format model names for display
  const formatModelName = (model: string) => {
    if (!model) return "Unknown"
    switch (model) {
      case "openai/gpt-3.5-turbo":
        return "GPT-3.5"
      case "anthropic/claude-3-haiku":
        return "Claude 3 Haiku"
      case "meta-llama/llama-3-8b-instruct":
        return "Llama 3 8B"
      case "google/gemini-pro":
        return "Gemini Pro"
      default:
        return model.split('/').pop() || model
    }
  }

  // Summarize handler

const handleSummarize = async (pdfId: number) => {
  setSummaryModal({open: true, summary: 'Loading...', pdfId});
  try {
    const token = getToken();
    const summary = await SummaryService.pdfsummary(pdfId, token);
    setSummaryModal({open: true, summary, pdfId});
  } catch (e) {
    setSummaryModal({open: true, summary: 'Failed to summarize document.', pdfId});
  }
};
 
  // Knowledge Graph handler
  const handleGraph = async (pdfId: number) => {
    setGraphModal({open: true, graph: 'Loading...'});
    try {
      const token = getToken();
      const graph = await SummaryService.Graphhandle(pdfId, token);
      setGraphModal({open: true, graph});
    } catch (e) {
      setGraphModal({open: true, graph: 'Failed to generate knowledge graph.'});
    }
  };

  // Add ExportPDFButton component
  const ExportPDFButton = ({ text, filename }: { text: string; filename?: string }) => {
    const exportAsPDF = () => {
      const doc = new jsPDF();
      const lines = doc.splitTextToSize(text, 180);
      doc.text(lines, 10, 10);
      doc.save(filename ? `${filename}-summary.pdf` : "summary.pdf");
    };
    return (
      <Button size="sm" variant="outline" className="w-full cursor-pointer" onClick={exportAsPDF}>
        Export PDF
      </Button>
    );
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex gap-6">
      {/* Chat Interface */}
      <div className="flex-1 flex flex-col ">

        
        <Card className="flex-1 flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5" />
                <span>AI Research Assistant</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Select value={llmModel} onValueChange={setLlmModel}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai/gpt-3.5-turbo">GPT-3.5 Turbo (Free)</SelectItem>
                    <SelectItem value="anthropic/claude-3-haiku">Claude 3 Haiku (Free)</SelectItem>
                    <SelectItem value="meta-llama/llama-3-8b-instruct">Llama 3 8B Instruct (Free)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <select value={promptStyle} onChange={e => setPromptStyle(e.target.value)}>
  <option value="concise">Concise</option>
  <option value="technical">Technical</option>
  <option value="casual">Casual</option>
</select>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="h-72">

              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.type === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {/* Model badge */}
                    {message.model && (
                      <div className="mt-2 pt-2 border-t border-opacity-20">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            message.type === "user" 
                              ? "bg-blue-500/20 text-blue-100 border-blue-300" 
                              : "bg-gray-200 text-gray-700 border-gray-300"
                          }`}
                        >
                          {formatModelName(message.model)}
                        </Badge>
                      </div>
                    )}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-opacity-20">
                        <p className="text-xs font-medium mb-1">Sources:</p>
                        <div className="flex flex-wrap gap-1">
                          {message.sources.map((source, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {source}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-gray-600">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
        </div>


            {/* Input Area */}
            <div className="border-t p-4">
              <form onSubmit={handleSubmit} className="flex items-end space-x-2">
                <div className="flex-1">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question about your research papers..."
                    className="min-h-[60px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit(e)
                      }
                    }}
                  />

                </div>
                <div className="flex flex-col space-y-2">
                  <div className="flex flex-col space-y-2">
  <Button
    type="button"
    variant="outline"
    size="sm"
    onClick={isRecording ? stopRecording : startRecording}
    className={isRecording ? "bg-red-100 border-red-300" : ""}
  >
    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
  </Button>
  <Button type="submit"
    disabled={!input.trim() || isLoading || isTranscribing}>
    <Send className="h-4 w-4" />
  </Button>
  {/* Loader for transcription */}
  {isTranscribing && (
    <div className="flex items-center justify-center mt-2">
      <Loader2 className="animate-spin h-4 w-4 mr-2 text-blue-500" />
      <span className="text-xs text-blue-600">Transcribing...</span>
    </div>
  )}
</div>
                  
                </div>
              </form>
            </div>
{isRecording && <span className="text-xs text-red-600 ml-2">{recordSecs}s</span>}

          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="w-80 space-y-4">
        {/* Document Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Search Scope</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedDocument} onValueChange={setSelectedDocument}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Documents</SelectItem>
                {(Array.isArray(documents) ? documents : []).map((doc)  => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="w-full justify-start bg-transparent"
                onClick={() => setInput(action)}
              >
                <FileText className="h-4 w-4 mr-2" />
                {action}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Recent Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 h-60 overflow-y-auto">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-2 rounded border hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedDocument(doc.id)}
                >
                  <p className="text-sm font-medium truncate">{doc.title}</p>
                  <p className="text-xs text-gray-500">{doc.filename}</p>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" className=" cursor-pointer" onClick={e => {e.stopPropagation(); handleSummarize(doc.id);}}>Summarize</Button>
                    {/* Export PDF Button: fetch summary and export */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="cursor-pointer"
                      onClick={async (e) => {
                        e.stopPropagation();
                        const token = getToken();
                        let summary = '';
                        try {
                          summary = await SummaryService.pdfsummary(doc.id, token);
                        } catch {
                          summary = 'Failed to fetch summary.';
                        }
                        const docPDF = new jsPDF();
                        const lines = docPDF.splitTextToSize(summary, 180);
                        docPDF.text(lines, 10, 10);
                        docPDF.save(`${doc.filename}-summary.pdf`);
                      }}
                    >
                      Export PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      {summaryModal.open && (
  <div className="fixed inset-0 bg-gray-700/50 bg-opacity-30 flex items-center justify-center z-50">
    <div className="bg-white  p-6 rounded shadow-lg max-w-lg w-full h-10/12 ">
      <h2 className="text-lg font-bold mb-2">Summary</h2>
      <div className=" overflow-y-scroll h-5/6">
        <pre className="whitespace-pre-wrap text-sm mb-4">{summaryModal.summary}</pre>
      </div>
      <div className="flex gap-2 mt-5">
        <Button onClick={() => setSummaryModal({open: false, summary: null})}>Close</Button>
        <Button
          variant="outline"
          onClick={async () => {
            setSummaryModal({open: true, summary: 'Regenerating...'});
            try {
              const token = getToken();
              const summary = await SummaryService.pdfsummary(summaryModal.pdfId, token, true); // pass force=true
              setSummaryModal({open: true, summary, pdfId: summaryModal.pdfId});
            } catch {
              setSummaryModal({open: true, summary: 'Failed to regenerate summary.', pdfId: summaryModal.pdfId});
            }
          }}
        >
          Regenerate
        </Button>
        {/* Share Button */}
        <Button
          variant="outline"
          onClick={async () => {
            try {
              const token = getToken();
              const res = await fetch("http://localhost:5000/api/qa/answershare", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ answer: summaryModal.summary }),
              });
              const data = await res.json();
              console.log(data);
              if (data.url) {
                console.log
                navigator.clipboard.writeText(data.url);
                alert("Shareable link copied to clipboard:\n" + data.url);
              } else {
                alert("Failed to create shareable link.");
              }
            } catch {
              alert("Failed to create shareable link.");
            }
          }}
        >
          Share
        </Button>
      </div>
    </div>
  </div>
)}
      {graphModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-2xl w-full">
            <h2 className="text-lg font-bold mb-2">Knowledge Graph</h2>
            {typeof graphModal.graph === 'string' ? (
              <pre className="whitespace-pre-wrap text-sm mb-4">{graphModal.graph}</pre>
            ) : (
              <div style={{ height: 400 }}>
                <CytoscapeComponent
                  elements={Array.isArray(graphModal.graph?.nodes) && Array.isArray(graphModal.graph?.edges) ? [
                    ...graphModal.graph.nodes.map((n: any) => ({ data: { id: n.id || n.name, label: n.label || n.name } })),
                    ...graphModal.graph.edges.map((e: any, i: number) => ({ data: { id: e.id || `e${i}`, source: e.source, target: e.target, label: e.label } }))
                  ] : []}
                  style={{ width: '100%', height: '100%' }}
                  layout={{ name: 'cose' }}
                />
              </div>
            )}
            <Button onClick={() => setGraphModal({open: false, graph: null})}>Close</Button>
          </div>
        </div>
      )}

    </div>
  )
}