"use client"
import React, { useEffect, useState } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
interface Node {
  data: { id: string; label: string };
}
interface Edge {
  data: { source: string; target: string; label: string };
}
interface GraphData {
  nodes: Node[];
  edges: Edge[];
}
interface Document {
  id: number;
  filename: string;
}

export default function KnowledgeGraphPage() {
  const [elements, setElements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedPdfId, setSelectedPdfId] = useState<number | null>(null);

  // Fetch documents on mount
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await axios.get("http://localhost:5000/api/pdf/documents", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDocuments(res.data.document || []);
        if (res.data.document && res.data.document.length > 0) {
          setSelectedPdfId(res.data.document[0].id);
        }
      } catch (e) {
        setDocuments([]);
      }
    };
    fetchDocuments();
  }, []);

  // Fetch graph when selectedPdfId changes
  useEffect(() => {
    const fetchGraph = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        const res = await axios.post(
          "http://localhost:5000/api/pdf/entities", // fixed endpoint
          { pdf_id: selectedPdfId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const graph = res.data.graph;
        if (graph && graph.nodes && graph.edges && graph.nodes.length > 0) {
          // Map your node/edge format to Cytoscape elements
          const cyNodes = graph.nodes.map((n:any) => ({ data: { id: n.id, label: n.label } }));
          const cyEdges = graph.edges.map((e:any) => ({ data: { source: e.source, target: e.target, label: e.label } }));
          setElements([...cyNodes, ...cyEdges]);
        } else {
          // Fallback: use mock data for debugging
          const cyNodes = [
            { data: { id: "Unknown", label: "Unknown" } },
            { data: { id: "Unknown", label: "Unknown" } },
            { data: { id: "Unknown", label: "Unknown" } },
            { data: { id: "Unknown", label: "Unknown" } },
          ];
          const cyEdges = [
            { data: { source: "Unknown", target: "Unknown", label: "unkown" } },
            { data: { source: "Unknown", target: "Unknown", label: "unkown" } },
            { data: { source: "Unknown", target: "Unknown", label: "unkown" } },
          ];
          setElements([...cyNodes, ...cyEdges]);
        }
      } catch (e) {
        // On error, show mock data for easier debugging
        const cyNodes = [
          { data: { id: "Unknown", label: "Unknown" } },
          { data: { id: "Unknown", label: "Unknown" } },
          { data: { id: "Unknown", label: "Unknown" } },
          { data: { id: "Unknown", label: "Unknown" } },
        ];
        const cyEdges = [
          { data: { source: "Unknown", target: "Unknown", label: "unkown" } },
          { data: { source: "Unknown", target: "Unknown", label: "unkown" } },
          { data: { source: "Unknown", target: "Unknown", label: "unkown" } },
        ];
        setElements([...cyNodes, ...cyEdges]);
      }
      setLoading(false);
    };
    if (selectedPdfId) fetchGraph();
  }, [selectedPdfId]);

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Knowledge Graph</h1>
      <div className="mb-4">
        <label htmlFor="pdf-select" className="mr-2 font-medium">Select PDF:</label>
        <select
          id="pdf-select"
          value={selectedPdfId ?? ""}
          onChange={e => setSelectedPdfId(Number(e.target.value))}
          className="border rounded px-2 py-1"
        >
          {documents.map(doc => (
            <option key={doc.id} value={doc.id}>
              {doc.filename}
            </option>
          ))}
        </select>
        
      </div>
      <div style={{ height: "600px", width: "100%" }}>
        {loading ? (
          <div className="flex items-center justify-center mt-2">
                <Loader2 className="animate-spin h-14 w-14 mr-2 text-blue-500" />
                <span className="text-lg text-blue-600">Loading...</span>
              </div>
        ) : (
          <CytoscapeComponent
            elements={elements}
            style={{ width: "100%", height: "600px" }}
            layout={{ name: "cose" }}
            stylesheet={[
              {
                selector: "node",
                style: {
                  label: "data(label)",
                  "background-color": "#0074D9",
                  color: "orange",
                  "text-valign": "center",
                  "text-halign": "center",
                  "font-size": "6px",
                  "text-wrap": "wrap",
                },
              },
              {
                selector: "edge",
                style: {
                  label: "data(label)",
                  "curve-style": "bezier",
                  "target-arrow-shape": "triangle",
                  "line-color": "#888",
                  "target-arrow-color": "#888",
                  "font-size": "6px",
                },
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}