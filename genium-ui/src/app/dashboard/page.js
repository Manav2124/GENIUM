"use client";
import Image from "next/image";

import { getSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserData } from "@/components/UserDataContext";
import { useSession } from "next-auth/react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { uploadedFiles, queries } = useUserData();

  useEffect(() => {
    if (status === "loading") {
      setLoading(true);
    } else if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    } else if (status === "authenticated") {
      setLoading(false);
    }
  }, [status, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const user = session.user;

  // Calculate stats
  const totalDocuments = uploadedFiles.length;
  const totalQueries = queries.length;
  const recentQueries = queries.slice(-5).reverse(); // Last 5 queries

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-6 py-16 pt-32">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-text-primary dark:text-white">
              Dashboard
            </h1>
            <p className="text-lg text-text-secondary dark:text-gray-300">
              Welcome back! Here's your personalized dashboard.
            </p>
          </div>

          <div className="bg-surface dark:bg-surface-dark rounded-lg p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4 mb-6">
              <Image
                src={
                  user.image ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.username || "User")}&background=random&color=fff&size=80`
                }
                alt="User Avatar"
                width={80}
                height={80}
                className="w-20 h-20 rounded-full border-2 border-primary/20"
              />
              <div>
                <h2 className="text-2xl font-semibold text-text-primary dark:text-white">
                  Welcome, {user.name || user.username || "User"}!
                </h2>
                <p className="text-text-secondary dark:text-gray-400">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-accent/10 dark:bg-accent/5 rounded-lg p-6 border border-accent/20">
                <h3 className="text-lg font-medium mb-2 text-text-primary dark:text-white">
                  Recent Activity
                </h3>
                <p className="text-text-secondary dark:text-gray-400">
                  {recentQueries.length > 0
                    ? `${recentQueries.length} recent queries`
                    : "No recent activity yet."}
                </p>
              </div>

              <div className="bg-accent/10 dark:bg-accent/5 rounded-lg p-6 border border-accent/20">
                <h3 className="text-lg font-medium mb-2 text-text-primary dark:text-white">
                  Documents
                </h3>
                <p className="text-text-secondary dark:text-gray-400">
                  {totalDocuments} document{totalDocuments !== 1 ? "s" : ""}{" "}
                  uploaded.
                </p>
              </div>

              <div className="bg-accent/10 dark:bg-accent/5 rounded-lg p-6 border border-accent/20">
                <h3 className="text-lg font-medium mb-2 text-text-primary dark:text-white">
                  Usage Stats
                </h3>
                <p className="text-text-secondary dark:text-gray-400">
                  {totalQueries} quer{totalQueries !== 1 ? "ies" : "y"} this
                  session.
                </p>
              </div>
            </div>

            {/* Recent Queries Section */}
            {recentQueries.length > 0 && (
              <div className="bg-accent/10 dark:bg-accent/5 rounded-lg p-6 border border-accent/20">
                <h3 className="text-lg font-medium mb-4 text-text-primary dark:text-white">
                  Recent Queries
                </h3>
                <div className="space-y-3">
                  {recentQueries.map((query) => (
                    <div
                      key={query.id}
                      className="bg-white dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-600"
                    >
                      <p className="text-sm font-medium text-text-primary dark:text-white mb-1">
                        {query.question}
                      </p>
                      <div className="flex items-center justify-between text-xs text-text-secondary dark:text-gray-400">
                        <span>{new Date(query.askedAt).toLocaleString()}</span>
                        {query.globalSearch && (
                          <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                            Global Search
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Uploaded Files Section */}
            {uploadedFiles.length > 0 && (
              <div className="bg-accent/10 dark:bg-accent/5 rounded-lg p-6 border border-accent/20 mt-6">
                <h3 className="text-lg font-medium mb-4 text-text-primary dark:text-white">
                  Uploaded Files
                </h3>
                <div className="space-y-3">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="bg-white dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-text-primary dark:text-white">
                            {file.name}
                          </p>
                          <p className="text-xs text-text-secondary dark:text-gray-400">
                            {(file.size / 1024 / 1024).toFixed(2)} MB •{" "}
                            {new Date(file.uploadedAt).toLocaleString()}
                          </p>
                        </div>
                        <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                          Uploaded
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}