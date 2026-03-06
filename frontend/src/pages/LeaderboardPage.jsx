import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, Medal, Zap, Timer } from "lucide-react";
import { getLeaderboard } from "@/api/sessionApi";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const LeaderboardPage = () => {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await getLeaderboard();
        if (response.success) {
          setLeaderboard(response.leaderboard || []);
        }
      } catch (error) {
        toast.error("Error loading leaderboard", { position: "top-center" });
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy size={24} className="text-yellow-500" />;
    if (rank === 2) return <Medal size={24} className="text-gray-400" />;
    if (rank === 3) return <Medal size={24} className="text-orange-600" />;
    return null;
  };

  const formatSeconds = (secs) => {
    const total = Number(secs) || 0;
    const min = Math.floor(total / 60);
    const sec = total % 60;
    return `${min}m ${sec}s`;
  };

  return (
    <div className="min-h-screen bg-[#edf4f2] p-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <Trophy size={64} className="mx-auto text-[#0f766e] mb-4" />
          <h1 className="text-4xl font-bold text-[#0f766e] mb-2">IPL Leaderboard</h1>
          <p className="text-gray-600">Ranking order: score, accuracy, fastest time, earliest achiever</p>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0f766e]" />
            <p className="mt-4 text-gray-600">Loading leaderboard...</p>
          </div>
        )}

        {!loading && leaderboard.length > 0 && (
          <Card className="shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0f766e] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Rank</th>
                    <th className="px-6 py-4 text-left font-semibold">Name</th>
                    <th className="px-6 py-4 text-center font-semibold">Best Score</th>
                    <th className="px-6 py-4 text-center font-semibold">Best Accuracy</th>
                    <th className="px-6 py-4 text-center font-semibold">Best Time</th>
                    <th className="px-6 py-4 text-center font-semibold">Attempts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leaderboard.map((entry, index) => (
                    <tr key={entry.user_id} className={`hover:bg-gray-50 transition-colors ${index < 3 ? "bg-yellow-50" : ""}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-[#0f766e]">#{index + 1}</span>
                          {getRankIcon(index + 1)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-800">{entry.name || "Anonymous"}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <p className="text-xl font-bold text-[#0f766e]">{entry.total_score}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Zap size={16} className="text-orange-500" />
                          <p className="font-semibold text-gray-700">{entry.accuracy}%</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Timer size={16} className="text-cyan-600" />
                          <p className="font-semibold text-gray-700">{formatSeconds(entry.best_time_taken)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <p className="font-semibold text-gray-700">{entry.total_attempts}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {!loading && leaderboard.length === 0 && (
          <Card className="p-8 text-center shadow-lg">
            <Trophy size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg mb-4">No leaderboard data yet</p>
            <p className="text-gray-500 mb-6">Be the first to complete an IPL quiz innings.</p>
          </Card>
        )}

        <div className="mt-8 text-center">
          <Button onClick={() => navigate("/start")} variant="outline" className="text-[#0f766e] border-[#0f766e]">
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
