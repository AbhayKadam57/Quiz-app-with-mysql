import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, Medal, Zap } from "lucide-react";
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
        console.log(response.leaderboard);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
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

  return (
    <div className="min-h-screen bg-[#e8ebea] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Trophy size={64} className="mx-auto text-[#2c8c72] mb-4" />
          <h1 className="text-4xl font-bold text-[#2c8c72] mb-2">
            Leaderboard
          </h1>
          <p className="text-gray-600">Top performers in the quiz challenge</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c8c72]"></div>
            <p className="mt-4 text-gray-600">Loading leaderboard...</p>
          </div>
        )}

        {/* Leaderboard Table */}
        {!loading && leaderboard.length > 0 && (
          <Card className="shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#2c8c72] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Rank</th>
                    <th className="px-6 py-4 text-left font-semibold">Name</th>
                    <th className="px-6 py-4 text-center font-semibold">
                      Score
                    </th>
                    <th className="px-6 py-4 text-center font-semibold">
                      Accuracy
                    </th>
                    {/* <th className="px-6 py-4 text-center font-semibold">
                      Attempts
                    </th> */}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leaderboard.map((entry, index) => (
                    <tr
                      key={entry.user_id}
                      className={`hover:bg-gray-50 transition-colors ${
                        index < 3 ? "bg-yellow-50" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-[#2c8c72]">
                            #{index + 1}
                          </span>
                          {getRankIcon(index + 1)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-800">
                          {entry.name || "Anonymous"}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <p className="text-xl font-bold text-[#2c8c72]">
                          {entry.total_score}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Zap size={16} className="text-orange-500" />
                          <p className="font-semibold text-gray-700">
                            {entry.accuracy}%
                          </p>
                        </div>
                      </td>
                      {/* <td className="px-6 py-4 text-center">
                        <p className="font-semibold text-gray-700">
                          {entry.total_attempts}
                        </p>
                      </td> */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!loading && leaderboard.length === 0 && (
          <Card className="p-8 text-center shadow-lg">
            <Trophy size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg mb-4">
              No leaderboard data yet
            </p>
            <p className="text-gray-500 mb-6">
              Be the first to complete the quiz!
            </p>
          </Card>
        )}

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => navigate("/start")}
            variant="outline"
            className="text-[#2c8c72] border-[#2c8c72]"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
