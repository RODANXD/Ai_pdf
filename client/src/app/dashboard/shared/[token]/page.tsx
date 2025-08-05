"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

export default function SharedAnswerPage() {
  const { token } = useParams();
  const [answer, setAnswer] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`http://localhost:5000/api/qa/shared/${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.answer) {
          setAnswer(data.answer);
          setCreatedAt(data.created_at);
        } else {
          setError("Invalid or expired link.");
          toast.error("Invalid or expired link.");
        }
      })
      .catch(() => {
        setError("Failed to fetch answer.")
    toast.error("Failed to fetch answer.")});
  }, [token]);

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-xl font-bold mb-4">Shared Answer</h1>
      {error && <div className="text-red-500">{error}</div>}
      {answer && (
        <>
          <pre className="whitespace-pre-wrap mb-2">{answer}</pre>
          {createdAt && (
            <div className="text-xs text-gray-500">Shared at: {new Date(createdAt).toLocaleString()}</div>
          )}
        </>
      )}
      {!answer && !error && <div>Loading...</div>}
    </div>
  );
}