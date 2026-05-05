import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import type { EnquiryLead, EnquiryQuote } from "@/components/EnquiryFeed";

export interface RecentEnquiriesData {
  leads: EnquiryLead[];
  quotes: EnquiryQuote[];
  todayNewLeadCount: number;
  todayNewQuoteCount: number;
}

export function useEnquiryNotifications() {
  const { toast } = useToast();
  const { user } = useAuth() as { user: User | undefined };
  const isAdmin = !!(user?.adminRole && user.adminRole !== "none");

  const { data: recentEnquiries } = useQuery<RecentEnquiriesData>({
    queryKey: ["/api/admin/enquiries/recent"],
    enabled: isAdmin,
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
  });

  const unreadCount =
    (recentEnquiries?.todayNewLeadCount ?? 0) +
    (recentEnquiries?.todayNewQuoteCount ?? 0);

  // Request browser notification permission once after the first successful
  // data load, but only if the user has not already been asked.
  useEffect(() => {
    if (!recentEnquiries) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      const alreadyAsked = localStorage.getItem("enquiry-notif-asked");
      if (!alreadyAsked) {
        localStorage.setItem("enquiry-notif-asked", "1");
        Notification.requestPermission();
      }
    }
  }, [!!recentEnquiries]);

  // Fire a toast (and optionally a browser notification) whenever the unread
  // count grows since the last poll. The very first load just sets the
  // baseline — no alert on page load.
  const prevUnreadRef = useRef<number | null>(null);

  useEffect(() => {
    if (!recentEnquiries) return;
    const current =
      (recentEnquiries.todayNewLeadCount ?? 0) +
      (recentEnquiries.todayNewQuoteCount ?? 0);

    if (prevUnreadRef.current === null) {
      prevUnreadRef.current = current;
      return;
    }

    const delta = current - prevUnreadRef.current;
    if (delta > 0) {
      prevUnreadRef.current = current;

      const title =
        delta === 1 ? "New enquiry received" : `${delta} new enquiries received`;
      const body =
        delta === 1
          ? "A new lead or quote has just come in."
          : `${delta} new leads or quotes have just come in.`;

      toast({ title, description: body });

      if (
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        try {
          new Notification(title, {
            body,
            icon: "/favicon.ico",
            tag: "new-enquiry",
          });
        } catch {
          // silently ignore — browser may block notifications in some contexts
        }
      }
    } else {
      prevUnreadRef.current = current;
    }
  }, [recentEnquiries, toast]);

  return { recentEnquiries, unreadCount };
}
